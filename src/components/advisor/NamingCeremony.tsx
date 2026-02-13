import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvisorOrb } from './AdvisorOrb';
import { ParticleBurst } from './ParticleBurst';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';

interface NamingCeremonyProps {
  onComplete: () => void;
}

type CeremonyPhase = 'waiting' | 'input' | 'recognition' | 'celebration' | 'settling' | 'transition';

export function NamingCeremony({ onComplete }: NamingCeremonyProps) {
  const { setAdvisorName, advisorName } = useAdvisorStore();
  const [phase, setPhase] = useState<CeremonyPhase>('waiting');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const [orbPosition, setOrbPosition] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(false);
  const [prefersReducedMotion] = useState(() => 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Get orb center position for particle burst (relative to viewport)
  useEffect(() => {
    if (orbRef.current && phase === 'celebration') {
      const rect = orbRef.current.getBoundingClientRect();
      setOrbPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setShowParticles(true);
    }
  }, [phase]);

  // Auto-focus input when it appears
  useEffect(() => {
    if (phase === 'input' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [phase]);

  // Phase transitions
  useEffect(() => {
    if (phase === 'waiting') {
      const timer = setTimeout(() => setPhase('input'), 300);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setDisplayName(name.trim());
      setAdvisorName(name.trim());
      setPhase('recognition');
      
      // Move to celebration after recognition
      setTimeout(() => {
        setPhase('celebration');
      }, 500);
      
      // Move to settling after celebration
      setTimeout(() => {
        setPhase('settling');
      }, 1500);
      
      // Move to transition after settling
      setTimeout(() => {
        setPhase('transition');
      }, 2000);
      
      // Complete after transition
      setTimeout(() => {
        onComplete();
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      // Use default name
      const defaultName = 'Advisor';
      setDisplayName(defaultName);
      setAdvisorName(defaultName);
      setPhase('recognition');
      setTimeout(() => setPhase('celebration'), 500);
      setTimeout(() => setPhase('settling'), 1500);
      setTimeout(() => setPhase('transition'), 2000);
      setTimeout(() => onComplete(), 3000);
    }
  };

  const glowIntensity = phase === 'celebration' ? 2.5 : phase === 'settling' ? 1.5 : phase === 'waiting' ? 1.2 : 1;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex items-center justify-center">
      {/* Vignette overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: 0.2 }}
        transition={{ duration: 0.3 }}
      />

          {/* Screen flash during celebration */}
      <AnimatePresence>
        {phase === 'celebration' && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.05, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Orb container */}
      <motion.div
        ref={orbRef}
        className="relative z-10 flex flex-col items-center gap-8"
        animate={{
          scale: phase === 'transition' ? 0.4 : 1,
          y: phase === 'transition' ? -300 : 0,
        }}
        transition={{
          duration: phase === 'transition' ? 1 : 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Orb with enhanced glow */}
        <div className="relative">
          <AdvisorOrb 
            intensity={100} 
            isActivated={phase !== 'waiting'} 
            size={200}
            glowMultiplier={glowIntensity}
            particleSpeed={phase === 'celebration' ? 3 : phase === 'settling' ? 1.5 : 1}
          />
          
          {/* Enhanced glow overlay during celebration */}
          {phase === 'celebration' && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(198, 255, 74, 0.4) 0%, transparent 70%)',
                transform: 'scale(1.5)',
                transformOrigin: 'center',
              }}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 1, 0.5], scale: [1, 1.5, 2] }}
              transition={{ duration: prefersReducedMotion ? 0 : 1 }}
            />
          )}

          {/* Shockwave ring during celebration */}
          {phase === 'celebration' && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full border border-accent pointer-events-none"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 1.5, ease: 'easeOut' }}
            />
          )}

          {/* Particle burst - positioned absolutely relative to viewport */}
          {showParticles && phase === 'celebration' && !prefersReducedMotion && (
            <div className="fixed inset-0 pointer-events-none z-20">
              <ParticleBurst
                particleCount={25}
                origin={orbPosition}
                color="#C6FF4A"
                duration={1200}
                spread="radial"
              />
            </div>
          )}
        </div>

        {/* Question text */}
        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.p
              key="question"
              className="text-white text-lg font-medium text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              What would you like to call me?
            </motion.p>
          )}
        </AnimatePresence>

        {/* Input field */}
        <AnimatePresence>
          {phase === 'input' && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
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

        {/* Name display */}
        <AnimatePresence mode="wait">
          {(phase === 'recognition' || phase === 'celebration' || phase === 'settling') && (
            <motion.p
              key="name"
              className="text-accent text-3xl font-bold text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {displayName}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
