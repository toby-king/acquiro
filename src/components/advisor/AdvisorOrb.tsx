import { useEffect, useRef, useState } from 'react';

/*
 * AdvisorOrb v4 — Gaseous gradient orb + waveform ring.
 * Drop-in replacement: same prop interface as original.
 *
 * Derives internal state from existing props:
 *   isSpeaking + isInCall → "speaking"  (energetic waveform)
 *   isInCall + !isSpeaking → "listening" (gentle waveform)
 *   isActivated (no call)  → "idle" (no waveform)
 *   absorb event           → "absorb" (brief pulse)
 *
 * Waveform renders as a solid coloured ring outside the orb,
 * pulsing in/out without spinning. Orb stays perfectly round.
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
  waveAmp: number;
  waveFreqs: number[];
  waveWeights: number[];
}

const STATE_CONFIGS: Record<OrbState, StateConfig> = {
  idle: {
    speed: 1, scale: 1, glow: 0.3, pulseMs: 4000,
    waveAmp: 0, waveFreqs: [2, 3], waveWeights: [0.5, 0.5],
  },
  listening: {
    speed: 1.6, scale: 1.04, glow: 0.55, pulseMs: 1800,
    waveAmp: 0.35, waveFreqs: [2, 3, 5], waveWeights: [0.5, 0.3, 0.2],
  },
  speaking: {
    speed: 1.8, scale: 1.07, glow: 0.65, pulseMs: 1200,
    waveAmp: 0.7, waveFreqs: [3, 5, 7, 11, 13], waveWeights: [0.3, 0.25, 0.2, 0.15, 0.1],
  },
  absorb: {
    speed: 3.0, scale: 1.12, glow: 0.9, pulseMs: 300,
    waveAmp: 0.45, waveFreqs: [4, 7], waveWeights: [0.6, 0.4],
  },
  error: {
    speed: 0.4, scale: 0.94, glow: 0.8, pulseMs: 3000,
    waveAmp: 0.02, waveFreqs: [2], waveWeights: [1],
  },
};

const WAVE_SAMPLES = 128;

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

function generateWaveform(
  time: number, freqs: number[], weights: number[], volume: number,
): Float32Array {
  const out = new Float32Array(WAVE_SAMPLES);
  for (let i = 0; i < WAVE_SAMPLES; i++) {
    const angle = (i / WAVE_SAMPLES) * Math.PI * 2;
    let v = 0;
    for (let f = 0; f < freqs.length; f++) {
      const spatial = Math.sin(angle * freqs[f] + f * 1.7);
      const temporal = 0.5 + 0.5 * Math.sin(time * (1.2 + f * 0.7));
      v += spatial * temporal * weights[f];
    }
    out[i] = (Math.max(0, v) * 0.875 + 0.125) * volume;
  }
  return out;
}

// ─── Component ──────────────────────────────────────────────

export function AdvisorOrb({
  intensity: _intensity = 0,
  isActivated: _isActivated = false,
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
  const waveAmpRef = useRef(0);

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

  // ─── Canvas render loop ─────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Canvas is 2x orb size to allow waveform overshoot
    const canvasScale = 2.0;
    const cssSize = Math.round(size * canvasScale);
    const pxSize = Math.round(cssSize * dpr);
    canvas.width = pxSize;
    canvas.height = pxSize;
    canvas.style.width = cssSize + 'px';
    canvas.style.height = cssSize + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = palette.map(hexToRgb);
    const renderScale = 0.5;
    const rSize = Math.max(16, Math.round(pxSize * renderScale));
    const offCanvas = createOffscreen(rSize, rSize);
    const offCtx = (offCanvas as HTMLCanvasElement).getContext('2d')!;
    const cx = rSize / 2;
    const cy = rSize / 2;
    const orbR = (size / 2) * dpr * renderScale;

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

      // Waveform amplitude — smooth transition
      const targetAmp = lerp(fromCfg.waveAmp, toCfg.waveAmp, e);
      const volumeMod = isInCall && agentVolume > 0 ? 0.4 + agentVolume * 0.6 : 1;
      waveAmpRef.current += (targetAmp * volumeMod - waveAmpRef.current) * 0.06;
      const curAmp = waveAmpRef.current;

      // Voice reactivity — modulate speed slightly
      const voiceBoost = isInCall && agentVolume > 0 ? agentVolume * 0.5 : 0;
      timeRef.current += 0.013 * (speed + voiceBoost);
      const time = timeRef.current;

      // ─── Pixel fill: perfectly round orb ───

      const imgData = offCtx.createImageData(rSize, rSize);
      const data = imgData.data;
      const baseR = orbR * sc;
      const numColors = colors.length;

      for (let py = 0; py < rSize; py++) {
        const dy = py - cy;
        const dySq = dy * dy;
        for (let px = 0; px < rSize; px++) {
          const dx = px - cx;
          const distSq = dx * dx + dySq;
          if (distSq > (baseR + 3) * (baseR + 3)) continue;

          const dist = Math.sqrt(distSq);
          if (dist > baseR + 2) continue;

          const nx = dx / baseR;
          const ny = dy / baseR;
          const nd = dist / baseR;

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
          if (nd > 0.97) alpha = Math.max(0, (1 - nd) / 0.03);

          const i = (py * rSize + px) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = (alpha * 255) | 0;
        }
      }

      offCtx.putImageData(imgData, 0, 0);
      ctx!.clearRect(0, 0, pxSize, pxSize);

      // ─── Waveform ring (drawn BEFORE orb so orb sits on top) ───

      if (curAmp > 0.003) {
        const waveform = generateWaveform(time, toCfg.waveFreqs, toCfg.waveWeights, curAmp);
        const upscale = pxSize / rSize;
        const wcx = pxSize / 2;
        const wcy = pxSize / 2;
        const waveBaseR = baseR * upscale;
        const innerR = waveBaseR - 3;
        const maxWaveHeight = waveBaseR * 1.0;

        // Waveform colour — palette[1] lightened 40% toward white
        const baseColor = colors[1];
        const waveColor: [number, number, number] = [
          Math.round(baseColor[0] + (255 - baseColor[0]) * 0.4),
          Math.round(baseColor[1] + (255 - baseColor[1]) * 0.4),
          Math.round(baseColor[2] + (255 - baseColor[2]) * 0.4),
        ];

        // Single filled ring shape
        ctx!.beginPath();
        // Outer edge (waveform)
        for (let i = 0; i <= WAVE_SAMPLES; i++) {
          const idx = i % WAVE_SAMPLES;
          const a = (idx / WAVE_SAMPLES) * Math.PI * 2;
          const d = waveform[idx] * maxWaveHeight;
          const rr = waveBaseR + d;
          const x = wcx + Math.cos(a) * rr;
          const y = wcy + Math.sin(a) * rr;
          if (i === 0) ctx!.moveTo(x, y); else ctx!.lineTo(x, y);
        }
        ctx!.closePath();

        // Inner circle cutout (counter-clockwise)
        ctx!.moveTo(wcx + innerR, wcy);
        for (let i = WAVE_SAMPLES; i >= 0; i--) {
          const a = (i / WAVE_SAMPLES) * Math.PI * 2;
          ctx!.lineTo(wcx + Math.cos(a) * innerR, wcy + Math.sin(a) * innerR);
        }
        ctx!.closePath();

        ctx!.fillStyle = `rgba(${waveColor[0]}, ${waveColor[1]}, ${waveColor[2]}, 0.15)`;
        ctx!.fill();

        // Soft glow behind waveform
        ctx!.globalCompositeOperation = 'lighter';
        const glowSteps = 3;
        for (let g = glowSteps; g >= 1; g--) {
          const glowAlpha = 0.06 * (1 - g / (glowSteps + 1));
          ctx!.beginPath();
          for (let i = 0; i <= WAVE_SAMPLES; i++) {
            const idx = i % WAVE_SAMPLES;
            const a = (idx / WAVE_SAMPLES) * Math.PI * 2;
            const d = waveform[idx] * maxWaveHeight;
            const rr = waveBaseR + d + g * 4;
            const x = wcx + Math.cos(a) * rr;
            const y = wcy + Math.sin(a) * rr;
            if (i === 0) ctx!.moveTo(x, y); else ctx!.lineTo(x, y);
          }
          ctx!.closePath();
          ctx!.fillStyle = `rgba(${waveColor[0]}, ${waveColor[1]}, ${waveColor[2]}, ${glowAlpha})`;
          ctx!.fill();
        }
        ctx!.globalCompositeOperation = 'source-over';
      }

      // ─── Upscale orb on top ───

      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      ctx!.drawImage(offCanvas as HTMLCanvasElement, 0, 0, rSize, rSize, 0, 0, pxSize, pxSize);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, palette, particleSpeed, isInCall, agentVolume, isSpeaking]);

  // ─── Layout ─────────────────────────────────────────────

  const canvasCSS = Math.round(size * 2.0);
  const offset = Math.round((canvasCSS - size) / 2);

  return (
    <div className={`relative ${className}`} data-orb>
      <div
        className="relative mx-auto"
        style={{ width: size, height: size }}
      >
        {/* Canvas — oversized, centered with negative offset */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            left: -offset,
            top: -offset,
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}