import { useEffect, useRef } from 'react';

/*
 * AbsorptionCanvas — renders particle travel animations.
 * 
 * Mount once near your app root:
 *   <AbsorptionCanvas />
 * 
 * It listens for 'absorption-particle' CustomEvents dispatched
 * by useAbsorption, renders bezier-curved glowing particles on
 * a full-screen overlay canvas, then dispatches 'orb-absorb'
 * when the first particle arrives (which the AdvisorOrb listens for).
 */

interface TravelParticle {
  sx: number; sy: number;
  tx: number; ty: number;
  curveX: number; curveY: number;
  r: number; g: number; b: number;
  size: number;
  progress: number;
  speed: number;
  arrived: boolean;
  isFirst: boolean; // triggers absorb on arrival
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function AbsorptionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TravelParticle[]>([]);
  const animRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d')!;

    // ─── Draw loop ────────────────────────────────────────

    function draw() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const ps = particlesRef.current;
      let anyActive = false;

      ctx.globalCompositeOperation = 'lighter';

      for (const p of ps) {
        if (p.arrived) continue;

        p.progress += p.speed;

        if (p.progress >= 1) {
          p.arrived = true;
          if (p.isFirst) {
            window.dispatchEvent(new CustomEvent('orb-absorb'));
          }
          continue;
        }

        if (p.progress < 0) {
          anyActive = true;
          continue; // staggered start
        }

        anyActive = true;
        const t = easeInOut(Math.min(1, p.progress));

        // Cubic bezier path
        const cp1x = p.sx + (p.tx - p.sx) * 0.3 + p.curveX;
        const cp1y = p.sy + (p.ty - p.sy) * 0.1 + p.curveY;
        const cp2x = p.sx + (p.tx - p.sx) * 0.7 - p.curveX * 0.5;
        const cp2y = p.sy + (p.ty - p.sy) * 0.9 - p.curveY * 0.3;

        const mt = 1 - t;
        const x = mt*mt*mt*p.sx + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*p.tx;
        const y = mt*mt*mt*p.sy + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*p.ty;

        // Trail
        const trailSteps = 5;
        for (let ti = trailSteps; ti >= 1; ti--) {
          const tt = easeInOut(Math.min(1, Math.max(0, p.progress - ti * 0.025)));
          if (tt <= 0) continue;
          const mtt = 1 - tt;
          const trx = mtt*mtt*mtt*p.sx + 3*mtt*mtt*tt*cp1x + 3*mtt*tt*tt*cp2x + tt*tt*tt*p.tx;
          const tr_y = mtt*mtt*mtt*p.sy + 3*mtt*mtt*tt*cp1y + 3*mtt*tt*tt*cp2y + tt*tt*tt*p.ty;
          const ta = (1 - ti / trailSteps) * 0.3;
          ctx.beginPath();
          ctx.arc(trx, tr_y, p.size * (1 - ti / trailSteps * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${ta})`;
          ctx.fill();
        }

        // Glow halo
        const grd = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
        grd.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, 0.35)`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(x - p.size * 3, y - p.size * 3, p.size * 6, p.size * 6);

        // Core
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, 0.9)`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      // Clean up arrived particles
      if (!anyActive) {
        particlesRef.current = [];
        isRunningRef.current = false;
        return; // stop loop when nothing to draw
      }

      animRef.current = requestAnimationFrame(draw);
    }

    function startLoop() {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        animRef.current = requestAnimationFrame(draw);
      }
    }

    // ─── Listen for particle spawn events ─────────────────

    const handleSpawn = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        sx: number; sy: number;
        tx: number; ty: number;
        color: string;
      };

      const [r, g, b] = hexToRgb(detail.color);
      const count = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          sx: detail.sx + (Math.random() - 0.5) * 20,
          sy: detail.sy + (Math.random() - 0.5) * 20,
          tx: detail.tx,
          ty: detail.ty,
          curveX: (Math.random() - 0.5) * 120,
          curveY: (Math.random() - 0.5) * 80,
          r, g, b,
          size: 3 + Math.random() * 3,
          progress: -i * 0.06, // stagger
          speed: 0.018 + Math.random() * 0.008,
          arrived: false,
          isFirst: i === 0,
        });
      }

      startLoop();
    };

    window.addEventListener('absorption-particle', handleSpawn);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('absorption-particle', handleSpawn);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
