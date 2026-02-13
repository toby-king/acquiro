import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useParticles } from '../contexts/ParticleContext';

interface Particle {
  id: number;
  angle: number;
  radius: number;
  speed: number;
  opacity: number;
}

export function FluidOrbAvatar() {
  const { state, getCompletionPercentage } = useAdvisor();
  const completion = getCompletionPercentage();
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripple, setRipple] = useState(false);
  const controls = useAnimation();
  const orbRef = useRef<HTMLDivElement>(null);
  const { setOrbPosition, particles: flyingParticles } = useParticles();

  const activeType = state.previewType || state.advisorType;
  const isStep1 = !state.personalityPreset;

  const completedSteps = Math.floor(completion / 20);
  const intensity = 0.5 + (completedSteps * 0.1);
  const particleCount = 10 + (completedSteps * 2);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        angle: Math.random() * Math.PI * 2,
        radius: 20 + Math.random() * 60,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 0.4 + Math.random() * 0.4,
      });
    }
    setParticles(newParticles);
  }, [particleCount]);

  useEffect(() => {
    const updateOrbPosition = () => {
      if (orbRef.current) {
        const rect = orbRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setOrbPosition(centerX, centerY);
      }
    };

    updateOrbPosition();
    window.addEventListener('resize', updateOrbPosition);
    window.addEventListener('scroll', updateOrbPosition);

    return () => {
      window.removeEventListener('resize', updateOrbPosition);
      window.removeEventListener('scroll', updateOrbPosition);
    };
  }, [setOrbPosition]);

  useEffect(() => {
    if (flyingParticles.length > 0) {
      const latest = flyingParticles[flyingParticles.length - 1];
      const delay = 500;

      setTimeout(() => {
        setRipple(true);
        controls.start({
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
          transition: { duration: 0.3 },
        });
        setTimeout(() => setRipple(false), 300);
      }, delay);
    }
  }, [flyingParticles, controls]);

  const baseSpeed = isHovered ? 10 : 12;
  const animationSpeed = baseSpeed / intensity;

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div
        className="rounded-3xl p-8 relative overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Your AI Advisor
          </h3>
        </div>

        <div className="relative flex items-center justify-center h-72 mb-8">
          <div
            ref={orbRef}
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ width: '200px', height: '200px' }}
          >
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="relative z-10"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <radialGradient id="orb-glow" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="orb-interior" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.1" />
                </radialGradient>

                <filter id="orb-blur">
                  <feGaussianBlur stdDeviation="2" />
                </filter>

                <filter id="glow-effect">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <motion.circle
                cx="100"
                cy="100"
                r="120"
                fill="url(#orb-glow)"
                animate={{
                  r: isHovered ? [120, 130, 120] : [120, 125, 120],
                  opacity: isHovered ? 0.4 : 0.3,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <motion.g
                animate={{ rotate: 360 }}
                transition={{
                  duration: animationSpeed,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ transformOrigin: '100px 100px' }}
              >
                <ellipse
                  cx="100"
                  cy="100"
                  rx="85"
                  ry="90"
                  fill="url(#orb-interior)"
                  filter="url(#orb-blur)"
                  opacity={0.3 * intensity}
                />
                <ellipse
                  cx="100"
                  cy="100"
                  rx="75"
                  ry="80"
                  fill="url(#orb-interior)"
                  filter="url(#orb-blur)"
                  opacity={0.4 * intensity}
                />
              </motion.g>

              <motion.g
                animate={{ rotate: -360 }}
                transition={{
                  duration: animationSpeed * 1.3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ transformOrigin: '100px 100px' }}
              >
                <ellipse
                  cx="100"
                  cy="100"
                  rx="70"
                  ry="75"
                  fill="url(#orb-interior)"
                  filter="url(#orb-blur)"
                  opacity={0.35 * intensity}
                />
              </motion.g>

              {particles.map((particle) => (
                <motion.g key={particle.id}>
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="2"
                    fill="var(--accent-color)"
                    filter="url(#glow-effect)"
                    animate={{
                      cx: [
                        100 + Math.cos(particle.angle) * particle.radius,
                        100 + Math.cos(particle.angle + Math.PI) * particle.radius * 0.7,
                        100 + Math.cos(particle.angle + Math.PI * 2) * particle.radius,
                      ],
                      cy: [
                        100 + Math.sin(particle.angle) * particle.radius,
                        100 + Math.sin(particle.angle + Math.PI) * particle.radius * 0.7,
                        100 + Math.sin(particle.angle + Math.PI * 2) * particle.radius,
                      ],
                      opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
                    }}
                    transition={{
                      duration: (8 + particle.speed * 4) / intensity,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.g>
              ))}

              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="var(--accent-color)"
                strokeWidth="1.5"
                opacity={isHovered ? 0.5 : 0.3}
                filter="url(#glow-effect)"
                animate={controls}
              />

              {ripple && (
                <motion.circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="2"
                  initial={{ r: 90, opacity: 0.8 }}
                  animate={{ r: 110, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}

              <motion.circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="var(--accent-color)"
                strokeWidth="0.5"
                opacity="0.2"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          {isStep1 ? (
            <>
              {['Patience', 'Analytical', 'Warmth'].map((stat) => (
                <div key={stat}>
                  <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-medium">{stat}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>—</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-color)', opacity: 0.5 }}>
                    <div className="h-full rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-center mt-4" style={{ color: 'var(--text-tertiary)' }}>
                Set in Step 2
              </p>
            </>
          ) : (
            <>
              {Object.entries(state.personalityStats).slice(0, 3).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-medium capitalize">{key}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-color)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, var(--accent-color), var(--accent-color-text))',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Configuration Progress
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {completion.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'var(--border-color)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--accent-color), var(--accent-color-text))',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
