import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: number;
  burst?: boolean;
}

export const CursorTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particles: Particle[] = [];
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastTime < 16) return;
      lastTime = now;
      lastX = e.clientX;
      lastY = e.clientY;
      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 4,
        y: e.clientY + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: 0,
        max: 40,
        size: 2 + Math.random() * 2,
        hue: 180 + Math.random() * 40,
      });
    };

    const onClick = (e: PointerEvent) => {
      const count = 28;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count;
        const s = 3 + Math.random() * 4;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0,
          max: 50,
          size: 2 + Math.random() * 3,
          hue: 180 + Math.random() * 60,
          burst: true,
        });
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onClick);

    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        if (p.burst) {
          p.vx *= 0.94;
          p.vy *= 0.94;
        }
        const a = 1 - p.life / p.max;
        if (a <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${a})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${a})`;
        ctx.shadowBlur = 12;
        ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      aria-hidden
    />
  );
};
