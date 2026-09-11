# Two-Year Thesis: Post-Chatbot AI Interfaces

Chat is a fallback for when software doesn't know what you need. It
survived this long because most software genuinely didn't — a dashboard
shows everything and asks the human to prioritize, so a text box became
the escape hatch for anything the dashboard didn't anticipate. That excuse
is disappearing. Once a system can read its own data well enough to rank
what matters, asking the user to type a question is a regression, not a
feature.

Over the next two years the dominant AI-native interface pattern will be
**single-decision surfaces**: the system holds the full state (a pipeline,
an inbox, a codebase, a calendar), scores it against a small set of legible
signals, and shows the human exactly one thing at a time — the
highest-leverage decision, with a recommended action already prepared. The
chat box doesn't disappear; it becomes a rarely-used override for the
cases the ranking can't handle, not the primary interaction.

Three things will separate the winners from "dashboard with a ranking
column bolted on":

1. **Transparent scoring.** Users won't trust a black-box priority order.
   The signals behind a ranking need to be inspectable in one glance, the
   way this submission's "why this surfaced" panel is.
2. **Cheap disagreement.** If overriding the system costs more than one
   click, users route around it. Recovery must be as fast as the happy
   path — and must actually change future rankings, not just reorder the
   current queue.
3. **Action, not information.** The interface's job ends at "approved" or
   "dismissed," not at "here's what I found." Systems that stop at
   information delivery are chatbots with better typography.

The interfaces that win will be judged less on how much they can generate
and more on how little they ask the human to look at.

*(~260 words — THESIS_APPENDIX.md covers where this argument is weakest
and what would falsify it, beyond the brief's word limit here.)*
