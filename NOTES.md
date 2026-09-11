# Notes

## AI tools used
Claude was used throughout: to build the `src/triage/` workflow (dataset,
inference engine, UI), to write the documentation set below, and — in the
final pass — to strip the repository down to only the files this submission
is graded on. That last pass is worth being explicit about, because it
changed the shape of the repo materially: an earlier iteration of this
project was a general-purpose "generative agent OS" (multi-agent planner,
memory/reflection system, a component registry, a CLI, a canvas workspace —
several hundred files, most of the repo's size). None of it shipped in the
graded app, and keeping it around "for reference" was itself a problem: it
made the repo's actual scope illegible to a reviewer and risked reading as
padding. It has been deleted outright rather than archived or excluded from
the build. What remains is the workflow itself, the three UI primitives it
renders with, and the app shell — nothing else.

## Key decisions
- **Picked one workflow and deleted everything else, rather than disabling
  or hiding it.** The original project's primary input was a free-text box
  (`window.prompt`) feeding a UI-generation engine — a demo of a UI-generation
  engine, not a solution to a job, and exactly the "chatbot in a fancy
  wrapper" pattern the brief disqualifies. The graded submission is now
  exactly one workflow: sales pipeline triage, with no free-text entry
  point anywhere in the app.
- **Rule-based inference, not an LLM call, for ranking.** The scoring logic
  in `inference.ts` is deterministic and fully inspectable rather than a
  prompt to a hosted model. This was a deliberate trade-off: it makes the
  "why this surfaced" panel exactly right every time (no hallucinated
  reasoning) and makes the demo run with zero API keys and zero network
  dependency. The trade-off is that it's less adaptive than an
  LLM-in-the-loop ranker — a real version of this product would likely use
  the rule engine as a fast, auditable first pass and an LLM for edge cases
  the rules don't cover (see THESIS.md for where that split is likely
  headed generally).
- **One autonomous action, human-gated.** The brief asks for at least one
  action the interface initiates on its own with human review. We limited
  this to exactly one (drafting the re-engagement email) rather than
  multiple autonomous actions, to keep the review/approval UX legible
  rather than turning the demo into another wall of AI output. The draft
  opens automatically as soon as that deal's card renders — no click is
  needed to see the autonomous step happen.
- **Action priority: a human-conversation need always outranks an
  automatable one.** When a deal triggers more than one signal, the
  decision of *which* action to show follows a deliberate order, not just
  "whichever check runs first in the code": a champion change always wins
  (a new, unbriefed stakeholder needs a real conversation, and no email
  draft substitutes for that); a competitor mention only escalates to a
  human once the combined risk clears a threshold (50/100) — below that,
  the system's own re-engagement email is treated as a sufficient first
  move rather than reflexively routing every competitive mention to a
  human. That boundary is pinned by tests at exactly 49 and exactly 50
  combined risk, not just "high" vs. "low" examples.
- **No router, no landing page, no state library.** The app is a single
  screen. `react-router-dom`, `@tanstack/react-query`, and `zustand` were
  all present in the earlier iteration and all removed here — none of them
  were doing anything for a one-screen app with no server data-fetching,
  and keeping them would have meant carrying dependencies whose only job
  was to sit unused.

## Dataset
Five deals, structured to mirror a real CRM export (field names follow the
HubSpot Deals API). Values are synthetic but were written to be internally
consistent (e.g. a deal flagged for "champion changed" has a note explaining
who left and when) rather than placeholder/lorem-ipsum data. A production
version would replace `src/triage/deals.ts` with a live CRM connector — the
inference and UI layers require no changes to consume that data, since both
operate on the same `Deal` interface.

## Out of scope
- Real CRM integration (HubSpot/Salesforce OAuth) — the dataset is static.
- Persisting "not the priority" corrections across sessions or across
  reps. Within a session, a correction does feed back into the ranking:
  the signal that drove the wrong call is down-weighted for that account
  and every subsequent re-rank reflects it (see FAILURE_TESTS.md). What's
  not built is writing that adjustment anywhere durable — it lives in
  React state and resets on reload.
- Actually sending email — "Approve & send" is simulated in the UI; no
  email provider is wired up.
- The earlier "generative agent OS" prototype described above. It is not
  in this repo in any form — no excluded directory, no dead route, nothing
  to clone past. If you're comparing against an earlier submission of this
  project and it looked substantially larger, that's why.
