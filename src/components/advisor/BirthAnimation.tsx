import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvisorOrb } from './AdvisorOrb';

interface BirthAnimationProps {
  onComplete: () => void;
  onAwakeningComplete?: () => void;
}

export function BirthAnimation({ onComplete, onAwakeningComplete }: BirthAnimationProps) {
  const [phase, setPhase] = useState<'anticipation' | 'awakening' | 'stabilization' | 'transition'>('anticipation');
  
  useEffect(() => {
    // Phase 1: Anticipation (0-500ms)
    const timer1 = setTimeout(() => {
      setPhase('awakening');
    }, 500);
    
    // Phase 2: Awakening (500-1500ms) - trigger naming ceremony when this completes
    const timer2 = setTimeout(() => {
      setPhase('stabilization');
      if (onAwakeningComplete) {
        onAwakeningComplete();
      }
    }, 1500);
    
    // Phase 3: Stabilization (1500-2500ms)
    const timer3 = setTimeout(() => {
      setPhase('transition');
    }, 2500);
    
    // Phase 4: Transition (2500-3500ms)
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete, onAwakeningComplete]);
  
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex items-center justify-center">
      {/* Vignette overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'anticipation' ? 0.3 : phase === 'awakening' ? 0.5 : 0.2 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Orb container */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: phase === 'transition' ? 0.4 : 1,
          y: phase === 'transition' ? -300 : 0,
        }}
        transition={{
          duration: phase === 'transition' ? 1 : 0.5,
          ease: 'easeInOut',
        }}
      >
        {/* Awakening light burst */}
        {phase === 'awakening' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(circle, rgba(198, 255, 74, 0.8) 0%, transparent 70%)',
            }}
          />
        )}
        
        {/* Energy rays */}
        {phase === 'awakening' && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                initial={{ rotate: i * 45, opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  times: [0, 0.5, 1],
                }}
              >
                <div
                  className="absolute top-0 left-1/2 w-1 h-32 bg-accent"
                  style={{
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 20px rgba(198, 255, 74, 0.8)',
                  }}
                />
              </motion.div>
            ))}
          </>
        )}
        
        {/* Shockwave */}
        {phase === 'awakening' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-accent"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 5, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        )}
        
        <AdvisorOrb intensity={100} isActivated={phase !== 'anticipation'} />
      </motion.div>
      
      {/* Particle scatter effect */}
      {phase === 'awakening' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-accent rounded-full"
              initial={{
                x: '50vw',
                y: '50vh',
                opacity: 1,
              }}
              animate={{
                x: `calc(50vw + ${(Math.random() - 0.5) * 800}px)`,
                y: `calc(50vh + ${(Math.random() - 0.5) * 800}px)`,
                opacity: 0,
              }}
              transition={{
                duration: 1,
                delay: Math.random() * 0.3,
                ease: 'easeOut',
              }}
              style={{
                boxShadow: '0 0 10px rgba(198, 255, 74, 0.8)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
