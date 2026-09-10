import { EmptyState } from './Shared';

export function TableComponent({ data }: { id: string; data: Record<string, unknown> }) {
  const headers = (data?.headers as string[]) || [];
  const rows = (data?.rows as string[][]) || [];

  if (headers.length === 0 && rows.length === 0) return <EmptyState title="Comparison Table" />;

  return (
    <div className="nexus-card p-4 overflow-x-auto h-full">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Comparison</h3>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid #E7E5E4' }}>
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2 px-2 font-medium" style={{ color: '#78716C' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F5F5F4' }}>
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-2 break-words" style={{ color: j === 0 ? '#292524' : '#78716C' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
