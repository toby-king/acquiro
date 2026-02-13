import { motion, AnimatePresence } from 'framer-motion';
import { useParticles } from '../contexts/ParticleContext';

export function ParticleLayer() {
  const { particles } = useParticles();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => {
          const dx = particle.endX - particle.startX;
          const dy = particle.endY - particle.startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const midX = particle.startX + dx * 0.3;
          const midY = particle.startY + dy * 0.3 - distance * 0.15;

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.startX,
                y: particle.startY,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: [particle.startX, midX, particle.endX],
                y: [particle.startY, midY, particle.endY],
                opacity: [1, 0.8, 0],
                scale: [1, 1.2, 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              style={{
                position: 'fixed',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent-color)',
                boxShadow: '0 0 12px var(--accent-color)',
                filter: 'blur(1px)',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
