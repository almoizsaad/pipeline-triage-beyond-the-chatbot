import ConfidenceBadgeOriginal from '../ConfidenceBadge';

export function ConfidenceBadge({ data }: { id: string; data: Record<string, unknown> }) {
  const score = (data?.score as number) || 0;
  return (
    <div className="nexus-card p-4 flex items-center justify-center h-full">
      <ConfidenceBadgeOriginal score={score} size="lg" />
    </div>
  );
}
