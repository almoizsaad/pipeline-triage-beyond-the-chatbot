import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Zap } from 'lucide-react';

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;

      const decorElements = section.querySelectorAll('.parallax-decor');
      decorElements.forEach((el, i) => {
        const factor = (i + 1) * 8;
        (el as HTMLElement).style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    };

    section.addEventListener('mousemove', handleMouseMove);
    return () => section.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden paper-texture"
      style={{ background: '#FDFCF8' }}
    >
      {/* Decorative elements — hand-drawn style circles */}
      <div
        className="parallax-decor absolute top-20 left-[10%] w-32 h-32 rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ border: '2px dashed rgba(190, 18, 60, 0.15)' }}
      />
      <div
        className="parallax-decor absolute bottom-32 right-[15%] w-48 h-48 rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ border: '2px dashed rgba(15, 118, 110, 0.12)' }}
      />
      <div
        className="parallax-decor absolute top-1/3 right-[20%] w-4 h-4 rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ background: 'rgba(190, 18, 60, 0.2)' }}
      />
      <div
        className="parallax-decor absolute bottom-1/4 left-[18%] w-3 h-3 rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ background: 'rgba(15, 118, 110, 0.25)' }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Stamp badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="nexus-stamp nexus-stamp-crimson">
            <Zap className="w-3 h-3" />
            Beyond the Chatbot
          </span>
        </motion.div>

        {/* Hero headline — Playfair Display */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(48px, 8vw, 80px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#1C1917',
          }}
        >
          Your Intent.
          <br />
          <span className="nexus-squiggly" style={{ fontStyle: 'italic' }}>
            Your Interface.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg mb-10 max-w-xl mx-auto"
          style={{ color: '#78716C', lineHeight: 1.7, fontSize: '18px' }}
        >
          An intent-driven workspace where AI doesn't just respond — it crafts
          the perfect interface for your every need.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#/workspace"
            className="nexus-btn nexus-btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '16px' }}
          >
            Enter Workspace
            <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
          </a>
          <a
            href="#features"
            className="nexus-btn nexus-btn-secondary"
          >
            Learn More
          </a>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        style={{ color: '#A8A29E' }}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <span className="nexus-label">Scroll to Explore</span>
        <ArrowDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}
