import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import { EditableCard } from './Shared';
import { springTransition } from '../../../lib/constants';
import { componentEvents } from '../../../workspace/events/componentEvents';

export function OverviewCard({ id, data }: { id: string; data: Record<string, unknown> }) {
  const handleUpdate = (val: string) => {
    componentEvents.update(id, { title: val });
  };

  return (
    <EditableCard title="Trip Overview" onSave={handleUpdate}>
      <div className="nexus-card p-4 h-full">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Trip Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: MapPin, label: 'Destination', value: (data?.destination as string) || 'Paris, France', color: '#BE123C' },
            { icon: Calendar, label: 'Dates', value: (data?.dates as string) || 'Select dates', color: '#0F766E' },
            { icon: Clock, label: 'Duration', value: (data?.duration as string) || '7 days', color: '#B45309' },
            { icon: DollarSign, label: 'Budget', value: (data?.budget as string) || '$5,200 est.', color: '#15803D' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              className="p-3 rounded-lg"
              style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
            >
              <item.icon className="w-4 h-4 mb-2" style={{ color: item.color }} />
              <div className="nexus-label" style={{ fontSize: 10 }}>{item.label}</div>
              <div className="text-sm font-medium mt-0.5 break-words" style={{ color: '#292524' }}>{item.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </EditableCard>
  );
}
