# Failure Test — Wrong-Guess Recovery

## Scenario: the system ranks the wrong deal as most urgent

The risk model is a heuristic, not ground truth. A deal can score high on
paper (e.g. 11 days of silence) while the rep already knows, from an
off-system conversation, that the client is simply on vacation and it's not
actually urgent.

### Steps to reproduce
1. Open `/triage`.
2. The top card shows the highest-`riskScore` deal (currently
   "Atlas Logistics — Fleet Analytics Rollout", risk 90+, flagged for a
   re-engagement email).
3. Click **"Not the priority."**

### What happens
- The deal is **demoted**, not deleted — it moves to the back of the queue
  rather than disappearing, so it isn't silently dropped if the rep is wrong
  about it being safe.
- The correction is written to the **activity log** at the bottom of the
  screen: `Marked "..." as not urgent — demoted, next priority surfaced.`
  This creates a visible audit trail of every time the model's ranking was
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
  bottom, so if every other deal gets resolved, the rep still sees it rather
  than losing it.

### Recovery quality
Graceful: one click, no loss of context, visible log entry, immediate next
step. The realistic gap in a production version of this would be that the
correction should also feed back into `inference.ts` (e.g. lower the weight
of "silence vs. close date" for that specific account going forward) —
today the demotion is per-session only. Documented as a known limitation
below.

## Other failure modes considered (not built, scoped out for time)

| Scenario | Would-be fallback | Status |
|---|---|---|
| CRM data source unreachable | Show last-cached ranking with a staleness badge | Not implemented — static dataset only |
| Two signals conflict (e.g. champion changed *and* deal on track) | Highest-weight signal wins; shown transparently in the signal list | Implemented — signal weights are additive and all triggered signals are listed |
| Rep dismisses every deal in a session | Queue-clear state ("every open decision reviewed") | Implemented |
| Correction doesn't persist across sessions | Would need to write back to `inference.ts` weights or a per-rep override store | Not implemented — see "Recovery quality" above |
