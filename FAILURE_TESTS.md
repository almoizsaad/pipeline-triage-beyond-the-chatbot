# Failure Test — Wrong-Guess Recovery

## Scenario: the system ranks the wrong deal as most urgent

The risk model is a heuristic, not ground truth. A deal can score high on
paper (e.g. 11 days of silence) while the rep already knows, from an
off-system conversation, that the client is simply on vacation and it's not
actually urgent.

### Steps to reproduce
1. Open the app.
2. The top card shows the highest-`riskScore` deal (currently
   "Atlas Logistics — Fleet Analytics Rollout", risk 55, flagged for a
   re-engagement email — the draft is already open for review, no click
   needed to see it).
3. Click **"Not the priority."**

### What happens
- The deal is **demoted**, not deleted — it moves to the back of the queue
  rather than disappearing, so it isn't silently dropped if the rep is wrong
  about it being safe.
- The signal that drove the call is **down-weighted for that specific
  account**: the highest-weight triggered signal (e.g. "Silence vs. close
  date") has its weight halved (floor 20% of original) in `inference.ts`'s
  scoring for that deal, and the ranking is recomputed immediately — this
  is a real adjustment to the risk model's output, not just a queue reorder.
- The correction is written to the **activity log** at the bottom of the
  screen, naming both the demotion and which signal was down-weighted. This
  creates a visible audit trail of every time the model's ranking was
  overridden.
- The **next-highest-risk deal is surfaced immediately** — no dead end, no
  "are you sure," no modal. The rep keeps moving through the queue.

### What does *not* happen (and why that matters)
- The system does not ask the rep to explain why, and does not re-run any
  external action (no email un-sent, nothing rolled back) — because at the
  point of dismissal nothing irreversible has happened yet. The human gate
  (see ARCHITECTURE.md) means the only thing "wrong guess" recovery has to
  undo is *attention*, not *action*.
- The demoted deal is not permanently hidden: it re-enters the queue at the
  bottom, so if every other deal gets resolved, the rep still sees it — now
  correctly reflecting the lower risk score from the down-weighted signal,
  rather than the same misleading high score that caused the wrong call.

### Recovery quality
Graceful: one click, no loss of context, visible log entry, immediate next
step, and the model's own scoring for that account actually adapts. The
realistic gap in a production version of this is that the adjustment lives
only in React state for the current session — it does not persist to a
backend or apply to other reps looking at the same account. See "What a
production system would need" below.

## Other failure modes considered (not built, scoped out for time)

| Scenario | Would-be fallback | Status |
|---|---|---|
| CRM data source unreachable | Show last-cached ranking with a staleness badge | Not implemented — static dataset only |
| Two signals conflict (e.g. champion changed *and* deal on track) | Highest-weight signal wins; shown transparently in the signal list | Implemented — signal weights are additive and all triggered signals are listed |
| Rep dismisses every deal in a session | Queue-clear state ("every open decision reviewed") | Implemented |
| Correction doesn't persist across sessions or reps | Would need a per-rep/per-org override store on a backend | Not implemented — within-session only, see below |

---

## A deeper look: what "wrong guess" actually means here

Most failure-thinking sections for interfaces like this stop at "there's an
undo button." That's necessary but it isn't the interesting part. The
interesting part is that "the system guessed wrong" is not one failure
mode — it's at least four, and they need different recoveries, because
they imply different things about *why* the system was wrong:

### 1. Stale data (the model was right about the signal, wrong about the world)
The "silence vs. close date" signal fired correctly — the rep genuinely
hasn't emailed in 11 days — but the *reason* isn't visible to the system
(the client said "check back after the 15th" on a phone call). This is the
scenario built above. The correct response is exactly what's implemented:
demote, don't distrust the signal generally, just discount it for this
account. The rep has private context the system structurally cannot have;
the fix is narrow and local.

### 2. Miscalibrated weights (the model is systematically wrong, not just wrong here)
If reps dismiss "champion changed" as not-urgent across many *different*
accounts, that's not four instances of scenario 1 — it's evidence the
weight (35, hardcoded) is too high in this org's context, maybe because
this sales team's process already has a formal handoff step that makes a
champion change routine rather than risky. This repo's per-deal override
doesn't detect or respond to that pattern; it only ever discounts one
account at a time. A production version would need to aggregate corrections
*across* accounts and flag "this signal has been overridden 8 times this
month — review the weight" as a distinct, second-order recommendation to
whoever owns the model, not just to the rep clicking through their queue.
That's a different UI surface entirely (a model-health view, not a
decision card) and a real gap in what's built here.

### 3. Adversarial or incentive-driven overrides (the rep is wrong, not the model)
"Not the priority" is a one-click, unaudited-beyond-a-log-line action. A rep
behind on quota has an incentive to demote every deal that would otherwise
force an uncomfortable conversation (e.g. escalating a competitor risk to
their manager). Nothing in this build distinguishes a legitimate correction
from a rep avoiding accountability — the activity log makes the *action*
visible but not necessarily *reviewable* by anyone but the rep themselves.
A production version would need the correction log to be visible to a
manager or aggregated into a "override rate per rep" metric, precisely so
that a high override rate becomes its own signal, the same way an unusually
low response rate on a support queue gets flagged. This is the failure mode
most "AI copilot" demos skip entirely, because it only shows up once the
system is trusted enough that overriding it has stakes.

### 4. Confidence miscalibration (the model is right that something's wrong, wrong about how wrong)
`confidence` here is a simple function of how many signals triggered
(`0.45 + 0.15 × triggered_count`, capped at 0.97) — it measures agreement
between simple heuristics, not the model's actual accuracy against outcomes.
Two signals triggering doesn't mean the deal is twice as likely to be lost;
it means two independent heuristics happen to agree. A system that's been
running for a quarter should replace this with confidence calibrated
against realized outcomes (did deals scored ≥70 actually slip more than
deals scored 30–50?) — otherwise "94% confidence" is a number that *sounds*
rigorous but isn't earning that precision. This build doesn't pretend
otherwise: the confidence shown is honestly a heuristic-agreement count,
not a calibrated probability, and a production rollout should not present
it with more authority than that.

## What a production system would need

Ranked by what would break first if this went from a demo to something a
sales team actually used daily:

1. **A durable override store**, keyed by (account, signal, rep or team),
   so corrections survive a reload and are shared across the team looking
   at the same account — the single biggest gap between this build and a
   real tool, and the reason the current implementation is explicit that
   the adjustment "lives only in React state."
2. **Override-rate monitoring**, per rep and per signal, to catch failure
   modes 2 and 3 above — neither is visible from inside a single rep's
   queue, only in aggregate.
3. **Outcome-linked confidence calibration** — replace the
   triggered-signal-count heuristic with a number that's actually been
   checked against which flagged deals really did slip or get lost.
4. **A staleness/unreachable-data state** for when the CRM connector this
   demo doesn't have goes down — silently showing an old ranking as current
   is worse than showing nothing.

None of these are hard to name. What's harder, and what this section is
really arguing, is that "failure thinking" for a system like this isn't
complete until it accounts for *why* the system was wrong, because the
fix for "the model had stale context on this one account" (a same-session
weight discount) is close to useless against "the model is systematically
over-weighting a signal" or "a rep is gaming the override," and a demo
that only builds the first kind of recovery — the easy, satisfying,
one-click kind — hasn't actually stress-tested the interface, it's
stress-tested the happy path of the interface's own escape hatch.
