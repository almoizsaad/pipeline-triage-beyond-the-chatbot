import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Cpu, Activity, TrendingUp, Zap, Brain, Database,
  Wifi, Server, Globe, Clock, Shield
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSystemStore } from '../stores/systemStore';

gsap.registerPlugin(ScrollTrigger);

const SENTIMENT_LABELS = ['Critical', 'Low', 'Normal', 'Good', 'Excellent'];
const SENTIMENT_COLORS = ['#991B1B', '#B45309', '#15803D', '#0F766E', '#BE123C'];
const SENTIMENT_VALUES = [2, 5, 12, 45, 36];

export default function NeuralDatastream() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const telemetry = useSystemStore(state => state.telemetry);
  const agents = useSystemStore(useShallow(state => Object.values(state.agents)));

  const METRICS = [
    { label: 'Tokens/sec', value: telemetry.tokensPerSec, max: 1000, icon: Zap },
    { label: 'Active Threads', value: telemetry.activeThreads, max: 64, icon: Cpu },
    { label: 'Memory Used', value: telemetry.memoryUsage, max: 100, icon: Database },
    { label: 'Uptime', value: telemetry.uptime, max: 100, icon: Clock },
  ];

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        trackRef.current,
        { xPercent: 0 },
        {
          xPercent: -40,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusedIndex(Math.floor(Math.random() * 8));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-16 dark-section"
      style={{
        background: '#1C1917',
        borderTop: '1px solid #44403C',
        borderBottom: '1px solid #44403C',
      }}
    >
      {/* Section header */}
      <div className="px-6 mb-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4" style={{ color: '#BE123C' }} />
          <span className="nexus-label" style={{ color: '#BE123C' }}>
            System Telemetry
          </span>
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 600, color: '#FAF9F6' }}>
          Engine Vitals
        </h2>
        <p className="text-sm mt-1" style={{ color: '#A8A29E' }}>
          Real-time AI performance metrics and model status
        </p>
      </div>

      {/* Scrolling ticker */}
      <div className="relative overflow-hidden">
        {/* Focus zone indicators */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[40%] pointer-events-none z-10">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(190, 18, 60, 0.04), transparent)' }}
          />
        </div>

        <div
          ref={trackRef}
          className="flex gap-0"
          style={{ width: 'fit-content' }}
        >
          {/* Model Status Quadrant */}
          {[...Array(3)].map((_, repeat) => (
            <div
              key={`models-${repeat}`}
              className="flex-shrink-0 px-8 py-4"
              style={{
                borderLeft: '1px solid #44403C',
                opacity: focusedIndex === 0 + repeat ? 1 : 0.5,
                transform: focusedIndex === 0 + repeat ? 'scale(1.02)' : 'scale(0.98)',
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <div className="nexus-label mb-3 flex items-center gap-1.5" style={{ color: '#78716C', fontSize: 10 }}>
                <Brain className="w-3 h-3" /> Live Agents
              </div>
              <div className="space-y-2" style={{ minWidth: 200 }}>
                {agents.length > 0 ? agents.slice(0, 4).map((agent, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#FAF9F6' }}>{agent.name} <span style={{ color: '#78716C', fontSize: 9 }}>({agent.role})</span></span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px]"
                        style={{ color: agent.status === 'executing' ? '#15803D' : '#78716C' }}
                      >
                        {agent.latency}ms
                      </span>
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: agent.status === 'executing' ? '#15803D' : agent.status === 'thinking' ? '#B45309' : '#44403C',
                        }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-[10px]" style={{ color: '#78716C' }}>Waiting for agent initialization...</div>
                )}
              </div>
            </div>
          ))}

          {/* Metrics Quadrant */}
          {[...Array(3)].map((_, repeat) => (
            <div
              key={`metrics-${repeat}`}
              className="flex-shrink-0 px-8 py-4"
              style={{
                borderLeft: '1px solid #44403C',
                opacity: focusedIndex === 3 + repeat ? 1 : 0.5,
                transform: focusedIndex === 3 + repeat ? 'scale(1.02)' : 'scale(0.98)',
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <div className="nexus-label mb-3 flex items-center gap-1.5" style={{ color: '#78716C', fontSize: 10 }}>
                <TrendingUp className="w-3 h-3" /> Performance
              </div>
              <div className="space-y-3" style={{ minWidth: 220 }}>
                {METRICS.map((metric, i) => {
                  const Icon = metric.icon;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3" style={{ color: '#BE123C' }} />
                          <span className="nexus-label" style={{ color: '#78716C', fontSize: 10 }}>{metric.label}</span>
                        </div>
                        <span className="text-xs font-mono" style={{ color: '#FAF9F6', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {typeof metric.value === 'number' && metric.value > 1000
                            ? metric.value.toLocaleString()
                            : metric.value}
                          {metric.label === 'Memory Used' || metric.label === 'Uptime' ? '%' : ''}
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#44403C' }}>
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${(metric.value / metric.max) * 100}%`,
                            background: '#0F766E',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sentiment Quadrant */}
          {[...Array(3)].map((_, repeat) => (
            <div
              key={`sentiment-${repeat}`}
              className="flex-shrink-0 px-8 py-4"
              style={{
                borderLeft: '1px solid #44403C',
                opacity: focusedIndex === 6 + repeat ? 1 : 0.5,
                transform: focusedIndex === 6 + repeat ? 'scale(1.02)' : 'scale(0.98)',
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <div className="nexus-label mb-3 flex items-center gap-1.5" style={{ color: '#78716C', fontSize: 10 }}>
                <Shield className="w-3 h-3" /> Response Quality
              </div>
              <div className="flex gap-2" style={{ minWidth: 180 }}>
                {SENTIMENT_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg"
                    style={{
                      background: '#292524',
                      border: i === 4 ? '1px solid rgba(190, 18, 60, 0.3)' : '1px solid transparent',
                    }}
                  >
                    <span className="text-[9px]" style={{ color: '#78716C' }}>{label}</span>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#44403C' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${SENTIMENT_VALUES[i]}%`,
                          background: SENTIMENT_COLORS[i],
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: '#A8A29E', fontFamily: 'IBM Plex Mono' }}>
                      {SENTIMENT_VALUES[i]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Network Status Quadrant */}
          {[...Array(3)].map((_, repeat) => (
            <div
              key={`network-${repeat}`}
              className="flex-shrink-0 px-8 py-4"
              style={{
                borderLeft: '1px solid #44403C',
                opacity: focusedIndex === 9 + repeat ? 1 : 0.5,
                transform: focusedIndex === 9 + repeat ? 'scale(1.02)' : 'scale(0.98)',
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <div className="nexus-label mb-3 flex items-center gap-1.5" style={{ color: '#78716C', fontSize: 10 }}>
                <Wifi className="w-3 h-3" /> Agent Message Bus
              </div>
              <div className="space-y-2" style={{ minWidth: 180 }}>
                {[
                  { icon: Globe, label: 'Messages', value: telemetry.totalMessages.toLocaleString(), color: '#15803D' },
                  { icon: Server, label: 'Subscribers', value: telemetry.activeSubscribers, color: '#BE123C' },
                  { icon: Shield, label: 'Security', value: 'ENCRYPTED', color: '#B45309' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <item.icon className="w-3 h-3" style={{ color: item.color }} />
                      <span className="text-[10px]" style={{ color: '#78716C' }}>{item.label}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#FAF9F6', fontFamily: 'IBM Plex Mono' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
