import { memo } from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Consistent color scheme matching design system
const COLOR_MAP = {
  high: {
    text: '#15803D',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  medium: {
    text: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  low: {
    text: '#991B1B',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
};

const ConfidenceBadge = memo(function ConfidenceBadge({ score, showLabel = true, size = 'md' }: ConfidenceBadgeProps) {
  // Determine tier
  const tier = score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low';
  const colors = COLOR_MAP[tier];

  // Icon based on tier
  const getIcon = () => {
    if (score >= 90) return <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
    if (score >= 70) return <AlertCircle className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
    return <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
  };

  // Size classes - all consistent
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]}`}
      style={{
        color: colors.text,
        background: colors.bg,
        borderColor: colors.border,
        borderStyle: 'dashed',
        transform: 'rotate(-0.5deg)',
      }}
    >
      {getIcon()}
      <span>{score}%</span>
      {showLabel && (
        <span style={{ opacity: 0.7 }}>
          {tier === 'high' ? 'High' : tier === 'medium' ? 'Medium' : 'Low'}
        </span>
      )}
    </span>
  );
});

export default ConfidenceBadge;
