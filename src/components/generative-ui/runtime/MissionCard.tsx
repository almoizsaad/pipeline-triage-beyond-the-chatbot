import { MissionCard as MissionCardOriginal } from '../../mission/MissionCard';
import type { Mission } from '../../../agent/types/mission';

export function MissionCard({ data }: { id: string; data: Record<string, unknown> }) {
  const mission = (data?.mission as Mission) || null;
  
  if (!mission) return null;

  return (
    <div className="h-full">
      <MissionCardOriginal mission={mission} />
    </div>
  );
}
