import { useEffect, useRef, useState, useCallback } from 'react';

/*
 * AdvisorOrb v2 — Gaseous gradient orb.
 * Drop-in replacement: same prop interface as original.
 *
 * Derives internal state from existing props:
 *   isSpeaking + isInCall → "speaking"
 *   isInCall + !isSpeaking → "listening"
 *   isActivated (no call)  → "idle" with higher intensity
 *   absorb event           → "absorb" (brief pulse)
 *
 * Listens for 'orb-absorb' CustomEvent dispatched by useAbsorption.
 */

// ─── Props (matches original interface) ─────────────────────

interface AdvisorOrbProps {
  intensity?: number;
  isActivated?: boolean;
  className?: string;
  size?: number;
  allowProfanity?: boolean;
  glowMultiplier?: number;
  particleSpeed?: number;
  agentVolume?: number;
  isInCall?: boolean;
  isSpeaking?: boolean;
  paletteIndex?: number;
}

// ─── Internal state type ────────────────────────────────────

type OrbState = 'idle' | 'listening' | 'speaking' | 'absorb' | 'error';

interface StateConfig {
  speed: number;
  scale: number;
  glow: number;
  pulseMs: number;
}

const STATE_CONFIGS: Record<OrbState, StateConfig> = {
  idle:      { speed: 1,   scale: 1,    glow: 0.3,  pulseMs: 4000 },
  listening: { speed: 1.6, scale: 1.04, glow: 0.55, pulseMs: 1800 },
  speaking:  { speed: 1.8, scale: 1.07, glow: 0.65, pulseMs: 1200 },
  absorb:    { speed: 3.0, scale: 1.12, glow: 0.9,  pulseMs: 300  },
  error:     { speed: 0.4, scale: 0.94, glow: 0.8,  pulseMs: 3000 },
};

// ─── Palettes ───────────────────────────────────────────────

const PALETTE_SETS = [
  ['#c6ff4a', '#10b981', '#0ea5e9', '#6366f1'],
  ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'],
  ['#06b6d4', '#8b5cf6', '#d946ef', '#f97316'],
  ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
  ['#f43f5e', '#fb923c', '#facc15', '#a3e635'],
  ['#c6ff4a', '#facc15', '#fb923c', '#f43f5e'],
];

// Profanity palette override — reds
const PROFANITY_PALETTE = ['#ef4444', '#dc2626', '#f97316', '#fbbf24'];

// ─── Noise + helpers ────────────────────────────────────────

