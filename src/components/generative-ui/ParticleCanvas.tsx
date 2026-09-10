import { useRef, useEffect, memo } from 'react';

interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

interface ParticleCanvasProps {
  className?: string;
  state?: 'idle' | 'gathering' | 'orbiting' | 'exploding';
  mouseTarget?: { x: number; y: number } | null;
}

const COLORS = ['#6366F1', '#EC4899', '#06B6D4', '#fbbf24', '#8b5cf6'];
const MAX_PARTICLES = 80;

const ParticleCanvas = memo(function ParticleCanvas({ className = '', state = 'idle', mouseTarget }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleData[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (mouseTarget) {
      mouseRef.current = mouseTarget;
    }
  }, [mouseTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouse);

    // Init particles
    const w = canvas.offsetWidth || 800;
    const h = canvas.offsetHeight || 600;
    particlesRef.current = Array.from({ length: MAX_PARTICLES }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.2,
      life: Math.random() * 100,
    }));

    const animate = () => {
      const cw = canvas.offsetWidth || 800;
      const ch = canvas.offsetHeight || 600;
      ctx.clearRect(0, 0, cw, ch);

      const s = stateRef.current;
      const mx = mouseRef.current.x || cw / 2;
      const my = mouseRef.current.y || ch / 2;

      particlesRef.current.forEach((p, i) => {
        p.life += 0.02;

        if (s === 'gathering') {
          const dx = mx - p.x;
          const dy = my - p.y;
          p.vx += dx * 0.003;
          p.vy += dy * 0.003;
          p.vx *= 0.94;
          p.vy *= 0.94;
        } else if (s === 'orbiting') {
          const angle = p.life * 1.5 + (i / MAX_PARTICLES) * Math.PI * 2;
          const radius = 80 + Math.sin(p.life * 0.5) * 40;
          const tx = mx + Math.cos(angle) * radius;
          const ty = my + Math.sin(angle) * radius;
          p.vx += (tx - p.x) * 0.015;
          p.vy += (ty - p.y) * 0.015;
          p.vx *= 0.9;
          p.vy *= 0.9;
        } else if (s === 'exploding') {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          p.vx += (dx / dist) * 3;
          p.vy += (dy / dist) * 3;
          p.vx *= 0.96;
          p.vy *= 0.96;
        } else {
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy += (Math.random() - 0.5) * 0.08;
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;
        if (p.y < -10) p.y = ch + 10;
        if (p.y > ch + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Neural connections
        if (i % 4 === 0) {
          for (let j = i + 1; j < Math.min(i + 5, particlesRef.current.length); j++) {
            const n = particlesRef.current[j];
            const d = Math.sqrt((p.x - n.x) ** 2 + (p.y - n.y) ** 2);
            if (d < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(n.x, n.y);
              ctx.strokeStyle = p.color;
              ctx.globalAlpha = (1 - d / 120) * 0.15;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      });

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
    />
  );
});

export default ParticleCanvas;
