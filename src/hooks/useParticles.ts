import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  targetX?: number;
  targetY?: number;
  state: 'idle' | 'gathering' | 'orbiting' | 'exploding';
  life: number;
}

interface UseParticlesOptions {
  maxParticles?: number;
  colors?: string[];
}

export function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>, options: UseParticlesOptions = {}) {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef<'idle' | 'gathering' | 'orbiting' | 'exploding'>('idle');

  const { maxParticles = 80, colors = ['#6366F1', '#EC4899', '#06B6D4', '#fbbf24'] } = options;

  const createParticle = useCallback((w: number, h: number): Particle => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: Math.random() * 0.5 + 0.3,
    state: 'idle',
    life: Math.random() * 100,
  }), [colors]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    particlesRef.current = Array.from({ length: maxParticles }, () => createParticle(w, h));
  }, [canvasRef, maxParticles, createParticle]);

  const setState = useCallback((state: 'idle' | 'gathering' | 'orbiting' | 'exploding') => {
    stateRef.current = state;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    init();

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const state = stateRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particlesRef.current.forEach((p, i) => {
        p.life += 0.01;

        if (state === 'gathering') {
          const dx = mx - p.x;
          const dy = my - p.y;
          p.vx += dx * 0.002;
          p.vy += dy * 0.002;
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else if (state === 'orbiting') {
          const angle = p.life * 2 + (i / maxParticles) * Math.PI * 2;
          const radius = 100 + Math.sin(p.life) * 50;
          const targetX = mx + Math.cos(angle) * radius;
          const targetY = my + Math.sin(angle) * radius;
          p.vx += (targetX - p.x) * 0.01;
          p.vy += (targetY - p.y) * 0.01;
          p.vx *= 0.92;
          p.vy *= 0.92;
        } else if (state === 'exploding') {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          p.vx += (dx / dist) * 2;
          p.vy += (dy / dist) * 2;
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else {
          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Draw connections
        if (i % 5 === 0) {
          const nearest = particlesRef.current.slice(i + 1, i + 4);
          nearest.forEach(n => {
            const d = Math.sqrt((p.x - n.x) ** 2 + (p.y - n.y) ** 2);
            if (d < 100) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(n.x, n.y);
              ctx.strokeStyle = p.color;
              ctx.globalAlpha = (1 - d / 100) * 0.2;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, init, maxParticles]);

  return { setState };
}
