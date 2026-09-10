import { motion } from 'framer-motion';
import { EditableCard } from './Shared';
import { componentEvents } from '../../../workspace/events/componentEvents';

export function BudgetChart({ id, data }: { id: string; data: Record<string, unknown> }) {
  const total = (data?.total as string) || '$0';
  const flights = (data?.flights as string) || '$0';
  const hotel = (data?.hotel as string) || '$0';
  const meals = (data?.meals as string) || '$0';
  const transport = (data?.transport as string) || '$0';
  const other = (data?.other as string) || '$0';

  const parseAmount = (s: string) => parseInt(s.replace(/[$,]/g, '')) || 0;
  const amounts = {
    flights: parseAmount(flights),
    hotel: parseAmount(hotel),
    meals: parseAmount(meals),
    transport: parseAmount(transport),
    other: parseAmount(other),
  };
  const totalAmount = Object.values(amounts).reduce((a, b) => a + b, 1);

  const categories = [
    { label: 'Flights', value: flights, color: '#BE123C', pct: (amounts.flights / totalAmount) * 100 },
    { label: 'Hotel', value: hotel, color: '#0F766E', pct: (amounts.hotel / totalAmount) * 100 },
    { label: 'Meals', value: meals, color: '#B45309', pct: (amounts.meals / totalAmount) * 100 },
    { label: 'Transport', value: transport, color: '#15803D', pct: (amounts.transport / totalAmount) * 100 },
    { label: 'Other', value: other, color: '#78716C', pct: (amounts.other / totalAmount) * 100 },
  ];

  const handleUpdate = (val: string) => {
    componentEvents.update(id, { title: val });
  };

  return (
    <EditableCard title="Budget Estimate" onSave={handleUpdate}>
      <div className="nexus-card p-4 h-full">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>Budget Estimate</h3>
        <div className="space-y-4">
          <div className="text-center">
            <div
              className="text-xl sm:text-2xl font-bold break-words"
              style={{ color: '#1C1917', fontFamily: 'Playfair Display, serif' }}
            >
              {total}
            </div>
            <div className="nexus-label">Estimated Total</div>
          </div>
          <div className="nexus-ink-progress">
            <div className="flex h-full rounded-full overflow-hidden">
              {categories.map((cat, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(cat.pct, 2)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full"
                  style={{ background: cat.color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: cat.color }} />
                  <span className="truncate" style={{ color: '#78716C' }}>{cat.label}</span>
                </div>
                <span className="font-medium flex-shrink-0 ml-2" style={{ color: '#292524' }}>{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EditableCard>
  );
}
