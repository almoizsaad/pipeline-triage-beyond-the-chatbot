import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react';

interface ReasoningPanelProps {
  reasoning: string;
  sources?: string[];
  isThinking?: boolean;
}

export default function ReasoningPanel({ reasoning, sources, isThinking }: ReasoningPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-1 py-0.5 -ml-1 group"
        style={{ color: isThinking ? '#0F766E' : '#78716C' }}
        aria-expanded={expanded}
      >
        {isThinking ? (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-[#0F766E] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-[#0F766E] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-[#0F766E] animate-bounce" />
            </div>
            <span className="font-mono uppercase tracking-tighter text-[9px] animate-pulse">Kernel_Reasoning...</span>
          </div>
        ) : (
          <>
            <Brain className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-foreground">View Trace</span>
          </>
        )}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div
          className="mt-2 p-4 rounded-xl text-xs leading-relaxed shadow-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            color: '#44403C',
            animation: 'fade-in-up 0.2s ease',
          }}
        >
          <div className="flex items-start gap-3">
             <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
             <p className="font-medium">{reasoning}</p>
          </div>
          
          {sources && sources.length > 0 && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Neural Sources</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] font-mono py-0 h-4 bg-black/5 text-muted-foreground border-none">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
