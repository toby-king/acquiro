import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';

/*
 * BirthAnimation v3 — Single continuous canvas, birth → naming.
 *
 * The canvas never unmounts. After the birth phases complete,
 * the orb smoothly slides upward on the canvas, and DOM elements
 * (question + input) overlay on top. On name submit, the canvas
 * renders a celebration burst. Fully seamless, no remount.
 *
 * Canvas phases:
 *  0 VOID (1.8s) → 1 GATHERING (2.8s) → 2 IGNITION (1.8s)
 *  → 3 COALESCENCE (2.5s) → 4 SETTLE (1.0s) → 5 NAMING (indefinite)
 *  → 6 CELEBRATION (1.5s) → 7 TRANSITION (1.0s) → onComplete
 */

interface BirthAnimationProps {
  onComplete: () => void;
  palette?: string[];
  allowProfanity?: boolean;
}

// ─── Particle types ─────────────────────────────────────────

interface GatherParticle {
  type: 0;
  x: number; y: number; tx: number; ty: number;
  prevX: number; prevY: number;
  r: number; g: number; b: number;
  size: number; alpha: number; spd: number;
}

interface BurstParticle {
  type: 1;
  x: number; y: number; vx: number; vy: number;
  prevX: number; prevY: number;
  r: number; g: number; b: number;
  size: number; life: number; decay: number;
}

type Particle = GatherParticle | BurstParticle;

// ─── Constants ──────────────────────────────────────────────

// Default palette matches PALETTE_SETS[1] for consistency
const DEFAULT_PALETTE = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];
const PROFANITY_PALETTE = ['#ef4444', '#dc2626', '#f97316', '#fbbf24'];
const PHASE_DURATIONS = [1.8, 2.8, 1.8, 2.5, 1.0, Infinity, 1.5, 1.5, 2.0];
//                        void gather ignite coalesce settle naming celebration transition fly-to-header

// ─── Helpers ────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeIn(t: number) { return t * t * t; }
function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

function gasNoise(x: number, y: number, t: number, ox: number, oy: number) {
  const x1 = x + ox, y1 = y + oy;
  return (
    Math.sin(x1 * 1.8 + t * 0.7) * 0.35 + Math.sin(y1 * 1.4 + t * 1.1) * 0.35 +
    Math.sin((x1 + y1) * 0.9 + t * 0.8) * 0.25 + Math.sin(x1 * 2.5 - y1 * 1.3 + t * 1.5) * 0.2 +
    Math.sin((x1 * 0.6 + y1 * 2.1) + t * 0.5) * 0.15 +
    Math.cos(x1 * 1.1 - t * 1.2) * Math.sin(y1 * 1.6 + t * 0.9) * 0.2
  );
}

// ─── Particle factories ─────────────────────────────────────

function makeGatherParticle(w: number, h: number, cy: number, colorsRgb: [number, number, number][]): GatherParticle {
  const angle = Math.random() * Math.PI * 2;
  const edgeDist = Math.max(w, h) * 0.55 + Math.random() * 200;
  const col = colorsRgb[Math.floor(Math.random() * colorsRgb.length)];
  return {
    type: 0, x: w / 2 + Math.cos(angle) * edgeDist, y: cy + Math.sin(angle) * edgeDist,
    tx: w / 2 + (Math.random() - 0.5) * 20, ty: cy + (Math.random() - 0.5) * 20,
    r: col[0], g: col[1], b: col[2], size: 1.5 + Math.random() * 2.5,
    alpha: 0, spd: 0.008 + Math.random() * 0.015, prevX: 0, prevY: 0,
  };
}

function makeBurstParticle(cx: number, cy: number, colorsRgb: [number, number, number][], spread = 30): BurstParticle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2 + Math.random() * 10;
  const col = colorsRgb[Math.floor(Math.random() * colorsRgb.length)];
  return {
    type: 1, x: cx + (Math.random() - 0.5) * spread, y: cy + (Math.random() - 0.5) * spread,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    r: col[0], g: col[1], b: col[2], size: 2 + Math.random() * 4,
    life: 1, decay: 0.006 + Math.random() * 0.01, prevX: 0, prevY: 0,
  };
}

