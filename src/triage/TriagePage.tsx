import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  ShieldAlert,
  UserX,
  CheckCircle2,
  ThumbsDown,
  Pencil,
  Send,
  Undo2,
} from 'lucide-react';
import { DEALS } from './deals';
import { rankDeals, draftReengagementEmail, type Recommendation, type ActionType, type SignalOverrides } from './inference';

const ACTION_META: Record<ActionType, { icon: typeof Mail; tone: string }> = {
  draft_reengagement_email: { icon: Mail, tone: 'text-amber-600 border-amber-200 bg-amber-50' },
  flag_champion_gap: { icon: UserX, tone: 'text-rose-600 border-rose-200 bg-rose-50' },
  escalate_competitor_risk: { icon: ShieldAlert, tone: 'text-rose-600 border-rose-200 bg-rose-50' },
  no_action_on_track: { icon: CheckCircle2, tone: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
};

export default function TriagePage() {
  // Recomputed whenever a correction adjusts a signal's weight — the ranking
  // itself adapts, not just the queue order (see dismissCurrent below).
  const [signalOverrides, setSignalOverrides] = useState<SignalOverrides>({});
  const baseRecs = useMemo(() => rankDeals(DEALS, signalOverrides), [signalOverrides]);

  // Manually-demoted deals are pinned to the back of the queue regardless
  // of their (possibly still-high) score, on top of the base ranking.
  const [demotedIds, setDemotedIds] = useState<string[]>([]);
  const order = useMemo(() => {
    const byId = new Map(baseRecs.map((r) => [r.deal.id, r]));
    const active = baseRecs.filter((r) => !demotedIds.includes(r.deal.id));
    const demoted = demotedIds.map((id) => byId.get(id)).filter((r): r is Recommendation => !!r);
    return [...active, ...demoted];
  }, [baseRecs, demotedIds]);

  const [cursor, setCursor] = useState(0);
  const [emailState, setEmailState] = useState<'idle' | 'reviewing' | 'sent'>('idle');
  const [emailBody, setEmailBody] = useState('');
  const [correctionLog, setCorrectionLog] = useState<string[]>([]);

  const current = order[cursor];
  const remaining = order.length - cursor;

  // The one autonomous action: for a draft_reengagement_email deal, the
  // system drafts the email itself and opens it in review — no click
  // needed to trigger the draft. The human gate is "Approve & send".
  useEffect(() => {
    if (current?.action === 'draft_reengagement_email') {
      setEmailBody(draftReengagementEmail(current).body);
      setEmailState('reviewing');
    } else {
      setEmailState('idle');
    }
  }, [current?.deal.id, current?.action]);

  function acknowledgeCurrent() {
    advance();
  }

  // The "wrong guess" recovery path: the rep tells the system this deal is
  // not actually the priority. We demote it, log the correction, AND lower
  // the weight of whichever signal drove the call for this specific
  // account — so the ranking adapts within the session instead of making
  // the same call again once the deal resurfaces.
  function dismissCurrent() {
    if (!current) return;
    const topSignal = [...current.signals]
      .filter((s) => s.triggered)
      .sort((a, b) => b.weight - a.weight)[0];

    if (topSignal) {
      setSignalOverrides((prev) => {
        const forDeal = { ...(prev[current.deal.id] ?? {}) };
        const priorMultiplier = forDeal[topSignal.label] ?? 1;
        forDeal[topSignal.label] = Math.max(0.2, priorMultiplier * 0.5);
        return { ...prev, [current.deal.id]: forDeal };
      });
    }

    setCorrectionLog((log) => [
      topSignal
        ? `Marked "${current.deal.dealname}" as not urgent — demoted, and lowered the weight of "${topSignal.label}" for this account.`
        : `Marked "${current.deal.dealname}" as not urgent — demoted, next priority surfaced.`,
      ...log,
    ]);
    setDemotedIds((prev) => [...prev, current.deal.id]);
  }

  function advance() {
    setCursor((c) => Math.min(c + 1, order.length));
  }

  function sendEmail() {
    setEmailState('sent');
    setCorrectionLog((log) => [`Sent re-engagement email for "${current?.deal.dealname}".`, ...log]);
  }

  const done = cursor >= order.length;

  return (
    <div className="min-h-screen paper-texture" style={{ background: '#FDFCF8' }}>
      <header className="border-b border-stone-200/70 px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="text-sm font-semibold tracking-tight text-stone-800">Pipeline Triage</div>
        <div className="text-xs font-mono uppercase tracking-widest text-stone-400">
          {remaining > 0 ? `${remaining} decision${remaining === 1 ? '' : 's'} left` : 'queue clear'}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            What needs your attention right now
          </h1>
          <p className="text-stone-500 mt-2 leading-relaxed">
            Not a list of every deal — just the next decision, ranked by risk signals pulled from your pipeline,
            with a recommended action already drafted.
          </p>
        </div>

        {!done && current && (
          <DecisionCard
            key={current.deal.id}
            rec={current}
            emailState={current.action === 'draft_reengagement_email' ? emailState : 'idle'}
            emailBody={emailBody}
            onEmailBodyChange={setEmailBody}
            onAcknowledge={acknowledgeCurrent}
            onDismiss={dismissCurrent}
            onSend={sendEmail}
            onContinue={advance}
          />
        )}

        {done && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6 flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>Queue clear. Every open decision for today has been reviewed.</p>
            </CardContent>
          </Card>
        )}

        {correctionLog.length > 0 && (
          <div className="mt-10">
            <div className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">Activity log</div>
            <div className="space-y-1.5">
              {correctionLog.map((entry, i) => (
                <div key={i} className="text-sm text-stone-500 flex items-start gap-2">
                  <Undo2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-400" />
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}

        <details className="mt-12 text-sm text-stone-400">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest">
            Full pipeline (what this replaces)
          </summary>
          <div className="mt-3 border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-100 text-stone-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Deal</th>
                  <th className="text-left px-3 py-2 font-medium">Stage</th>
                  <th className="text-left px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Last contact</th>
                  <th className="text-left px-3 py-2 font-medium">Close in</th>
                </tr>
              </thead>
              <tbody>
                {DEALS.map((d) => (
                  <tr key={d.id} className="border-t border-stone-100">
                    <td className="px-3 py-2 text-stone-700">{d.dealname}</td>
                    <td className="px-3 py-2 text-stone-500">{d.dealstage.replace('_', ' ')}</td>
                    <td className="px-3 py-2 text-stone-500">${d.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-stone-500">{d.daysSinceLastContact}d ago</td>
                    <td className="px-3 py-2 text-stone-500">{d.daysToCloseDate}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-stone-400">
            This is the dashboard view a rep would otherwise scan manually every morning — nine columns,
            zero prioritization, no recommended action. The card above replaces it.
          </p>
        </details>
      </main>
    </div>
  );
}

function DecisionCard({
  rec,
  emailState,
  emailBody,
  onEmailBodyChange,
  onAcknowledge,
  onDismiss,
  onSend,
  onContinue,
}: {
  rec: Recommendation;
  emailState: 'idle' | 'reviewing' | 'sent';
  emailBody: string;
  onEmailBodyChange: (v: string) => void;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onSend: () => void;
  onContinue: () => void;
}) {
  const meta = ACTION_META[rec.action];
  const Icon = meta.icon;

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{rec.deal.dealname}</CardTitle>
            <CardDescription className="mt-1">
              {rec.deal.contact} · {rec.deal.company} · ${rec.deal.amount.toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant="outline" className={meta.tone}>
            Risk {rec.riskScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
          <div className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">
            Why this surfaced ({Math.round(rec.confidence * 100)}% confidence)
          </div>
          <ul className="space-y-1">
            {rec.signals.filter((s) => s.triggered).map((s) => (
              <li key={s.label} className="text-sm text-stone-600 flex gap-2">
                <span className="text-stone-400">·</span>
                <span><span className="font-medium text-stone-700">{s.label}:</span> {s.detail}</span>
              </li>
            ))}
            {rec.signals.every((s) => !s.triggered) && (
              <li className="text-sm text-stone-500">No risk signals triggered — deal is on track.</li>
            )}
          </ul>
        </div>

        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${meta.tone}`}>
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{rec.actionLabel}</span>
        </div>

        {emailState === 'reviewing' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
              <Pencil className="w-3.5 h-3.5" />
              Drafted by the system — review before sending
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => onEmailBodyChange(e.target.value)}
              rows={8}
              className="w-full text-sm rounded-md border border-amber-200 bg-white p-2.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSend} className="gap-2">
                <Send className="w-3.5 h-3.5" />
                Approve & send
              </Button>
              <Button size="sm" variant="outline" onClick={onDismiss} className="gap-2">
                <ThumbsDown className="w-3.5 h-3.5" />
                Not the priority
              </Button>
            </div>
          </div>
        )}

        {emailState === 'sent' && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            Email approved and sent.
            <Button size="sm" variant="ghost" onClick={onContinue} className="ml-auto">
              Next decision →
            </Button>
          </div>
        )}

        {emailState === 'idle' && (
          <div className="flex gap-2 pt-1">
            <Button onClick={onAcknowledge} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Acknowledge
            </Button>
            <Button variant="outline" onClick={onDismiss} className="gap-2">
              <ThumbsDown className="w-4 h-4" />
              Not the priority
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
