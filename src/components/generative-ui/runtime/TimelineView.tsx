import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { EditableCard, EmptyState } from './Shared';
import { springTransition } from '../../../lib/constants';
import { componentEvents } from '../../../workspace/events/componentEvents';

export function TimelineView({ id, data }: { id: string; data: Record<string, unknown> }) {
  const days = (data?.days as Array<Record<string, unknown>>) || [];
  if (days.length === 0) return <EmptyState title="Itinerary Timeline" />;

  const handleUpdate = (val: string) => {
    componentEvents.update(id, { title: val });
  };

  return (
    <EditableCard title="Itinerary Timeline" onSave={handleUpdate}>
      <div className="nexus-card p-4 h-full">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Itinerary Timeline</h3>
        <div className="relative">
          <div
            className="absolute left-3 sm:left-4 top-0 bottom-0 w-px"
            style={{ background: '#E7E5E4' }}
          />
          <div className="space-y-4">
            {days.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springTransition, delay: i * 0.08 }}
                className="flex items-center gap-3 sm:gap-4 ml-1 sm:ml-2"
              >
                <div
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FFFFFF', border: '2px solid #0F766E' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0F766E' }} />
                </div>
                <div
                  className="flex-1 p-3 rounded-lg min-w-0"
                  style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0F766E' }} />
                    <span className="text-xs font-medium" style={{ color: '#0F766E' }}>Day {String(day.day ?? '')}</span>
                  </div>
                  <div className="text-sm mt-1 break-words" style={{ color: '#292524' }}>{day.activity as string}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </EditableCard>
  );
}