// ─── Orb renderer ───────────────────────────────────────────

function renderOrb(
  offCanvas: HTMLCanvasElement, orbR: number, time: number,
  colorsRgb: [number, number, number][], alpha: number,
) {
  const renderSize = Math.ceil(orbR * 2);
  if (renderSize < 4) return;
  const rSize = Math.max(4, Math.ceil(renderSize * 0.5));
  if (offCanvas.width !== renderSize || offCanvas.height !== renderSize) {
    offCanvas.width = renderSize; offCanvas.height = renderSize;
  }
  const offCtx = offCanvas.getContext('2d')!;
  offCtx.clearRect(0, 0, renderSize, renderSize);
  const small = document.createElement('canvas');
  small.width = rSize; small.height = rSize;
  const sCtx = small.getContext('2d')!;
  const imgData = sCtx.createImageData(rSize, rSize);
  const data = imgData.data;
  const center = rSize / 2, r = center - 1;
  const oc = colorsRgb.slice(0, 4), numC = oc.length;

  for (let py = 0; py < rSize; py++) {
    const dy = py - center;
    for (let px = 0; px < rSize; px++) {
      const dx = px - center;
      const distSq = dx * dx + dy * dy;
      if (distSq > (r + 1) * (r + 1)) continue;
      const dist = Math.sqrt(distSq);
      if (dist > r + 0.5) continue;
      const nx = dx / r, ny = dy / r, nd = dist / r;
      const n1 = gasNoise(nx * 2.5, ny * 2.5, time, 0, 0);
      const n2 = gasNoise(nx * 3.2, ny * 3.2, time * 1.3, 7.3, -4.1);
      const n3 = gasNoise(nx * 1.8, ny * 1.8, time * 0.7, -12, 8.5);
      const raw = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      const norm = raw * 0.65 + 0.5;
      const colorPos = Math.abs(norm) * (numC - 1);
      const ci = Math.min(Math.floor(colorPos), numC - 2);
      const frac = colorPos - ci;
      const sf = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
      const c0 = oc[ci], c1 = oc[ci + 1];
      const cr = lerp(c0[0], c1[0], sf), cg = lerp(c0[1], c1[1], sf), cb = lerp(c0[2], c1[2], sf);
      let a = alpha; if (nd > 0.9) a *= Math.max(0, (1 - nd) / 0.1);
      const i = (py * rSize + px) * 4;
      data[i] = cr; data[i + 1] = cg; data[i + 2] = cb; data[i + 3] = (a * 255) | 0;
    }
  }
  sCtx.putImageData(imgData, 0, 0);
  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';
  offCtx.drawImage(small, 0, 0, rSize, rSize, 0, 0, renderSize, renderSize);
}

// ─── Main Component ─────────────────────────────────────────

