import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroSection from '@/sections/HeroSection';
import NeuralDatastream from '@/sections/NeuralDatastream';
import { Hexagon, ArrowRight, Sparkles, Zap, Brain, Globe, Shield } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: Brain,
    title: 'Intent Kernel',
    description: 'Natural language is parsed into structured intent with confidence scoring and context extraction.',
    color: '#BE123C',
  },
  {
    icon: Sparkles,
    title: 'Generative Shell',
    description: 'Dynamic layouts are generated in real-time — terminals, timelines, and comparisons.',
    color: '#0F766E',
  },
  {
    icon: Zap,
    title: 'Predictive Scheduler',
    description: 'The system anticipates your next move, scheduling suggestions before you even ask.',
    color: '#B45309',
  },
  {
    icon: Globe,
    title: 'Omni-Bus Input',
    description: 'Text, voice, file uploads — interact however feels natural. The OS adapts to you.',
    color: '#15803D',
  },
  {
    icon: Shield,
    title: 'Secure Reasoner',
    description: 'Every decision shows its reasoning. Confidence scores and source attribution build trust.',
    color: '#44403C',
  },
  {
    icon: Hexagon,
    title: 'Mission Matrix',
    description: 'Our showcase mission — complex goal decomposition into executable sub-tasks.',
    color: '#78716C',
  },
];

export default function Home() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.feature-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div style={{ background: '#FDFCF8' }} className="min-h-screen paper-texture">
      {/* Hero Section */}
      <HeroSection />

      {/* Neural Datastream */}
      <NeuralDatastream />

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span
              className="nexus-stamp nexus-stamp-teal mb-4 inline-flex"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Neural Protocols
            </span>
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 600,
                color: '#1C1917',
                marginBottom: '16px',
              }}
            >
              Unified Intelligence Layer
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: '#78716C', fontSize: '18px', lineHeight: 1.7 }}>
              Nexus OS is a generative operating environment where intent is synthesized into live system processes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="feature-card nexus-card p-6 group cursor-pointer"
                  style={{
                    borderLeft: `3px solid ${feature.color}20`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `${feature.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2 transition-colors"
                    style={{ color: '#292524' }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: '#78716C', fontSize: '14px', lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Smart Travel Planner Showcase */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid #E7E5E4', borderBottom: '1px solid #E7E5E4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="nexus-stamp nexus-stamp-teal mb-4 inline-flex"
              >
                <Globe className="w-3.5 h-3.5" />
                Live Mission Simulation
              </span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 600,
                  color: '#1C1917',
                  marginBottom: '16px',
                }}
              >
                Geospatial Mission Synthesis
              </h2>
              <p className="mb-6" style={{ color: '#78716C', fontSize: '16px', lineHeight: 1.7 }}>
                Execute a geospatial mission like "Organize business trip to Paris" and watch as Nexus OS synthesizes an entire mission environment — flight data streams, hotel sub-systems, and resource allocations — in real-time.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Auto-generated flight comparison cards',
                  'Hotel recommendations with ratings and pricing',
                  'Day-by-day itinerary timeline',
                  'Budget tracker with visual breakdown',
                  'Predictive suggestions for next steps',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: '#78716C' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#15803D' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/triage"
                className="nexus-btn nexus-btn-primary"
              >
                Open Pipeline Triage
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/workspace"
                className="nexus-btn nexus-btn-secondary ml-3"
              >
                Legacy generative OS demo
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                 </div>
                 <div className="nexus-label">Autonomous Interface Engine</div>
                 <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    The UI adapts in real-time to your specific goals and context.
                 </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: '#1C1917' }}
          >
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 600,
              color: '#1C1917',
              marginBottom: '16px',
            }}
          >
            Initialize Kernel
          </h2>
          <p className="mb-8" style={{ color: '#78716C', fontSize: '18px', lineHeight: 1.7 }}>
            Enter the Nexus OS environment and experience a unified layer of intelligence where agents and users collaborate in real-time.
          </p>
          <Link
            to="/triage"
            className="nexus-btn nexus-btn-primary"
            style={{ padding: '0.875rem 2rem', fontSize: '16px' }}
          >
            Open Pipeline Triage
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid #E7E5E4' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: '#1C1917' }}
            >
              <Hexagon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#292524', fontFamily: 'Playfair Display, serif' }}>
              NEXUS
            </span>
            <span className="text-[10px]" style={{ color: '#A8A29E' }}>Intelligence Operating Environment</span>
          </div>
          <div className="text-xs" style={{ color: '#A8A29E' }}>
            DOO Builders League 2026 — Beyond the Chatbot Challenge
          </div>
        </div>
      </footer>
    </div>
  );
}
