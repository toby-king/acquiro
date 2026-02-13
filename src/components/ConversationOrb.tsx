import { motion } from 'framer-motion';

interface ConversationOrbProps {
  size?: number;
  state?: 'idle' | 'typing' | 'thinking';
}

export function ConversationOrb({ size = 80, state = 'idle' }: ConversationOrbProps) {
  const intensity = state === 'thinking' ? 1.5 : (state === 'typing' ? 1.2 : 1);
  const particleCount = state === 'thinking' ? 12 : 8;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="relative">
      <defs>
        <radialGradient id="conv-orb-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.2" />
          <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="conv-orb-interior" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.15" />
          <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.1" />
        </radialGradient>

        <filter id="conv-blur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>

        <filter id="conv-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.circle
        cx="50"
        cy="50"
        r="60"
        fill="url(#conv-orb-glow)"
        animate={{
          r: [58, 62, 58],
          opacity: state === 'thinking' ? [0.4, 0.6, 0.4] : 0.3,
        }}
        transition={{
          duration: 2.5 / intensity,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.g
        animate={{ rotate: 360 }}
        transition={{
          duration: 10 / intensity,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformOrigin: '50px 50px' }}
      >
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="42"
          fill="url(#conv-orb-interior)"
          filter="url(#conv-blur)"
          opacity={0.3 * intensity}
        />
      </motion.g>

      <motion.g
        animate={{ rotate: -360 }}
        transition={{
          duration: 12 / intensity,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformOrigin: '50px 50px' }}
      >
        <ellipse
          cx="50"
          cy="50"
          rx="32"
          ry="36"
          fill="url(#conv-orb-interior)"
          filter="url(#conv-blur)"
          opacity={0.35 * intensity}
        />
      </motion.g>

      {[...Array(particleCount)].map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 20 + (i % 3) * 8;

        return (
          <motion.circle
            key={i}
            cx="50"
            cy="50"
            r="1.5"
            fill="var(--accent-color)"
            filter="url(#conv-glow)"
            animate={{
              cx: [
                50 + Math.cos(angle) * radius,
                50 + Math.cos(angle + Math.PI) * radius * 0.6,
                50 + Math.cos(angle + Math.PI * 2) * radius,
              ],
              cy: [
                50 + Math.sin(angle) * radius,
                50 + Math.sin(angle + Math.PI) * radius * 0.6,
                50 + Math.sin(angle + Math.PI * 2) * radius,
              ],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: (6 + i * 0.3) / intensity,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      <motion.circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="1"
        opacity={0.4}
        filter="url(#conv-glow)"
        animate={{
          r: [41, 43, 41],
          opacity: state === 'thinking' ? [0.4, 0.6, 0.4] : [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 3 / intensity,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </svg>
  );
}
