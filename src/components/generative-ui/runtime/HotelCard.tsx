import { motion } from 'framer-motion';
import { Hotel, Star } from 'lucide-react';
import { EditableCard, EmptyState } from './Shared';
import { springTransition } from '../../../lib/constants';
import { componentEvents } from '../../../workspace/events/componentEvents';

export function HotelCard({ id, data }: { id: string; data: Record<string, unknown> }) {
  const items = (data?.items as Array<Record<string, unknown>>) || [];
  if (items.length === 0) return <EmptyState title="Hotel Recommendations" />;

  const handleSelect = (item: Record<string, unknown>) => {
    componentEvents.select(id, item);
  };

  const handleUpdate = (val: string) => {
    componentEvents.update(id, { title: val });
  };

  return (
    <EditableCard title="Hotel Recommendations" onSave={handleUpdate}>
      <div className="nexus-card p-4 h-full">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Hotel Recommendations</h3>
        <div className="grid grid-cols-1 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              className="p-3 rounded-lg transition-colors"
              style={{ background: '#FAF9F6', border: '1px solid #E7E5E4', cursor: 'pointer' }}
              whileHover={{ borderColor: '#D6D3D1' }}
              onClick={() => handleSelect(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(15, 118, 110, 0.08)' }}
                  >
                    <Hotel className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#0F766E' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#292524' }}>{item.name as string}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`w-3 h-3 ${j < Math.floor((item.rating as number) || 0) ? 'fill-[#B45309]' : ''}`}
                          style={j < Math.floor((item.rating as number) || 0) ? { color: '#B45309' } : { color: '#E7E5E4' }}
                        />
                      ))}
                      <span className="text-xs ml-1" style={{ color: '#78716C' }}>{String(item.rating ?? '')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold" style={{ color: '#15803D' }}>{item.price as string}</div>
                  <div className="text-[10px]" style={{ color: '#A8A29E' }}>per night</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </EditableCard>
  );
}
