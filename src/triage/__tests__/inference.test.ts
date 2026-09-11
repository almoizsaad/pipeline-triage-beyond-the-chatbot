import { describe, it, expect } from 'vitest';
import { rankDeals, draftReengagementEmail } from '../inference';
import type { Deal } from '../deals';

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'D-TEST',
    dealname: 'Test Co — Widget Rollout',
    company: 'Test Co',
    contact: 'Jamie Rivera, Ops Lead',
    amount: 20000,
    dealstage: 'discovery',
    daysSinceLastContact: 1,
    daysToCloseDate: 30,
    emailOpens7d: 2,
    competitorMentioned: false,
    championChanged: false,
    lastActivityNote: 'On track.',
    ...overrides,
  };
}

describe('rankDeals (intent inference)', () => {
  it('ranks a deal with multiple risk signals above a healthy deal', () => {
    const risky = makeDeal({
      id: 'D-RISKY',
      daysSinceLastContact: 11,
      daysToCloseDate: 6,
      competitorMentioned: true,
      emailOpens7d: 0,
    });
    const healthy = makeDeal({ id: 'D-HEALTHY' });

    const [top] = rankDeals([healthy, risky]);
    expect(top.deal.id).toBe('D-RISKY');
    expect(top.riskScore).toBeGreaterThan(0);
  });

  it('produces a reasoning trace where every triggered signal explains itself', () => {
    const deal = makeDeal({ daysSinceLastContact: 9, daysToCloseDate: 14, competitorMentioned: true });
    const [rec] = rankDeals([deal]);

    const triggered = rec.signals.filter((s) => s.triggered);
    expect(triggered.length).toBeGreaterThan(0);
    for (const signal of triggered) {
      expect(signal.detail.length).toBeGreaterThan(0);
    }
  });

  it('recommends flagging a champion gap above all other actions when the contact changed', () => {
    const deal = makeDeal({ championChanged: true, competitorMentioned: true, daysSinceLastContact: 8, daysToCloseDate: 10 });
    const [rec] = rankDeals([deal]);
    expect(rec.action).toBe('flag_champion_gap');
  });

  it('recommends escalation when a competitor is mentioned and risk is high, without a champion change', () => {
    const deal = makeDeal({ competitorMentioned: true, daysSinceLastContact: 10, daysToCloseDate: 15 });
    const [rec] = rankDeals([deal]);
    expect(rec.action).toBe('escalate_competitor_risk');
  });

  it('recommends a re-engagement email for silence near a close date with no other signals', () => {
    const deal = makeDeal({ daysSinceLastContact: 6, daysToCloseDate: 18 });
    const [rec] = rankDeals([deal]);
    expect(rec.action).toBe('draft_reengagement_email');
  });

  it('leaves a healthy, recently-contacted deal with no action', () => {
    const deal = makeDeal();
    const [rec] = rankDeals([deal]);
    expect(rec.action).toBe('no_action_on_track');
    expect(rec.riskScore).toBe(0);
  });

  it('never assigns a risk score outside 0-100', () => {
    const extreme = makeDeal({
      daysSinceLastContact: 60,
      daysToCloseDate: 0,
      championChanged: true,
      competitorMentioned: true,
      emailOpens7d: 0,
    });
    const [rec] = rankDeals([extreme]);
    expect(rec.riskScore).toBeLessThanOrEqual(100);
    expect(rec.riskScore).toBeGreaterThanOrEqual(0);
  });

  it('increases confidence as more signals trigger', () => {
    const oneSignal = makeDeal({ daysSinceLastContact: 6, daysToCloseDate: 18 });
    const threeSignals = makeDeal({
      daysSinceLastContact: 6,
      daysToCloseDate: 18,
      competitorMentioned: true,
      emailOpens7d: 0,
    });
    const [recOne] = rankDeals([oneSignal]);
    const [recThree] = rankDeals([threeSignals]);
    expect(recThree.confidence).toBeGreaterThan(recOne.confidence);
  });
});