export function BirthAnimation({ onComplete, palette, allowProfanity = false }: BirthAnimationProps) {
  const { setAdvisorName } = useAdvisorStore();
  
  // Use provided palette, or determine based on allowProfanity
  const finalPalette = palette || (allowProfanity ? PROFANITY_PALETTE : DEFAULT_PALETTE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbOffRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);

  // Shared state between canvas loop and React
  const phaseRef = useRef(0);
  const stateRef = useRef({
    phase: 0, phaseTime: 0, time: 0,
    particles: [] as Particle[],
    orbRadius: 0, orbAlpha: 0,
    orbCenterX: 0.5, // fraction of screen width
    orbCenterY: 0.5, // slightly above center
    orbTargetX: 0.5,
    orbTargetY: 0.5,
    orbTargetRadius: -1, // -1 = use maxOrbR
    screenFlash: 0,
    speedMultiplier: 1,
    celebrationTime: -1,
    nameText: '',
    nameAlpha: 0,
    subtitleAlpha: 0,
  });

  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [namingPhase, setNamingPhase] = useState<'input' | 'celebrating' | 'transition'>('input');
  const inputRef = useRef<HTMLInputElement>(null);
  const completeFiredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Stable color array — only recompute if palette identity changes
  const paletteKey = finalPalette.join(',');
  const colorsRgb = useRef<[number, number, number][]>(finalPalette.map(hexToRgb) as [number, number, number][]);
  useEffect(() => {
    colorsRgb.current = finalPalette.map(hexToRgb) as [number, number, number][];
  }, [paletteKey, finalPalette]);

  // Advance to naming phase (called from canvas loop)
  const enterNamingRef = useRef(() => {
    const s = stateRef.current;
    s.orbTargetY = 0.33; // slide orb up for naming input below
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 600);
  });

  // Name submission
  const handleSubmit = useCallback((submittedName: string) => {
    if (namingPhase !== 'input') return;
    const finalName = submittedName.trim() || 'Advisor';
    setAdvisorName(finalName);
    setShowInput(false);
    setNamingPhase('celebrating');

    const s = stateRef.current;
    s.nameText = finalName;
    s.celebrationTime = 0;
    s.speedMultiplier = 3;

    // Spawn celebration burst
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const orbCy = h * s.orbCenterY;
      for (let i = 0; i < 120; i++) {
        s.particles.push(makeBurstParticle(w / 2, orbCy, colorsRgb.current, 15));
      }
    }

    // Advance canvas to celebration phase
    s.phase = 6;
    s.phaseTime = 0;
    phaseRef.current = 6;
  }, [namingPhase, setAdvisorName]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(name);
  };

  // ─── Canvas loop ────────────────────────────────────────

  useEffect(() => {
    if (!orbOffRef.current) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 4;
      orbOffRef.current = c;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d')!;
    const colors = colorsRgb.current;
    const s = stateRef.current;
    // Reset
    s.phase = 0; s.phaseTime = 0; s.time = 0; s.particles = [];
    s.orbRadius = 0; s.orbAlpha = 0;
    s.orbCenterX = 0.5; s.orbCenterY = 0.45;
    s.orbTargetX = 0.5; s.orbTargetY = 0.45; s.orbTargetRadius = -1;
    s.screenFlash = 0; s.speedMultiplier = 1; s.celebrationTime = -1;
    s.nameText = ''; s.nameAlpha = 0; s.subtitleAlpha = 0;
    phaseRef.current = 0;

    function draw() {
      const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas!.width / dpr2;
      const h = canvas!.height / dpr2;
      ctx.setTransform(dpr2, 0, 0, dpr2, 0, 0);

      s.time += (1 / 60) * s.speedMultiplier;
      s.phaseTime += 1 / 60;

      // Smoothly interpolate orb position
      // Phase 8 uses eased lerp: slow start, smooth arrival
      let posLerp = 0.04;
      let radiusLerp = 0.04;
      if (s.phase === 8) {
        const flyProgress = clamp(s.phaseTime / PHASE_DURATIONS[8]);
        // Ease curve: slow at start and end, faster in middle
        const eased = easeInOut(flyProgress);
        posLerp = 0.02 + eased * 0.06; // 0.02 → 0.08 → eases back
        radiusLerp = 0.02 + eased * 0.05;
      }
      s.orbCenterX += (s.orbTargetX - s.orbCenterX) * posLerp;
      s.orbCenterY += (s.orbTargetY - s.orbCenterY) * posLerp;

      const cx = w * s.orbCenterX;
      const cy = h * s.orbCenterY;
      const maxOrbR = Math.min(w, h) * 0.15;

      // Interpolate orb radius smoothly during fly
      // Convert target radius from pixels to match maxOrbR coordinate system
      if (s.orbTargetRadius > 0 && s.phase >= 8) {
        // orbTargetRadius is already in pixels (24), maxOrbR is also in pixels
        // So we can lerp directly
        s.orbRadius += (s.orbTargetRadius - s.orbRadius) * radiusLerp;
        // Ensure we don't go below target
        if (Math.abs(s.orbRadius - s.orbTargetRadius) < 0.5) {
          s.orbRadius = s.orbTargetRadius;
        }
      }

      // Phase transitions (only for timed phases)
      if (s.phase < 5 && s.phaseTime > PHASE_DURATIONS[s.phase]) {
        s.phase++; s.phaseTime = 0;
        phaseRef.current = s.phase;
        if (s.phase === 2) {
          for (let i = 0; i < 180; i++) s.particles.push(makeBurstParticle(cx, cy, colors));
        }
        if (s.phase === 5) enterNamingRef.current(); // naming phase
      }

      // Celebration → transition (fade text)
      if (s.phase === 6 && s.phaseTime > PHASE_DURATIONS[6]) {
        s.phase = 7; s.phaseTime = 0; phaseRef.current = 7;
        s.speedMultiplier = lerp(s.speedMultiplier, 1, 0.5);
        setNamingPhase('transition');
      }
      // Transition → fly to header
      if (s.phase === 7 && s.phaseTime > PHASE_DURATIONS[7]) {
        s.phase = 8; s.phaseTime = 0; phaseRef.current = 8;
        // Target: header orb position
        // Header is max-w-4xl (896px) centered, with px-6 (24px) padding
        // Orb is 48px (radius 24), first flex item
        const maxW = 896; // max-w-4xl
        const containerLeft = Math.max(0, (w - maxW) / 2);
        const headerPadX = 24; // px-6
        const headerPadY = 16; // py-4
        const orbHeaderRadius = 24; // size={48} / 2
        const targetCx = containerLeft + headerPadX + orbHeaderRadius;
        const targetCy = headerPadY + orbHeaderRadius;
        s.orbTargetX = targetCx / w;
        s.orbTargetY = targetCy / h;
        s.orbTargetRadius = orbHeaderRadius;
      }
      // Fly complete
      if (s.phase === 8 && s.phaseTime > PHASE_DURATIONS[8]) {
        if (!completeFiredRef.current) {
          completeFiredRef.current = true;
          onCompleteRef.current();
        }
      }

      const phase = s.phase;
      const pt = s.phaseTime;

      // ─── Clear
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, w, h);

      // ─── Phase 0: VOID
      if (phase === 0) {
        const breathe = Math.sin(s.time * 1.5) * 0.5 + 0.5;
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        grd.addColorStop(0, `rgba(99, 102, 241, ${0.06 + breathe * 0.06})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
        if (Math.random() < 0.25) s.particles.push(makeGatherParticle(w, h, cy, colors));
      }

      // ─── Phase 1: GATHERING
      if (phase === 1) {
        const intensity = easeIn(clamp(pt / 3));
        for (let i = 0; i < 1 + intensity * 6; i++) s.particles.push(makeGatherParticle(w, h, cy, colors));
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + intensity * 60);
        grd.addColorStop(0, `rgba(168, 85, 247, ${0.1 + intensity * 0.25})`);
        grd.addColorStop(0.5, `rgba(236, 72, 153, ${intensity * 0.1})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      }

      // ─── Phase 2: IGNITION
      if (phase === 2) {
        const flashT = clamp(pt / 0.15);
        const flashOut = clamp((pt - 0.15) / 1.2);
        s.screenFlash = flashT * (1 - flashOut);
        if (s.screenFlash > 0.01) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(255, 255, 255, ${s.screenFlash * 0.6})`; ctx.fillRect(0, 0, w, h);
          const ci2 = Math.floor(s.time * 3) % colors.length;
          const col = colors[ci2];
          ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${s.screenFlash * 0.35})`; ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
        // Shockwaves
        for (const [delay, dur, color, maxW] of [[0, 1.5, '198,255,74', 15], [0.2, 1.3, '236,72,153', 10]] as const) {
          const t = easeOut(clamp((pt - delay) / dur));
          const rr = t * Math.max(w, h) * 0.8;
          const a = (1 - t) * 0.5;
          if (a > 0.01) {
            ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${a})`; ctx.lineWidth = maxW * (1 - t) + 2; ctx.stroke();
          }
        }
        if (pt < 0.4) { for (let i = 0; i < 12; i++) s.particles.push(makeBurstParticle(cx, cy, colors)); }
        // Nebula
        const nebulaAlpha = clamp(pt / 0.3) * (1 - clamp((pt - 0.8) / 1.0));
        if (nebulaAlpha > 0.01) {
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) {
            const col = colors[i % colors.length];
            const ang = (i / 6) * Math.PI * 2 + s.time * 0.3;
            const d = 100 + Math.sin(s.time + i) * 80;
            const nx = cx + Math.cos(ang) * d, ny = cy + Math.sin(ang) * d;
            const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, 200 + nebulaAlpha * 150);
            grd.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${nebulaAlpha * 0.3})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // ─── Phase 3: COALESCENCE
      if (phase === 3) {
        const pullT = easeInOut(clamp(pt / 2.2));
        s.orbRadius = pullT * maxOrbR;
        s.orbAlpha = clamp(pt / 1.5);
        const nebulaFade = 1 - easeIn(clamp(pt / 2.0));
        if (nebulaFade > 0.01) {
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) {
            const col = colors[i % colors.length];
            const ang = (i / 6) * Math.PI * 2 + s.time * 0.4;
            const bd = 200 * (1 - pullT) + 30;
            const nx = cx + Math.cos(ang) * bd, ny = cy + Math.sin(ang) * bd;
            const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, (150 + 100 * (1 - pullT)) * nebulaFade);
            grd.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${nebulaFade * 0.25})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // ─── Phase 4+: orb at full size (but not phase 8, where it shrinks)
      if (phase >= 4 && phase < 8) {
        s.orbRadius = maxOrbR;
        s.orbAlpha = 1;
        // Ease speed back to normal during naming
        if (phase === 5) s.speedMultiplier = lerp(s.speedMultiplier, 1, 0.03);
      }
      
      // Phase 8: orb shrinks as it moves to header position
      if (phase === 8) {
        s.orbAlpha = 1; // Keep alpha at 1 during transition
      }

      // ─── Phase 6: CELEBRATION effects
      if (phase === 6) {
        // Screen flash
        const flash = clamp(pt / 0.1) * (1 - clamp((pt - 0.1) / 0.6));
        if (flash > 0.01) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.4})`; ctx.fillRect(0, 0, w, h);
          const col = colors[1];
          ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${flash * 0.25})`; ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
        // Shockwaves
        for (const [delay, dur, color, maxW] of [[0, 1.2, '168,85,247', 12], [0.15, 1.0, '236,72,153', 8]] as const) {
          const t = easeOut(clamp((pt - delay) / dur));
          const rr = t * Math.max(w, h) * 0.6;
          const a = (1 - t) * 0.4;
          if (a > 0.01) {
            ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${a})`; ctx.lineWidth = maxW * (1 - t) + 2; ctx.stroke();
          }
        }
        // Colour nebula burst
        const nebA = clamp(pt / 0.2) * (1 - clamp((pt - 0.5) / 1.0));
        if (nebA > 0.01) {
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) {
            const col = colors[i % colors.length];
            const ang = (i / 6) * Math.PI * 2 + s.time * 0.5;
            const d = 60 + Math.sin(s.time + i) * 40;
            const nx = cx + Math.cos(ang) * d, ny = cy + Math.sin(ang) * d;
            const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, 120 + nebA * 100);
            grd.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${nebA * 0.3})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
          }
          ctx.globalCompositeOperation = 'source-over';
        }
        // Ease speed back
        s.speedMultiplier = lerp(s.speedMultiplier, 1.2, 0.02);
        // Name text
        s.nameAlpha = easeOut(clamp((pt - 0.3) / 0.6));
        s.subtitleAlpha = easeOut(clamp((pt - 0.8) / 0.5));
      }

      // ─── Phase 7: TRANSITION (text fades)
      if (phase === 7) {
        // Keep text visible for first 0.8s, then fade over remaining 0.7s
        const holdTime = 0.8;
        const fadeTime = PHASE_DURATIONS[7] - holdTime;
        const fadeProgress = clamp((pt - holdTime) / fadeTime);
        
        if (pt < holdTime) {
          // Keep text at full opacity during hold period
          s.nameAlpha = 1;
          s.subtitleAlpha = 1;
        } else {
          // Fade out text smoothly
          s.nameAlpha = Math.max(0, 1 - fadeProgress);
          s.subtitleAlpha = Math.max(0, 1 - fadeProgress);
        }
      }

      // ─── Phase 8: FLY TO HEADER
      if (phase === 8) {
        s.nameAlpha = 0;
        s.subtitleAlpha = 0;
        // Fade background to black for clean transition
        const fadeAlpha = easeInOut(clamp(pt / PHASE_DURATIONS[8]));
        ctx.fillStyle = `rgba(8, 8, 13, ${fadeAlpha * 0.7})`;
        ctx.fillRect(0, 0, w, h);
      }

      // ─── Particles
      ctx.globalCompositeOperation = 'lighter';
      let pIdx = 0;
      for (let pi = 0; pi < s.particles.length; pi++) {
        const p = s.particles[pi];
        if (p.type === 0) {
          const gp = p as GatherParticle;
          const dx = gp.tx - gp.x, dy = gp.ty - gp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          gp.prevX = gp.x; gp.prevY = gp.y;
          gp.x += dx * gp.spd * (phase >= 3 ? 5 : 1);
          gp.y += dy * gp.spd * (phase >= 3 ? 5 : 1);
          gp.alpha = clamp(gp.alpha + 0.02, 0, 0.8);
          if (dist < 5 || (phase >= 3 && dist < 30)) continue;
          ctx.beginPath(); ctx.moveTo(gp.prevX, gp.prevY); ctx.lineTo(gp.x, gp.y);
          ctx.strokeStyle = `rgba(${gp.r}, ${gp.g}, ${gp.b}, ${gp.alpha * 0.25})`;
          ctx.lineWidth = gp.size * 0.6; ctx.stroke();
          ctx.beginPath(); ctx.arc(gp.x, gp.y, gp.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${gp.r}, ${gp.g}, ${gp.b}, ${gp.alpha})`; ctx.fill();
        } else {
          const bp = p as BurstParticle;
          bp.prevX = bp.x; bp.prevY = bp.y;
          bp.x += bp.vx; bp.y += bp.vy; bp.vx *= 0.985; bp.vy *= 0.985; bp.life -= bp.decay;
          if (phase >= 3 && phase <= 4) {
            const dx = cx - bp.x, dy = cy - bp.y, dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) { bp.vx += (dx / dist) * 0.8; bp.vy += (dy / dist) * 0.8; }
            if (dist < s.orbRadius + 10) continue;
          }
          if (bp.life <= 0) continue;
          ctx.beginPath(); ctx.moveTo(bp.prevX, bp.prevY); ctx.lineTo(bp.x, bp.y);
          ctx.strokeStyle = `rgba(${bp.r}, ${bp.g}, ${bp.b}, ${bp.life * 0.2})`;
          ctx.lineWidth = bp.size * 0.4; ctx.stroke();
          ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.size * bp.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${bp.r}, ${bp.g}, ${bp.b}, ${bp.life * 0.6})`; ctx.fill();
        }
        s.particles[pIdx++] = s.particles[pi];
      }
      s.particles.length = pIdx;
      ctx.globalCompositeOperation = 'source-over';

      // ─── Draw orb
      if (s.orbRadius > 2 && s.orbAlpha > 0.01) {
        const orbR = s.orbRadius;
        // Scale pulse during celebration
        const scaleBoost = phase === 6 ? Math.sin(pt * 8) * 0.03 * (1 - clamp(pt / 1.5)) : 0;
        const drawR = orbR * (1 + scaleBoost);

        // Motion trail during fly phase
        if (phase === 8) {
          const trailSteps = 6;
          for (let ti = trailSteps; ti >= 1; ti--) {
            const trailAlpha = (1 - ti / trailSteps) * 0.15;
            // Trail behind current position (toward center of screen)
            const trailX = cx + (w * 0.5 - cx) * (ti * 0.06);
            const trailY = cy + (h * 0.45 - cy) * (ti * 0.06);
            const trailR = drawR * (1 + ti * 0.05);
            const tGrd = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, trailR * 2);
            tGrd.addColorStop(0, `rgba(168, 85, 247, ${trailAlpha})`);
            tGrd.addColorStop(1, 'transparent');
            ctx.fillStyle = tGrd;
            ctx.beginPath(); ctx.arc(trailX, trailY, trailR * 2, 0, Math.PI * 2); ctx.fill();
          }
        }

        const glowIntensity = phase === 6 ? 0.35 : 0.2;
        const glowGrd = ctx.createRadialGradient(cx, cy, drawR * 0.5, cx, cy, drawR * 1.8);
        glowGrd.addColorStop(0, `rgba(168, 85, 247, ${s.orbAlpha * glowIntensity})`);
        glowGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrd; ctx.beginPath(); ctx.arc(cx, cy, drawR * 1.8, 0, Math.PI * 2); ctx.fill();

        renderOrb(orbOffRef.current!, drawR, s.time, colors, s.orbAlpha);
        ctx.drawImage(orbOffRef.current!, cx - drawR, cy - drawR);

        // Gentle ambient pulse
        if (phase >= 4) {
          const pulse = Math.sin(s.time * 2.5) * 0.5 + 0.5;
          const pGrd = ctx.createRadialGradient(cx, cy, drawR * 0.8, cx, cy, drawR * 1.5);
          pGrd.addColorStop(0, `rgba(168, 85, 247, ${pulse * (phase === 6 ? 0.18 : 0.08)})`);
          pGrd.addColorStop(1, 'transparent');
          ctx.fillStyle = pGrd; ctx.beginPath(); ctx.arc(cx, cy, drawR * 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ─── Name + subtitle text (canvas-rendered during celebration)
      if (s.nameText && s.nameAlpha > 0.01) {
        const nameY = cy + s.orbRadius + 55;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `600 ${Math.min(w * 0.07, 36)}px Afacad, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(198, 255, 74, ${s.nameAlpha})`;
        ctx.fillText(s.nameText, cx, nameY);

        if (s.subtitleAlpha > 0.01) {
          ctx.font = `400 ${Math.min(w * 0.03, 13)}px Afacad, system-ui, sans-serif`;
          ctx.fillStyle = `rgba(168, 85, 247, ${s.subtitleAlpha * 0.7})`;
          ctx.fillText('AGENT ACTIVATED', cx, nameY + 32);
        }
      }

      // Ambient sparkles
      if (phase >= 4 && phase <= 7 && Math.random() < 0.12) {
        const ang = Math.random() * Math.PI * 2;
        const d = s.orbRadius * 1.2 + Math.random() * 40;
        const col = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 1 + Math.random(), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${0.2 + Math.random() * 0.3})`; ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] bg-[#08080d] font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* DOM overlay for input — positioned below the orb */}
      <AnimatePresence>
        {showInput && namingPhase === 'input' && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
            style={{ paddingTop: '16vh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="pointer-events-auto flex flex-col items-center gap-6">
              <motion.p
                className="text-white text-lg font-medium text-center"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                What would you like to call me?
              </motion.p>

              <motion.form
                onSubmit={handleFormSubmit}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') handleSubmit('Advisor'); }}
                  placeholder="Enter a name..."
                  className="w-[300px] bg-transparent border-0 border-b-2 border-gray-600 focus:border-[#a855f7] outline-none text-white text-center text-lg pb-2 transition-colors duration-200 placeholder:text-gray-600"
                  maxLength={30}
                />
              </motion.form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
