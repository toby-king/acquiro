import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvisorOrb } from './AdvisorOrb';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';

/*
 * NamingCeremony — Gentle, intimate naming moment.
 *
 * The orb is already formed from BirthAnimation.
 * User types a name → orb pulses on submit → name appears → transition out.
 *
 * Same interface as the original NamingCeremony.
 */

interface NamingCeremonyProps {
  onComplete: () => void;
}

type Phase = 'input' | 'absorbing' | 'reveal' | 'transition';

export function NamingCeremony({ onComplete }: NamingCeremonyProps) {
  const { setAdvisorName } = useAdvisorStore();
  const [phase, setPhase] = useState<Phase>('input');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (submittedName: string) => {
    const finalName = submittedName.trim() || 'Advisor';
    setDisplayName(finalName);
    setAdvisorName(finalName);

    // Phase: absorbing — trigger orb reaction
    setPhase('absorbing');
    window.dispatchEvent(new CustomEvent('orb-absorb'));

    // Phase: reveal — show the name
    setTimeout(() => setPhase('reveal'), 600);

    // Phase: transition — shrink out
    setTimeout(() => setPhase('transition'), 2200);

    // Complete
    setTimeout(() => onComplete(), 3200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'input') handleSubmit(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleSubmit('Advisor');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex items-center justify-center">
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        animate={{
          scale: phase === 'transition' ? 0.4 : 1,
          y: phase === 'transition' ? -300 : 0,
          opacity: phase === 'transition' ? 0 : 1,
        }}
        transition={{
          duration: phase === 'transition' ? 1 : 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <AdvisorOrb
            intensity={100}
            isActivated
            size={200}
            paletteIndex={1}
            particleSpeed={phase === 'absorbing' ? 3 : phase === 'reveal' ? 1.5 : 1}
            glowMultiplier={phase === 'absorbing' ? 2 : phase === 'reveal' ? 1.3 : 1}
          />
        </motion.div>

        {/* Question */}
        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.p
              key="question"
              className="text-white text-lg font-medium text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              What would you like to call me?
            </motion.p>
          )}
        </AnimatePresence>

        {/* Input */}
        <AnimatePresence>
          {phase === 'input' && (
            <motion.form
              onSubmit={handleFormSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a name..."
                className="w-[300px] bg-transparent border-0 border-b-2 border-[var(--text-secondary)] focus:border-accent outline-none text-white text-center text-lg pb-2 transition-colors duration-200 placeholder:text-[var(--text-secondary)]"
                maxLength={30}
              />
            </motion.form>
          )}
        </AnimatePresence>

        {/* Name reveal */}
        <AnimatePresence>
          {(phase === 'reveal' || phase === 'transition') && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <p className="text-accent text-3xl font-bold text-center">
                {displayName}
              </p>
              <motion.p
                className="text-accent/60 text-sm uppercase tracking-widest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Agent Activated
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
