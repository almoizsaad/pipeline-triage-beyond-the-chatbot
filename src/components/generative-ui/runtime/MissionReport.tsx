import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

export function MissionReport({ data }: { id: string; data: Record<string, unknown> }) {
  const title = (data?.title as string) || 'Mission Report';
  const summary = (data?.summary as string) || '';
  const findings = (data?.findings as string[]) || [];
  const status = (data?.status as 'completed' | 'failed' | 'in-progress') || 'completed';

  return (
    <div className="nexus-card p-5 h-full overflow-auto border-l-4" 
         style={{ borderColor: status === 'completed' ? '#15803D' : status === 'failed' ? '#991B1B' : '#B45309' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: '#44403C' }} />
          <h3 className="font-bold text-base" style={{ color: '#1C1917' }}>{title}</h3>
        </div>
        {status === 'completed' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : status === 'failed' ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Executive Summary</h4>
          <p className="text-sm leading-relaxed" style={{ color: '#44403C' }}>{summary}</p>
        </div>

        {findings.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Key Findings</h4>
            <ul className="space-y-2">
              {findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#44403C' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#BE123C' }} />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
