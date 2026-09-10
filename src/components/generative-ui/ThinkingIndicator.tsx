import { memo } from 'react';

const ThinkingIndicator = memo(function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: '#0F766E',
              animation: `pulse-soft 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: '#78716C' }}>Analyzing intent</span>
        <span className="typewriter-cursor text-xs" style={{ color: '#0F766E' }} />
      </div>
    </div>
  );
});

export default ThinkingIndicator;
