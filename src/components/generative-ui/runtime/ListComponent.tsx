import { motion } from 'framer-motion';
import { EmptyState } from './Shared';

export function ListComponent({ data }: { id: string; data: Record<string, unknown> }) {
  const items = (data?.items as Array<Record<string, unknown> | string>) || [];
  const insights = (data?.insights as string[]) || [];
  const recommendations = (data?.recommendations as string[]) || [];

  const allItems = items.length > 0 ? items : insights.length > 0 ? insights : recommendations;

  if (allItems.length === 0) return <EmptyState title="List" />;

  return (
    <div className="nexus-card p-4 h-full">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>
        {items.length > 0 ? 'Items' : insights.length > 0 ? 'Insights' : 'Recommendations'}
      </h3>
      <div className="space-y-2">
        {allItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2 p-2 rounded-lg"
            style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#0F766E' }} />
            <span className="text-xs break-words" style={{ color: '#292524' }}>
              {typeof item === 'string' ? item : (item as Record<string, string>).label || JSON.stringify(item)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
