# Failure Test — Wrong-Guess Recovery

## Scenario: the system ranks the wrong deal as most urgent

The risk model is a heuristic, not ground truth. A deal can score high on
paper (e.g. 11 days of silence) while the rep already knows, from an
off-system conversation, that the client is simply on vacation and it's not
actually urgent.

### Steps to reproduce
1. Open `/triage`.
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
backend or apply to other reps looking at the same account. Documented as a
known limitation below.

## Other failure modes considered (not built, scoped out for time)

| Scenario | Would-be fallback | Status |
|---|---|---|
| CRM data source unreachable | Show last-cached ranking with a staleness badge | Not implemented — static dataset only |
| Two signals conflict (e.g. champion changed *and* deal on track) | Highest-weight signal wins; shown transparently in the signal list | Implemented — signal weights are additive and all triggered signals are listed |
| Rep dismisses every deal in a session | Queue-clear state ("every open decision reviewed") | Implemented |
| Correction doesn't persist across sessions or reps | Would need a per-rep/per-org override store on a backend | Not implemented — within-session only, see "Recovery quality" above |