function gasNoise(x: number, y: number, t: number, ox: number, oy: number): number {
  const x1 = x + ox, y1 = y + oy;
  return (
    Math.sin(x1 * 1.8 + t * 0.7) * 0.35 +
    Math.sin(y1 * 1.4 + t * 1.1) * 0.35 +
    Math.sin((x1 + y1) * 0.9 + t * 0.8) * 0.25 +
    Math.sin(x1 * 2.5 - y1 * 1.3 + t * 1.5) * 0.2 +
    Math.sin((x1 * 0.6 + y1 * 2.1) + t * 0.5) * 0.15 +
    Math.cos(x1 * 1.1 - t * 1.2) * Math.sin(y1 * 1.6 + t * 0.9) * 0.2
  );
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function createOffscreen(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    try { return new OffscreenCanvas(w, h); } catch { /* fall through */ }
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ─── Component ──────────────────────────────────────────────

export function AdvisorOrb({
  intensity = 0,
  isActivated = false,
  className = '',
  size = 200,
  allowProfanity = false,
  glowMultiplier = 1,
  particleSpeed = 1,
  agentVolume = 0,
  isInCall = false,
  isSpeaking = false,
  paletteIndex = 6,
}: AdvisorOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const transRef = useRef({ from: 'idle' as OrbState, to: 'idle' as OrbState, progress: 1 });
  const prevStateRef = useRef<OrbState>('idle');
  const [isAbsorbing, setIsAbsorbing] = useState(false);

  // Derive orb state from props
  const derivedState: OrbState = (() => {
    if (isAbsorbing) return 'absorb';
    if (isInCall && isSpeaking) return 'speaking';
    if (isInCall) return 'listening';
    return 'idle';
  })();

  // Listen for absorb events from useAbsorption
  useEffect(() => {
    const handler = () => {
      setIsAbsorbing(true);
      setTimeout(() => setIsAbsorbing(false), 400);
    };
    window.addEventListener('orb-absorb', handler);
    return () => window.removeEventListener('orb-absorb', handler);
  }, []);

  // Handle state transitions
  useEffect(() => {
    if (prevStateRef.current !== derivedState) {
      transRef.current = { from: prevStateRef.current, to: derivedState, progress: 0 };
      prevStateRef.current = derivedState;
    }
  }, [derivedState]);

  // Choose palette
  const palette = allowProfanity
    ? PROFANITY_PALETTE
    : PALETTE_SETS[paletteIndex % PALETTE_SETS.length];

  const config = STATE_CONFIGS[derivedState];

  // ─── Canvas render loop ─────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pxSize = Math.round(size * dpr);
    canvas.width = pxSize;
    canvas.height = pxSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = palette.map(hexToRgb);
    const renderScale = 0.5;
    const rSize = Math.round(pxSize * renderScale);
    const offCanvas = createOffscreen(rSize, rSize);
    const offCtx = (offCanvas as HTMLCanvasElement).getContext('2d')!;
    const cx = rSize / 2;
    const cy = rSize / 2;
    const radius = rSize / 2 - 2;

    function draw() {
      // Transition interpolation
      const tr = transRef.current;
      if (tr.progress < 1) tr.progress = Math.min(1, tr.progress + 0.018);
      const p = tr.progress;
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const fromCfg = STATE_CONFIGS[tr.from];
      const toCfg = STATE_CONFIGS[tr.to];
      const speed = lerp(fromCfg.speed, toCfg.speed, e) * particleSpeed;
      const sc = lerp(fromCfg.scale, toCfg.scale, e);

      // Voice reactivity — modulate speed slightly
      const voiceBoost = isInCall && agentVolume > 0 ? agentVolume * 0.5 : 0;
      timeRef.current += 0.013 * (speed + voiceBoost);
      const time = timeRef.current;

      const imgData = offCtx.createImageData(rSize, rSize);
      const data = imgData.data;
      const scaledR = radius * sc;
      const numColors = colors.length;

      for (let py = 0; py < rSize; py++) {
        const dy = py - cy;
        const dySq = dy * dy;
        for (let px = 0; px < rSize; px++) {
          const dx = px - cx;
          const distSq = dx * dx + dySq;
          if (distSq > (scaledR + 3) * (scaledR + 3)) continue;

          const dist = Math.sqrt(distSq);
          if (dist > scaledR + 2) continue;

          const nx = dx / scaledR;
          const ny = dy / scaledR;
          const nd = dist / scaledR;

          const n1 = gasNoise(nx * 2.5, ny * 2.5, time, 0, 0);
          const n2 = gasNoise(nx * 3.2, ny * 3.2, time * 1.3, 7.3, -4.1);
          const n3 = gasNoise(nx * 1.8, ny * 1.8, time * 0.7, -12, 8.5);

          const raw = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
          const norm = raw * 0.65 + 0.5;
          const colorPos = Math.abs(norm) * (numColors - 1);
          const ci = Math.min(Math.floor(colorPos), numColors - 2);
          const frac = colorPos - ci;
          const sf = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;

          const c0 = colors[ci];
          const c1 = colors[ci + 1];
          let r = lerp(c0[0], c1[0], sf);
          let g = lerp(c0[1], c1[1], sf);
          let b = lerp(c0[2], c1[2], sf);

          const bri = 0.92 + n3 * 0.08;
          r = Math.min(255, r * bri);
          g = Math.min(255, g * bri);
          b = Math.min(255, b * bri);

          let alpha = 1;
          if (nd > 0.92) alpha = Math.max(0, (1 - nd) / 0.08);

          const i = (py * rSize + px) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = (alpha * 255) | 0;
        }
      }

      offCtx.putImageData(imgData, 0, 0);
      ctx!.clearRect(0, 0, pxSize, pxSize);
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      ctx!.drawImage(offCanvas as HTMLCanvasElement, 0, 0, rSize, rSize, 0, 0, pxSize, pxSize);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, palette, particleSpeed, isInCall, agentVolume]);

  // ─── Glow ───────────────────────────────────────────────

  const glowBase = config.glow * glowMultiplier;
  const voiceGlow = isInCall && agentVolume > 0 ? agentVolume * 0.3 : 0;
  const totalGlow = Math.min(1, glowBase + voiceGlow);
  const glowHex = Math.round(totalGlow * 200).toString(16).padStart(2, '0');
  const glowColor = allowProfanity ? '#ef4444' : palette[1];

  return (
    <div className={`relative ${className}`} data-orb>
      <div
        className="relative mx-auto"
        style={{ width: size, height: size }}
      >
        {/* Outer glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -size * 0.15,
            background: `radial-gradient(circle, ${glowColor}${glowHex} 0%, transparent 70%)`,
            animation: `orbPulse ${config.pulseMs}ms ease-in-out infinite`,
            transition: 'all 0.6s ease',
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'block',
          }}
        />
      </div>

      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
