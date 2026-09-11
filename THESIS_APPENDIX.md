# Thesis Appendix: Where the Single-Decision-Surface Argument Is Weakest

THESIS.md makes the case for single-decision surfaces in ≤300 words, as the
brief requires. A 300-word thesis is a pitch, not an analysis — it's
optimized to be persuasive, not to survive its own scrutiny. This appendix
does the part a pitch can't: argue against itself, name where the pattern
already exists and why that matters, and commit to a falsifiable claim
instead of a comfortable one.

## This pattern is not new — it's under-credited

Single-decision surfaces aren't a 2026 invention waiting to be discovered;
they're the load-bearing UI pattern behind several categories that already
operate at scale, and their track record is the actual evidence for the
thesis — not the sales-triage demo in this repo, which is a toy by
comparison:

- **Ops on-call tooling (PagerDuty, Opsgenie).** One alert, one page, one
  ack/resolve/escalate decision. Nobody scrolls a dashboard of every metric
  at 3am; the system already decided what's worth waking a human for.
- **Fraud and trust & safety review queues.** A reviewer sees one flagged
  transaction or one flagged account at a time, with the triggering signals
  listed, not a table of all transactions ranked by a score column.
- **Radiology worklists.** AI-assisted triage now reorders which scan a
  radiologist looks at next based on suspected acuity — the radiologist
  still reads the full image, but *which image is next* is a machine
  decision, not a manual queue scan.

What's actually new is that this pattern is moving from operations,
security, and clinical contexts — domains that could justify the
engineering cost of a purpose-built triage system — into general knowledge
work, because LLMs make the "read messy context, extract a ranked signal"
step cheap enough to build for a sales pipeline, an inbox, or a code
review queue instead of just a SOC. The thesis isn't "this UI pattern
works," which is already proven; it's "the cost of building it just
dropped enough that it stops being reserved for high-stakes ops work."

## Where the pattern breaks down

A thesis that only lists winning conditions is marketing. Here's where
single-decision surfaces lose to a dashboard or even a chat box:

**Low-frequency, high-context tasks.** A sales rep triaging a pipeline
does it every day — the ranking model gets constant implicit feedback
(what gets dismissed, what gets acted on) and the rep builds trust in it
incrementally. A one-off task ("help me restructure this org chart") has
no repetition to build that trust on, and a single surfaced "decision"
can't carry enough context for something that inherently requires
exploring several options side by side. Single-decision surfaces compress
well; they don't parallelize well. Comparison, brainstorming, and
open-ended exploration are chat's actual home turf, and this thesis isn't
arguing chat disappears — see the "override, not primary interface" line
in THESIS.md — but it's worth being explicit that the domains where chat
stays dominant are large and won't shrink to zero.

**Irreversible, high-stakes single decisions.** The pattern here works
partly *because* the underlying action is cheap to review and reversible
before commit (a draft email, not a signed contract). A single card asking
"approve this $2M acquisition?" with three bullet points of "why this
surfaced" is not a responsible interface for that decision regardless of
how good the ranking model is — the format itself signals "quick call,"
and some decisions shouldn't feel quick. The pattern's legibility is a
feature at pipeline-triage stakes and a liability at board-decision stakes.

**Gameable inputs.** Every example in this repo's inference engine reads
signals the ranked entity doesn't control (days since contact, whether a
competitor was mentioned). The moment the ranked entity *can* influence
its own inputs — a support ticket queue ranking by "customer sentiment"
that customers learn to manipulate by escalating language, a code-review
queue ranking by "risk" that engineers learn to game by keeping diffs
artificially small — the transparency that makes single-decision surfaces
trustworthy (you can see why something ranked highly) becomes the same
thing that makes them exploitable (you can see exactly what to fake). This
repo's own dataset doesn't have this problem because the ranked entities
(sales deals) can't read their own risk score, but a lot of the domains
this pattern will expand into over the next two years — support queues,
hiring pipelines, content moderation — very much can.

**Deskilling and over-trust.** The same mechanism that makes single-decision
surfaces valuable — reducing what the human has to actively evaluate — is
the mechanism that erodes the human's ability to catch a wrong ranking
once they've stopped independently checking. This repo's own "why this
surfaced" panel is a partial defense (it keeps the reasoning visible even
when the human isn't independently deriving it) but partial is the honest
word. A rep who has clicked "Acknowledge" a thousand times without reading
the signal panel is not meaningfully different from a rep ignoring a
dashboard, just with fewer clicks. Interfaces in this category earn trust
by being right; they lose the *value* of that trust the moment being
right stops being checked.

## A falsifiable prediction, not a safe one

The easy version of this thesis ("AI interfaces will get smarter and more
personalized") is unfalsifiable and therefore not worth much. Here's a
version that can actually be wrong:

**By late 2027, at least one widely-used SaaS category that today ships a
dashboard-plus-search-box as its primary interface (CRM, project
management, or observability tooling are the most likely candidates) will
ship a single-decision-surface mode as a first-class, not experimental,
entry point — and adoption telemetry for that mode, if the vendor
publishes it, will show session lengths shrinking while task-completion
(actions taken per session) rises.** If instead the winning pattern turns
out to be dashboards with an LLM-generated summary bolted to the top —
information-dense, still requiring the human to do the prioritizing, just
with better prose — that's evidence this thesis is wrong about *which*
part of the interface AI actually replaces. That outcome is plausible
enough to name here rather than only after the fact.

## What would make this repo's own approach look naive in two years

Rule-based scoring (see NOTES.md for why it was chosen here) is the right
call for a graded demo that needs to be auditable in thirty seconds. It is
very likely the wrong long-term architecture. The realistic trajectory is
a hybrid: deterministic rules for the cases they cover well (the four
signals here are legible and cheap), with a learned or LLM-based layer
handling the residual cases that don't fit clean thresholds — a champion
change that's actually fine because the new contact was CC'd on every
email for six months, a competitor mention that's the rep's own joke, not
a real signal. A system that's still purely rule-based in two years hasn't
kept up; a system that's purely a black-box model with no equivalent of
this repo's "why this surfaced" panel has traded the one property
(legibility) that this thesis argues is what actually earns user trust.
Both failure directions are visible from here — the interesting work is
in not picking either one by default.
