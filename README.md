# Pipeline Triage — Beyond the Chatbot

**Workflow replaced:** a sales rep's morning routine of scanning a CRM dashboard (or asking a chatbot "which deals need attention?") to figure out what to do next.

**What this is instead:** an interface that reads the pipeline itself, ranks deals by risk, and surfaces exactly one decision at a time — with a recommended action already drafted, waiting for a human yes/no.

## Live demo

`<ADD YOUR DEPLOYED URL HERE AFTER `npm run build` + deploy>`

Local: `npm install && npm run dev`, then open `http://localhost:5173/` (the root and `/#/triage` both load the tool directly — there's no separate landing page).

## The workflow, in one line

A rep opens the tool and instead of a table of every open deal, sees **one card**: the single highest-risk deal, why it's risky, and the action to take. Approve it, edit it, or tell the system it guessed wrong — then the next decision appears. Repeat until the queue is clear.

## Why this beats a dashboard + chatbot for this job

| | Dashboard | Chatbot | Pipeline Triage |
|---|---|---|---|
| Entry point | Every deal, every column, every day | Empty text box — you have to know what to ask | Nothing to type — the system already knows what's urgent |
| Cognitive load | Rep manually scans and prioritizes | Rep has to formulate the right question | Zero — one ranked decision at a time |
| Output | Raw data | Prose answer | A specific action, pre-drafted, one click from done |
| Autonomy | None | None (reactive only) | Drafts the follow-up email itself; rep approves |

The full pipeline table is still there — click **"Full pipeline (what this replaces)"** at the bottom of the triage screen — specifically so the contrast is visible in the same screen, not a separate screenshot you have to trust.

## Architecture: data → intent inference → surfaced decision → action

```
CRM deal records (src/triage/deals.ts)
        │
        ▼
Rule-based risk scoring (src/triage/inference.ts)
  • silence vs. close date
  • champion changed
  • competitor mentioned
  • engagement drop
  → riskScore (0–100), confidence, recommended action + reasoning trace
        │
        ▼
Surfaced decision (src/triage/TriagePage.tsx)
  • ONE card: highest-risk deal, why, and the action
  • not a table — the ranking + filtering already happened
        │
        ▼
Action, human-gated
  • autonomous: system drafts a re-engagement email
  • human: approve & send / edit the draft / dismiss the deal entirely
```

This is real inference, not a hardcoded per-deal script: `rankDeals()` in `inference.ts` runs the same weighted rule set over *any* `Deal` object. Swap in a real CRM export and the ranking logic doesn't change — see [ARCHITECTURE.md](./ARCHITECTURE.md) for the full breakdown and [FAILURE_TESTS.md](./FAILURE_TESTS.md) for what happens when it ranks wrong.

## The one autonomous action

For the top at-risk deal, the system **drafts** a re-engagement email from the deal's own signals (days since contact, close date, last activity note) before the rep asks for one. It is never sent automatically — it sits in an editable review state until the rep clicks "Approve & send."

## Failure / wrong-guess recovery

Click **"Not the priority"** on any card. The deal is demoted to the back of the queue, the signal that drove the call is down-weighted for that specific account (the ranking recomputes, it doesn't just reorder), and the correction is logged in the activity feed — the next-highest-risk deal appears immediately, no stall, no "why." Full scenario matrix in [FAILURE_TESTS.md](./FAILURE_TESTS.md).

## Two-year thesis

See [THESIS.md](./THESIS.md).

## Notes (AI usage, decisions, out of scope)

See [NOTES.md](./NOTES.md).

## Tech stack

React 19 + TypeScript + Vite + Tailwind + shadcn/ui, React Router. No backend required to run the demo — the CRM dataset is a static, realistically-structured sample (see NOTES.md). The repo also carries a larger generative-agent runtime (`src/agent/`) from an earlier iteration of this project; it is **not** part of the graded submission, has no route into it in the running app, and is excluded from the TypeScript build — see NOTES.md → "Out of scope."

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173/#/triage
```

## Build

```bash
npm run build
npm run preview   # sanity-check the production build locally
```
