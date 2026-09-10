# Notes

## AI tools used
- Claude was used to review, clean up, and refocus this submission: removing
  unfocused scaffolding, writing the `src/triage/` workflow (dataset,
  inference engine, UI), and rewriting the documentation set below to match
  the challenge's exact deliverables.
- The underlying `src/agent/` generative-OS runtime (multi-agent planner,
  memory, reflection) was built in an earlier iteration of this project
  using a mix of AI-assisted coding tools. It is retained in the repo for
  transparency but is explicitly **out of scope** for grading — see below.

## Key decisions
- **Picked one workflow and cut everything else from the graded surface.**
  The original project was a general-purpose "type any intent, get a UI"
  system. That's a demo of a UI-generation engine, not a solution to a job
  — and its primary input was a free-text box (`window.prompt`), which
  risks reading as "a chatbot in a fancy wrapper." The graded submission is
  now exactly one workflow: sales pipeline triage, entered at `/triage`,
  with no free-text entry point in the primary flow.
- **Rule-based inference, not an LLM call, for ranking.** The scoring logic
  in `inference.ts` is deterministic and fully inspectable rather than a
  prompt to a hosted model. This was a deliberate trade-off: it makes the
  "why this surfaced" panel exactly right every time (no hallucinated
  reasoning) and makes the demo run with zero API keys and zero network
  dependency. The trade-off is that it's less adaptive than an
  LLM-in-the-loop ranker — a real version of this product would likely use
  the rule engine as a fast, auditable first pass and an LLM for edge cases
  the rules don't cover.
- **One autonomous action, human-gated.** The brief asks for at least one
  action the interface initiates on its own with human review. We limited
  this to exactly one (drafting the re-engagement email) rather than
  multiple autonomous actions, to keep the review/approval UX legible
  rather than turning the demo into another wall of AI output.

## Dataset
Five deals, structured to mirror a real CRM export (field names follow the
HubSpot Deals API). Values are synthetic but were written to be internally
consistent (e.g. a deal flagged for "champion changed" has a note explaining
who left and when) rather than placeholder/lorem-ipsum data. A production
version would replace `src/triage/deals.ts` with a live CRM connector — the
inference and UI layers require no changes to consume that data, since both
operate on the same `Deal` interface.

## Out of scope
- `src/agent/*` — the multi-agent planner/executor/memory/reflection system
  and its 300+ supporting files. This was the subject of the earlier,
  unfocused iteration of the project and is not part of the graded
  workflow. It still powers the legacy `/workspace` route, which is left
  running for reference but is not the submission.
- Real CRM integration (HubSpot/Salesforce OAuth) — the dataset is static.
- Persisting "not the priority" corrections back into the ranking weights
  across sessions — documented as a known limitation in FAILURE_TESTS.md.
- Actually sending email — "Approve & send" is simulated in the UI; no
  email provider is wired up.
