import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BirthAnimationProps {
  onComplete: () => void;
}

export function BirthAnimation({ onComplete }: BirthAnimationProps) {
  const [phase, setPhase] = useState<'anticipation' | 'awakening' | 'stabilization' | 'transition'>('anticipation');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('awakening'), 500),
      setTimeout(() => setPhase('stabilization'), 1500),
      setTimeout(() => setPhase('transition'), 2500),
      setTimeout(() => onComplete(), 3500),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, var(--bg-primary) 70%)',
        }}
        animate={{
          opacity: phase === 'anticipation' ? 0.3 : (phase === 'awakening' ? 0.6 : 0.5),
        }}
        transition={{ duration: 0.3 }}
      />

      {phase === 'awakening' && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'var(--accent-color)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.3 }}
        />
      )}

      <div className="relative" style={{ width: '240px', height: '240px' }}>
        <svg width="240" height="240" viewBox="0 0 240 240" className="relative z-10">
          <defs>
            <radialGradient id="birth-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity={phase === 'awakening' ? '0.6' : '0.3'} />
              <stop offset="50%" stopColor="var(--accent-color)" stopOpacity={phase === 'awakening' ? '0.3' : '0.15'} />
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="birth-core" cx="50%" cy="50%">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.2" />
            </radialGradient>

            <filter id="birth-blur">
              <feGaussianBlur stdDeviation="3" />
            </filter>

            <filter id="glow-intense">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <motion.circle
            cx="120"
            cy="120"
            r={phase === 'awakening' ? 160 : 140}
            fill="url(#birth-glow)"
            animate={{
              r: phase === 'awakening' ? [140, 180, 160] : (phase === 'stabilization' ? [160, 140] : 140),
              opacity: phase === 'awakening' ? [0.5, 1, 0.7] : (phase === 'stabilization' ? [0.7, 0.5] : 0.5),
            }}
            transition={{
              duration: phase === 'awakening' ? 0.8 : 0.5,
              ease: 'easeOut',
            }}
          />

          {phase === 'awakening' && (
            <>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.line
                  key={angle}
                  x1="120"
                  y1="120"
                  x2={120 + Math.cos((angle * Math.PI) / 180) * 80}
                  y2={120 + Math.sin((angle * Math.PI) / 180) * 80}
                  stroke="var(--accent-color)"
                  strokeWidth="2"
                  opacity="0.6"
                  filter="url(#glow-intense)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.05,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}

          <motion.g
            animate={{
              rotate: phase === 'awakening' ? 720 : (phase === 'anticipation' ? 0 : 360),
            }}
            transition={{
              duration: phase === 'awakening' ? 0.8 : (phase === 'stabilization' ? 1 : 1),
              ease: phase === 'awakening' ? 'easeOut' : 'linear',
            }}
            style={{ transformOrigin: '120px 120px' }}
          >
            <ellipse
              cx="120"
              cy="120"
              rx="90"
              ry="95"
              fill="url(#birth-core)"
              filter="url(#birth-blur)"
              opacity={phase === 'awakening' ? 0.6 : 0.4}
            />
          </motion.g>

          <motion.g
            animate={{
              rotate: phase === 'awakening' ? -720 : (phase === 'anticipation' ? 0 : -360),
            }}
            transition={{
              duration: phase === 'awakening' ? 0.8 : (phase === 'stabilization' ? 1.2 : 1.2),
              ease: phase === 'awakening' ? 'easeOut' : 'linear',
            }}
            style={{ transformOrigin: '120px 120px' }}
          >
            <ellipse
              cx="120"
              cy="120"
              rx="80"
              ry="85"
              fill="url(#birth-core)"
              filter="url(#birth-blur)"
              opacity={phase === 'awakening' ? 0.5 : 0.35}
            />
          </motion.g>

          {phase === 'awakening' && (
            <motion.circle
              cx="120"
              cy="120"
              r="10"
              fill="var(--accent-color)"
              filter="url(#glow-intense)"
              initial={{ r: 0, opacity: 0 }}
              animate={{
                r: [0, 100, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            />
          )}

          {[...Array(phase === 'awakening' ? 25 : 15)].map((_, i) => {
            const angle = (i / (phase === 'awakening' ? 25 : 15)) * Math.PI * 2;
            const radius = phase === 'anticipation' ? 40 + Math.random() * 30 : (phase === 'awakening' ? 20 : 50 + Math.random() * 30);

            return (
              <motion.circle
                key={i}
                cx="120"
                cy="120"
                r="2.5"
                fill="var(--accent-color)"
                filter="url(#glow-intense)"
                animate={{
                  cx: phase === 'anticipation'
                    ? [120 + Math.cos(angle) * radius, 120 + Math.cos(angle) * (radius * 0.5), 120 + Math.cos(angle) * radius]
                    : (phase === 'awakening'
                      ? [120 + Math.cos(angle) * 20, 120 + Math.cos(angle) * 95, 120 + Math.cos(angle) * 85]
                      : [120 + Math.cos(angle) * 85, 120 + Math.cos(angle) * (50 + Math.random() * 30)]),
                  cy: phase === 'anticipation'
                    ? [120 + Math.sin(angle) * radius, 120 + Math.sin(angle) * (radius * 0.5), 120 + Math.sin(angle) * radius]
                    : (phase === 'awakening'
                      ? [120 + Math.sin(angle) * 20, 120 + Math.sin(angle) * 95, 120 + Math.sin(angle) * 85]
                      : [120 + Math.sin(angle) * 85, 120 + Math.sin(angle) * (50 + Math.random() * 30)]),
                  opacity: phase === 'awakening' ? [0.4, 1, 0.7] : [0.7, 0.5],
                }}
                transition={{
                  duration: phase === 'anticipation' ? 2 : (phase === 'awakening' ? 0.8 : 1.5),
                  ease: phase === 'awakening' ? 'easeOut' : 'easeInOut',
                  repeat: phase === 'anticipation' ? Infinity : 0,
                }}
              />
            );
          })}

          <motion.circle
            cx="120"
            cy="120"
            r="100"
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth="2"
            filter="url(#glow-intense)"
            animate={{
              r: phase === 'awakening' ? [100, 110, 105] : 105,
              opacity: phase === 'awakening' ? [0.4, 0.8, 0.5] : 0.5,
              strokeWidth: phase === 'awakening' ? [2, 3, 2] : 2,
            }}
            transition={{
              duration: phase === 'awakening' ? 0.8 : 0.5,
            }}
          />

          {phase === 'awakening' && (
            <motion.circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="3"
              initial={{ r: 100, opacity: 0.8 }}
              animate={{
                r: 160,
                opacity: 0,
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            />
          )}
        </svg>

        {phase === 'stabilization' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--accent-color)' }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
