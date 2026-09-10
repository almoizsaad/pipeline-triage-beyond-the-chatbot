import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight } from 'lucide-react';
import { EditableCard, EmptyState } from './Shared';
import { springTransition } from '../../../lib/constants';
import { componentEvents } from '../../../workspace/events/componentEvents';

export function FlightCard({ id, data }: { id: string; data: Record<string, unknown> }) {
  const items = (data?.items as Array<Record<string, string>>) || [];
  if (items.length === 0) return <EmptyState title="Flight Options" />;

  const handleSelect = (item: Record<string, unknown>) => {
    componentEvents.select(id, item);
  };

  const handleUpdate = (val: string) => {
    componentEvents.update(id, { title: val });
  };

  return (
    <EditableCard title="Flight Options" onSave={handleUpdate}>
      <div className="nexus-card p-4 h-full">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Flight Options</h3>
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg transition-colors"
              style={{ background: '#FAF9F6', border: '1px solid #E7E5E4', cursor: 'pointer' }}
              whileHover={{ borderColor: '#D6D3D1' }}
              onClick={() => handleSelect(item)}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(190, 18, 60, 0.08)' }}
              >
                <Plane className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#BE123C' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#292524' }}>{item.airline}</div>
                <div className="text-xs flex items-center gap-1 flex-wrap" style={{ color: '#78716C' }}>
                  <Clock className="w-3 h-3" /> {item.time} · {item.stops}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold" style={{ color: '#B45309' }}>{item.price}</div>
                <ArrowRight className="w-4 h-4 ml-auto" style={{ color: '#A8A29E' }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </EditableCard>
  );
}
