import { describe, it, expect } from 'vitest';
import { rankDeals, draftReengagementEmail } from '../inference';
import type { Deal } from '../deals';

function makeDeal(overrides: Partial<Deal>): Deal {
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
