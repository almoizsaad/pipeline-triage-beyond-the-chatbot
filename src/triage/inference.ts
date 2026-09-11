import type { Deal } from './deals';

// ---------------------------------------------------------------------------
// This is the "intent inference" layer described in ARCHITECTURE.md.
// It is a rule-based scoring engine, not a lookup table of hardcoded deal
// IDs — the same function runs over any Deal object and produces a risk
// score, a confidence level, and a recommended action type. Swapping the
// dataset (a real CRM export) requires zero code changes here.
// ---------------------------------------------------------------------------

export type ActionType =
  | 'draft_reengagement_email'
  | 'flag_champion_gap'
  | 'escalate_competitor_risk'
  | 'no_action_on_track';

export interface Signal {
  label: string;
  weight: number;
  triggered: boolean;
  detail: string;
}

export interface Recommendation {
  deal: Deal;
  riskScore: number; // 0-100
  confidence: number; // 0-1
  action: ActionType;
  actionLabel: string;
  signals: Signal[];
}

// A competitor mention only escalates to a human when the overall risk
// clears this bar. Below it, the system's own re-engagement email is
// treated as the sufficient first move.
const ESCALATION_RISK_THRESHOLD = 50;

// Per-deal, per-signal weight multipliers. Populated at runtime when a rep
// overrides the system's ranking (see TriagePage's "Not the priority" path)
// — the signal that drove the wrong call gets down-weighted for that
// account going forward, within the session.
export type SignalOverrides = Record<string, Record<string, number>>;

function scoreDeal(deal: Deal, overridesForDeal: Record<string, number> = {}): Recommendation {
  const mult = (label: string) => overridesForDeal[label] ?? 1;

  const signals: Signal[] = [
    {
      label: 'Silence vs. close date',
      weight: Math.round(
        Math.min(40, deal.daysSinceLastContact * 3 + Math.max(0, 15 - deal.daysToCloseDate) * 2) *
          mult('Silence vs. close date')
      ),
      triggered: deal.daysSinceLastContact >= 5 && deal.daysToCloseDate <= 21,
      detail: `${deal.daysSinceLastContact}d since last contact, ${deal.daysToCloseDate}d to close date`,
    },
    {
      label: 'Champion changed',
      weight: Math.round((deal.championChanged ? 35 : 0) * mult('Champion changed')),
      triggered: deal.championChanged,
      detail: deal.championChanged
        ? 'Primary contact changed — new stakeholder is unbriefed'
        : 'Champion stable',
    },
    {
      label: 'Competitor mentioned',
      weight: Math.round((deal.competitorMentioned ? 20 : 0) * mult('Competitor mentioned')),
      triggered: deal.competitorMentioned,
      detail: deal.competitorMentioned
        ? 'Competitor referenced in notes/calls'
        : 'No competitor signal',
    },
    {
      label: 'Engagement drop',
      weight: Math.round((deal.emailOpens7d === 0 ? 15 : 0) * mult('Engagement drop')),
      triggered: deal.emailOpens7d === 0,
      detail: `${deal.emailOpens7d} email opens in last 7 days`,
    },
  ];

  const riskScore = Math.min(100, signals.reduce((s, sig) => s + (sig.triggered ? sig.weight : 0), 0));
  const triggeredCount = signals.filter((s) => s.triggered).length;
  const confidence = Math.min(0.97, 0.45 + triggeredCount * 0.15);

  let action: ActionType = 'no_action_on_track';
  let actionLabel = 'On track — no action needed';

  if (deal.championChanged) {
    // A new, unbriefed stakeholder needs a human conversation — this can't
    // be automated away, so it always takes priority over the other signals.
    action = 'flag_champion_gap';
    actionLabel = 'Brief the new stakeholder before next touchpoint';
  } else if (deal.competitorMentioned && riskScore >= ESCALATION_RISK_THRESHOLD) {
    // A serious competitive threat needs a human judgment call (pricing,
    // positioning) — only escalate once the combined risk is high enough
    // that a routine check-in email clearly isn't a sufficient response.
    action = 'escalate_competitor_risk';
    actionLabel = 'Loop in sales lead — competitive risk';
  } else if (deal.daysSinceLastContact >= 5 && deal.daysToCloseDate <= 21) {
    // The default, automatable response to silence near a close date: draft
    // the check-in email now, let the rep approve it.
    action = 'draft_reengagement_email';
    actionLabel = 'Send re-engagement email (drafted below)';
  }

  return { deal, riskScore, confidence, action, actionLabel, signals };
}

export function rankDeals(deals: Deal[], overrides: SignalOverrides = {}): Recommendation[] {
  return deals.map((d) => scoreDeal(d, overrides[d.id] ?? {})).sort((a, b) => b.riskScore - a.riskScore);
}

// The one action the interface initiates on its own: a draft follow-up
// email for the top at-risk deal, generated from the deal's own signals.
// It is never sent automatically — it waits in a review state.
export function draftReengagementEmail(rec: Recommendation): { subject: string; body: string } {
  const { deal } = rec;
  const firstName = deal.contact.split(' ')[0];
  return {
    subject: `Quick check-in on ${deal.dealname.split('—')[0].trim()}`,
    body: `Hi ${firstName},

Wanted to check in — it's been ${deal.daysSinceLastContact} days since we last connected, and I know ${deal.company} is working toward a decision around ${deal.daysToCloseDate} days out.

${deal.lastActivityNote}

Happy to jump on a quick call this week if it's useful, or send over anything that would help your team decide. Let me know what's most helpful right now.

Best,
[Your name]`,
  };
}
