import { motion } from 'framer-motion';
import { useAdvisor } from '../contexts/AdvisorContext';

export function PreviewAvatar() {
  const { state, getCompletionPercentage } = useAdvisor();
  const completion = getCompletionPercentage();

  const activeType = state.previewType || state.advisorType;
  const isStep1 = !state.personalityPreset;

  const getAdvisorStyle = () => {
    switch (activeType) {
      case 'mentor':
        return {
          primary: '#3b82f6',
          secondary: '#60a5fa',
          tertiary: '#10b981',
          formStyle: 'soft',
          speed: 4,
          intensity: 0.7,
        };
      case 'workhorse':
        return {
          primary: '#a855f7',
          secondary: '#c084fc',
          tertiary: '#ec4899',
          formStyle: 'sharp',
          speed: 2,
          intensity: 1.2,
        };
      case 'hybrid':
        return {
          primary: '#3b82f6',
          secondary: '#a855f7',
          tertiary: '#6366f1',
          formStyle: 'balanced',
          speed: 3,
          intensity: 1,
        };
      default:
        return {
          primary: '#C6FF4A',
          secondary: '#9FCC3B',
          tertiary: '#84cc16',
          formStyle: 'neutral',
          speed: 3.5,
          intensity: 0.8,
        };
    }
  };

  const style = getAdvisorStyle();

  const getSoftness = () => {
    if (style.formStyle === 'soft') return 0.15;
    if (style.formStyle === 'sharp') return 0.05;
    return 0.1;
  };

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
          <svg width="300" height="300" viewBox="0 0 300 300" className="relative z-10">
            <defs>
              <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={style.primary} />
                <stop offset="100%" stopColor={style.secondary} />
              </linearGradient>
              <radialGradient id="glow-gradient">
                <stop offset="0%" stopColor={style.primary} stopOpacity="0.4" />
                <stop offset="50%" stopColor={style.secondary} stopOpacity="0.2" />
                <stop offset="100%" stopColor={style.tertiary} stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <motion.circle
              cx="150"
              cy="150"
              r="100"
              fill="url(#glow-gradient)"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: style.speed * 0.7,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.g
              animate={{
                rotate: 360,
              }}
              style={{ transformOrigin: '150px 150px' }}
              transition={{
                duration: style.speed * 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.circle
                  key={angle}
                  cx={150 + Math.cos((angle * Math.PI) / 180) * 85}
                  cy={150 + Math.sin((angle * Math.PI) / 180) * 85}
                  r="3"
                  fill={style.primary}
                  opacity="0.4"
                  animate={{
                    r: [3, 5, 3],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: style.speed * 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.g>

            <motion.path
              d={`
                M 150,80
                Q ${170 + Math.random() * 10},${100 + Math.random() * 10} 180,130
                Q ${190 + Math.random() * 10},${160 + Math.random() * 10} 170,190
                Q ${150 + Math.random() * 10},${200 + Math.random() * 10} 130,190
                Q ${110 + Math.random() * 10},${160 + Math.random() * 10} 120,130
                Q ${130 + Math.random() * 10},${100 + Math.random() * 10} 150,80
              `}
              fill="url(#avatar-gradient)"
              opacity="0.3"
              filter="url(#glow)"
              animate={{
                d: [
                  `M 150,80 Q 170,100 180,130 Q 190,160 170,190 Q 150,200 130,190 Q 110,160 120,130 Q 130,100 150,80`,
                  `M 150,75 Q 175,105 185,135 Q 195,165 165,195 Q 145,205 125,195 Q 105,165 115,135 Q 125,105 150,75`,
                  `M 150,80 Q 170,100 180,130 Q 190,160 170,190 Q 150,200 130,190 Q 110,160 120,130 Q 130,100 150,80`,
                ],
              }}
              transition={{
                duration: style.speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.ellipse
              cx="150"
              cy="150"
              rx="60"
              ry="65"
              fill="url(#avatar-gradient)"
              opacity="0.8"
              animate={{
                rx: [60, 60 + getSoftness() * 100, 60],
                ry: [65, 65 - getSoftness() * 50, 65],
                scale: [1, 1 + getSoftness() * 0.5, 1],
              }}
              transition={{
                duration: style.speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.circle
              cx="150"
              cy="145"
              r="45"
              fill={style.secondary}
              opacity="0.6"
              animate={{
                scale: [1, 1.05, 1],
                cy: [145, 145 - getSoftness() * 30, 145],
              }}
              transition={{
                duration: style.speed * 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {state.voice && (
              <motion.g
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.circle
                    key={i}
                    cx={135 + i * 15}
                    cy="180"
                    r="3"
                    fill={style.primary}
                    animate={{
                      r: [3, 6, 3],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.g>
            )}
          </svg>
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
                        background: `linear-gradient(90deg, ${style.primary}, ${style.secondary})`,
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
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${style.primary}, ${style.secondary})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.5 }}
            >
              {completion > 0 && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