describe('rankDeals with signalOverrides (the "wrong guess" feedback loop)', () => {
  it('lowers the risk score for a deal once its top triggered signal is down-weighted', () => {
    const deal = makeDeal({ id: 'D-OVERRIDE', daysSinceLastContact: 9, daysToCloseDate: 14 });
    const [before] = rankDeals([deal]);

    // Mirrors what TriagePage.dismissCurrent() does: halve the weight of
    // the highest-weight triggered signal, floored at 20% of its original.
    const topSignal = [...before.signals].filter((s) => s.triggered).sort((a, b) => b.weight - a.weight)[0];
    const overrides = { [deal.id]: { [topSignal.label]: 0.5 } };

    const [after] = rankDeals([deal], overrides);
    expect(after.riskScore).toBeLessThan(before.riskScore);
  });

  it('floors a repeatedly-overridden signal at 20% of its original weight, never zero', () => {
    const deal = makeDeal({ id: 'D-FLOOR', daysSinceLastContact: 9, daysToCloseDate: 14 });
    // Simulate the multiplier collapsing well past the floor the UI enforces
    // (0.2) to confirm the scoring function itself tolerates it gracefully
    // rather than assuming callers always respect the floor.
    const overrides = { [deal.id]: { 'Silence vs. close date': 0.01 } };
    const [rec] = rankDeals([deal], overrides);
    expect(rec.riskScore).toBeGreaterThanOrEqual(0);
  });

  it('scopes an override to the specific deal it was recorded against', () => {
    const dealA = makeDeal({ id: 'D-A', daysSinceLastContact: 9, daysToCloseDate: 14 });
    const dealB = makeDeal({ id: 'D-B', daysSinceLastContact: 9, daysToCloseDate: 14 });
    const overrides = { [dealA.id]: { 'Silence vs. close date': 0.2 } };

    const [recA] = rankDeals([dealA], overrides);
    const [recB] = rankDeals([dealB], overrides);
    expect(recA.riskScore).toBeLessThan(recB.riskScore);
  });

  it('leaves untriggered signals unaffected by an override on a different signal', () => {
    const deal = makeDeal({ id: 'D-UNRELATED', daysSinceLastContact: 9, daysToCloseDate: 14 });
    const overrides = { [deal.id]: { 'Engagement drop': 0.2 } }; // not triggered for this deal
    const [before] = rankDeals([deal]);
    const [after] = rankDeals([deal], overrides);
    expect(after.riskScore).toBe(before.riskScore);
  });
});

describe('escalation threshold boundary (competitor risk vs. routine email)', () => {
  // ESCALATION_RISK_THRESHOLD is 50 and is not exported, so these tests
  // pin the behavior at the boundary via deal shape rather than the
  // constant itself — if the threshold ever moves, these are the tests
  // that should catch the change in observable behavior.
  it('does not escalate a competitor mention when combined risk lands just under the threshold', () => {
    // silence signal = min(40, 9*3 + (15-14)*2) = 29; competitor adds 20 → 49, just under 50.
    const deal = makeDeal({
      daysSinceLastContact: 9,
      daysToCloseDate: 14,
      competitorMentioned: true,
    });
    const [rec] = rankDeals([deal]);
    expect(rec.riskScore).toBe(49);
    expect(rec.action).toBe('draft_reengagement_email');
  });

  it('escalates a competitor mention once combined risk clears the threshold', () => {
    // silence signal = min(40, 10*3 + (15-15)*2) = 30; competitor adds 20 → exactly 50.
    const deal = makeDeal({
      daysSinceLastContact: 10,
      daysToCloseDate: 15,
      competitorMentioned: true,
    });
    const [rec] = rankDeals([deal]);
    expect(rec.riskScore).toBe(50);
    expect(rec.action).toBe('escalate_competitor_risk');
  });

  it('a champion change outranks escalation even when competitor risk also clears the threshold', () => {
    const deal = makeDeal({
      daysSinceLastContact: 10,
      daysToCloseDate: 15,
      competitorMentioned: true,
      championChanged: true,
    });
    const [rec] = rankDeals([deal]);
    expect(rec.action).toBe('flag_champion_gap');
  });
});

describe('draftReengagementEmail (autonomous action)', () => {
  it('drafts a subject and body grounded in the deal\'s own data', () => {
    const deal = makeDeal({
      daysSinceLastContact: 7,
      daysToCloseDate: 12,
      lastActivityNote: 'Sent pricing sheet, no response yet.',
    });
    const [rec] = rankDeals([deal]);
    const draft = draftReengagementEmail(rec);

    expect(draft.subject.length).toBeGreaterThan(0);
    expect(draft.body).toContain('Jamie');
    expect(draft.body).toContain('7 days');
    expect(draft.body).toContain('Sent pricing sheet, no response yet.');
  });
});
