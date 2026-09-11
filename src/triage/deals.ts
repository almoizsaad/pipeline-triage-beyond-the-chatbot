// Representative sample dataset, structured to mirror a real CRM export
// (field names follow the HubSpot Deals API: dealname, amount, dealstage,
// hs_lastmodifieddate, closedate, hubspot_owner_id). Values are synthetic
// but shaped like a real B2B SaaS pipeline — see NOTES.md.

export type DealStage =
  | 'discovery'
  | 'demo_scheduled'
  | 'proposal_sent'
  | 'negotiation'
  | 'verbal_commit';

export interface Deal {
  id: string;
  dealname: string;
  company: string;
  contact: string;
  amount: number;
  dealstage: DealStage;
  daysSinceLastContact: number;
  daysToCloseDate: number;
  emailOpens7d: number;
  competitorMentioned: boolean;
  championChanged: boolean;
  lastActivityNote: string;
}

export const DEALS: Deal[] = [
  {
    id: 'D-1042',
    dealname: 'Atlas Logistics — Fleet Analytics Rollout',
    company: 'Atlas Logistics',
    contact: 'Mariam Osei, VP Operations',
    amount: 84000,
    dealstage: 'negotiation',
    daysSinceLastContact: 11,
    daysToCloseDate: 6,
    emailOpens7d: 0,
    competitorMentioned: false,
    championChanged: false,
    lastActivityNote: 'Sent redlined MSA on Aug 29, no reply since.',
  },
  {
    id: 'D-1108',
    dealname: 'Kestrel Health — Clinic Scheduling',
    company: 'Kestrel Health',
    contact: 'Dr. Femi Adeyemi, Clinic Director',
    amount: 31000,
    dealstage: 'proposal_sent',
    daysSinceLastContact: 4,
    daysToCloseDate: 21,
    emailOpens7d: 3,
    competitorMentioned: false,
    championChanged: false,
    lastActivityNote: 'Proposal opened 3 times this week, no questions raised.',
  },
  {
    id: 'D-1156',
    dealname: 'Northbridge Retail — POS Migration',
    company: 'Northbridge Retail',
    contact: 'Layla Haddad, IT Director',
    amount: 152000,
    dealstage: 'verbal_commit',
    daysSinceLastContact: 2,
    daysToCloseDate: 9,
    emailOpens7d: 5,
    competitorMentioned: false,
    championChanged: true,
    lastActivityNote: 'Original champion (Omar) left company Sept 3. New contact Layla is unbriefed.',
  },
  {
    id: 'D-1201',
    dealname: 'Verdant Foods — Inventory Sync',
    company: 'Verdant Foods',
    contact: 'Tom Reyes, Ops Manager',
    amount: 18000,
    dealstage: 'discovery',
    daysSinceLastContact: 1,
    daysToCloseDate: 45,
    emailOpens7d: 2,
    competitorMentioned: false,
    championChanged: false,
    lastActivityNote: 'Discovery call scheduled for next week, on track.',
  },
  {
    id: 'D-1233',
    dealname: 'Solstice Media — Reporting Suite',
    company: 'Solstice Media',
    contact: 'Aisha Bello, Head of Data',
    amount: 47000,
    dealstage: 'demo_scheduled',
    daysSinceLastContact: 10,
    daysToCloseDate: 14,
    emailOpens7d: 1,
    competitorMentioned: true,
    championChanged: false,
    lastActivityNote: 'Demo booked but they asked to push it back once already.',
  },
];
