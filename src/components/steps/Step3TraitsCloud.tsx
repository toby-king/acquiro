import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { useAdvisor } from '../../contexts/AdvisorContext';
import { useParticles } from '../../contexts/ParticleContext';

const likedTraits = [
  'Encouraging', 'Optimistic', 'Humble', 'Curious', 'Methodical',
  'Bold', 'Empathetic', 'Witty', 'Scholarly', 'Pragmatic',
  'Visionary', 'Detail-oriented', 'Big-picture', 'Data-driven', 'Intuitive'
];

const dislikedTraits = [
  'Condescending', 'Impatient', 'Pessimistic', 'Vague', 'Overly cautious',
  'Reckless', 'Dismissive', 'Pedantic', 'Sycophantic', 'Robotic'
];

function TraitPill({
  trait,
  isSelected,
  onClick,
  onRef,
  color,
  index,
}: {
  trait: string;
  isSelected: boolean;
  onClick: () => void;
  onRef?: (el: HTMLButtonElement | null) => void;
  color: string;
  index: number;
}) {
  return (
    <motion.button
      ref={onRef}
      className="relative px-4 py-2 rounded-full text-sm font-medium cursor-pointer"
      style={{
        background: isSelected ? color : 'var(--card-bg)',
        border: `2px solid ${isSelected ? color : 'var(--border-color)'}`,
        color: isSelected ? 'white' : 'var(--text-primary)',
      }}
      initial={{ opacity: 0, scale: 0, rotate: Math.random() * 360 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: 0,
        y: Math.sin(index * 0.5) * 5,
      }}
      transition={{
        delay: index * 0.05,
        y: {
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        },
      }}
      whileHover={{
        scale: 1.1,
        boxShadow: `0 0 20px ${color}40`,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: color,
            opacity: 0.3,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
      <span className="relative">{trait}</span>
    </motion.button>
  );
}

export function Step3TraitsCloud() {
  const { state, toggleLikedTrait, toggleDislikedTrait } = useAdvisor();
  const { triggerParticle } = useParticles();
  const traitRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const canSelectMoreLiked = state.likedTraits.length < 5;
  const canSelectMoreDisliked = state.dislikedTraits.length < 5;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <motion.div
          className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Step 3 of 5
        </motion.div>
        <motion.h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Define Your Advisor's Character
        </motion.h2>
        <motion.p
          className="text-lg"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Select up to 5 traits you want, and 5 you want to avoid
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, var(--card-bg) 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Embrace These Traits
            </h3>
            <motion.div
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                border: '2px solid rgba(34, 197, 94, 0.4)',
                color: '#22c55e',
              }}
              animate={!canSelectMoreLiked ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={!canSelectMoreLiked ? {
                duration: 0.3,
              } : {}}
            >
              {state.likedTraits.length}/5
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3 min-h-[200px]">
            {likedTraits.map((trait, index) => {
              const isSelected = state.likedTraits.includes(trait);
              const refKey = `liked-${trait}`;
              return (
                <TraitPill
                  key={trait}
                  onRef={(el) => (traitRefs.current[refKey] = el)}
                  trait={trait}
                  isSelected={isSelected}
                  onClick={() => {
                    if (isSelected || canSelectMoreLiked) {
                      const wasSelected = isSelected;
                      toggleLikedTrait(trait);
                      if (!wasSelected) {
                        const ref = traitRefs.current[refKey];
                        if (ref) triggerParticle(ref);
                      }
                    }
                  }}
                  color="#22c55e"
                  index={index}
                />
              );
            })}
          </div>

          <AnimatePresence>
            {state.likedTraits.length > 0 && (
              <motion.div
                className="mt-6 pt-6"
                style={{ borderTop: '1px solid var(--border-color)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Selected traits:
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.likedTraits.map((trait) => (
                    <motion.span
                      key={trait}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {trait}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, var(--card-bg) 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Avoid These Traits
            </h3>
            <motion.div
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
              }}
              animate={!canSelectMoreDisliked ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={!canSelectMoreDisliked ? {
                duration: 0.3,
              } : {}}
            >
              {state.dislikedTraits.length}/5
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3 min-h-[200px]">
            {dislikedTraits.map((trait, index) => {
              const isSelected = state.dislikedTraits.includes(trait);
              const refKey = `disliked-${trait}`;
              return (
                <TraitPill
                  key={trait}
                  onRef={(el) => (traitRefs.current[refKey] = el)}
                  trait={trait}
                  isSelected={isSelected}
                  onClick={() => {
                    if (isSelected || canSelectMoreDisliked) {
                      const wasSelected = isSelected;
                      toggleDislikedTrait(trait);
                      if (!wasSelected) {
                        const ref = traitRefs.current[refKey];
                        if (ref) triggerParticle(ref);
                      }
                    }
                  }}
                  color="#ef4444"
                  index={index}
                />
              );
            })}
          </div>

          <AnimatePresence>
            {state.dislikedTraits.length > 0 && (
              <motion.div
                className="mt-6 pt-6"
                style={{ borderTop: '1px solid var(--border-color)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Selected traits:
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.dislikedTraits.map((trait) => (
                    <motion.span
                      key={trait}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {trait}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
