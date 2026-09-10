# Architecture Snapshot

## Pipeline

```
data ──────────────► intent inference ──────────► surfaced decision ──────────► action
```

### 1. Data — `src/triage/deals.ts`
A `Deal[]` array shaped like a real CRM export (field names mirror the HubSpot
Deals API: `dealname`, `amount`, `dealstage`, days-since-contact style
freshness fields). Five sample deals across five pipeline stages. Swapping
this for a live CRM connector means replacing this one file — nothing
downstream changes.

### 2. Intent inference — `src/triage/inference.ts`
`rankDeals(deals: Deal[])` runs a deterministic, weighted rule engine over
every deal:

| Signal | Trigger condition | Weight |
|---|---|---|
| Silence vs. close date | ≥5 days since contact AND ≤21 days to close | up to 40 |
| Champion changed | primary contact changed | 35 |
| Competitor mentioned | competitor referenced in notes | 20 |
| Engagement drop | 0 email opens in 7 days | 15 |

Each triggered signal contributes to a `riskScore` (0–100) and a `confidence`
value, and the combination of *which* signals fired determines the
`actionType` (draft an email, flag a champion gap, escalate competitive risk,
or "on track — no action"). This is inference, not a lookup table: the same
function scores any deal object, real or synthetic, and the reasoning trace
(`signals[]`) is returned alongside the score so the UI can show *why*.

### 3. Surfaced decision — `src/triage/TriagePage.tsx`
The ranked list is never rendered as a table by default. Only
`order[cursor]` — the current highest-risk undecided deal — is shown, as one
card: the deal, the triggered signals in plain language, the confidence
score, and the recommended action. The full table exists behind a collapsed
`<details>` disclosure specifically so a reviewer can compare it side-by-side
with the decision card.

### 4. Action — human-gated
- **Autonomous step:** for `draft_reengagement_email`, the system calls
  `draftReengagementEmail(rec)` and produces a subject + body before the rep
  asks.
- **Human gate:** the draft opens in an editable textarea. Nothing sends
  until the rep clicks "Approve & send." Any other recommended action
  (flag a champion gap, escalate) requires an explicit "Acknowledge."
- **Rejection path:** "Not the priority" demotes the deal, logs the
  correction, and immediately surfaces the next decision — see
  [FAILURE_TESTS.md](./FAILURE_TESTS.md).

## Why no chat box is in the loop

The rep never has to type a query to get here. The ranking, the reasoning,
and the drafted action all exist before the rep opens the tool — the only
inputs are two buttons per decision. A free-text box was deliberately left
out of the primary flow to avoid the "chatbot in a fancy wrapper" failure
mode described in the challenge brief.

## Legacy code in this repo

`src/agent/`, `src/components/generative-ui/`, and the `/workspace` route
are a broader "generative agent OS" prototype from an earlier iteration of
this project (free-text intent → dynamically generated UI). It is left in
the repo for reference but is **out of scope for this submission** — the
graded workflow is `/triage` only. See NOTES.md.
