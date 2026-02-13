import { motion } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, Zap, Scale } from 'lucide-react';
import { useAdvisor, AdvisorType } from '../../contexts/AdvisorContext';
import { useParticles } from '../../contexts/ParticleContext';

const advisorTypes = [
  {
    id: 'mentor' as AdvisorType,
    icon: GraduationCap,
    title: 'Mentor',
    tagline: 'Patient guidance through every decision',
    description: 'Perfect for first-time acquirers. Your advisor will explain concepts, ask clarifying questions, and ensure you understand each step before moving forward.',
    primaryColor: '#3b82f6',
    secondaryColor: '#60a5fa',
    borderGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(96, 165, 250, 0.1) 100%)',
  },
  {
    id: 'workhorse' as AdvisorType,
    icon: Zap,
    title: 'Workhorse',
    tagline: 'Maximum efficiency, minimum hand-holding',
    description: 'For experienced buyers who want powerful analysis without the preamble. Direct insights, rapid execution, advanced features unlocked.',
    primaryColor: '#a855f7',
    secondaryColor: '#c084fc',
    borderGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(192, 132, 252, 0.1) 100%)',
  },
  {
    id: 'hybrid' as AdvisorType,
    icon: Scale,
    title: 'Hybrid',
    tagline: 'Adaptive intelligence that reads the room',
    description: 'Starts supportive, learns your style, and adjusts. Get guidance when you need it, speed when you don\'t.',
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    borderGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.1) 100%)',
  },
];

export function Step1AdvisorType() {
  const { state, updateAdvisorType, setPreviewType } = useAdvisor();
  const { triggerParticle } = useParticles();
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <motion.h2
          className="text-3xl font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Choose Your Advisor Type
        </motion.h2>
        <motion.p
          className="text-base"
          style={{ color: 'var(--text-tertiary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          How would you like your advisor to support you?
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {advisorTypes.map((type, index) => {
          const isSelected = state.advisorType === type.id;
          const Icon = type.icon;

          return (
            <motion.button
              key={type.id}
              ref={(el) => (buttonRefs.current[type.id] = el)}
              className="relative rounded-2xl p-6 cursor-pointer text-left transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isSelected ? 1 : (state.advisorType ? 0.6 : 1),
                x: 0,
              }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.02,
                opacity: 1,
                y: -4,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                updateAdvisorType(type.id);
                setPreviewType(null);
                const btn = buttonRefs.current[type.id];
                if (btn) triggerParticle(btn);
              }}
              onMouseEnter={() => !state.advisorType && setPreviewType(type.id)}
              onMouseLeave={() => setPreviewType(null)}
              style={{
                background: 'var(--card-bg)',
                border: isSelected ? `2px solid var(--accent-color)` : '1px solid var(--card-border)',
                boxShadow: isSelected
                  ? `0 0 30px rgba(198, 255, 74, 0.3), var(--shadow-lg)`
                  : 'var(--shadow-sm)',
              }}
            >
              <motion.div
                className="absolute inset-0 opacity-0 pointer-events-none"
                style={{
                  background: type.borderGradient,
                }}
                animate={{
                  opacity: isSelected ? 0.1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {isSelected && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(198, 255, 74, 0.15) 0%, transparent 70%)`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.5, 1],
                    opacity: [0, 0.5, 0.3],
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              )}

              <div className="relative flex items-center gap-6">
                <motion.div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${type.primaryColor}, ${type.secondaryColor})`
                      : 'var(--border-color)',
                  }}
                  animate={{
                    scale: isSelected ? [1, 1.05, 1] : 1,
                  }}
                  transition={isSelected ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  } : {}}
                >
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                  <Icon
                    size={48}
                    color={isSelected ? "white" : "var(--text-secondary)"}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {type.title}
                  </h3>

                  <p
                    className="text-base font-medium mb-3"
                    style={{
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                      transition: 'color 0.3s',
                    }}
                  >
                    {type.tagline}
                  </p>

                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)', opacity: 0.85 }}>
                    {type.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  className="absolute top-4 right-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--accent-color)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13 4L6 11L3 8"
                        stroke="#0a0a0a"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
