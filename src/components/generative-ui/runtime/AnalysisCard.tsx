import { Star, DollarSign } from 'lucide-react';

export function AnalysisCard({ data }: { id: string; data: Record<string, unknown> }) {
  const summary = (data?.summary as string) || '';
  const insights = (data?.insights as string[]) || [];
  const savings = (data?.savings as string[]) || [];

  return (
    <div className="nexus-card p-4 h-full">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Analysis</h3>
      {summary && (
        <p className="text-xs mb-4 leading-relaxed" style={{ color: '#78716C' }}>{summary}</p>
      )}
      {insights.length > 0 && (
        <div className="mb-4">
          <div className="nexus-label mb-2" style={{ fontSize: 10 }}>Key Insights</div>
          <div className="space-y-1.5">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Star className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#B45309' }} />
                <span style={{ color: '#292524' }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {savings.length > 0 && (
        <div>
          <div className="nexus-label mb-2" style={{ fontSize: 10 }}>Potential Savings</div>
          <div className="space-y-1.5">
            {savings.map((saving, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <DollarSign className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#15803D' }} />
                <span style={{ color: '#15803D' }}>{saving}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
