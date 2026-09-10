import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lightbulb } from 'lucide-react';
import type { PredictiveSuggestion } from '@/lib/types/intent';

interface PredictiveChipsProps {
  suggestions: PredictiveSuggestion[];
  onSelect?: (suggestion: PredictiveSuggestion) => void;
}

const PredictiveChips = memo(function PredictiveChips({ suggestions, onSelect }: PredictiveChipsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: '#0F766E' }}>
        <Lightbulb className="w-3.5 h-3.5" />
        <span className="font-medium">Predicted:</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {suggestions.slice(0, 5).map((suggestion, i) => (
            <motion.button
              key={suggestion.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.06 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect?.(suggestion)}
              onMouseEnter={() => setHoveredId(suggestion.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative nexus-stamp nexus-stamp-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 transition-colors"
              style={{ fontSize: 11, cursor: 'pointer' }}
              title={`Click to: ${suggestion.label} (${suggestion.confidence}% confidence)`}
            >
              <Plus className="w-3 h-3" />
              {suggestion.label}
              <span style={{ opacity: 0.6, fontSize: 10 }}>{suggestion.confidence}%</span>

              {/* Tooltip */}
              {hoveredId === suggestion.id && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[9px] whitespace-nowrap z-50 pointer-events-none"
                  style={{
                    background: '#1C1917',
                    color: '#FAF9F6',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Click to {suggestion.label.toLowerCase()}
                </motion.div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default PredictiveChips;
