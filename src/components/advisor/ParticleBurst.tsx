import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ParticleBurstProps {
  particleCount?: number;
  origin: { x: number; y: number };
  color?: string;
  duration?: number;
  spread?: 'radial' | 'upward' | 'spiral';
  onComplete?: () => void;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  duration: number;
  size: number;
  delay: number;
}

export function ParticleBurst({
  particleCount = 25,
  origin,
  color = '#C6FF4A',
  duration = 1000,
  spread = 'radial',
  onComplete,
}: ParticleBurstProps) {
  const [particles] = useState<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      let angle: number;
      const baseDelay = (i / particleCount) * 0.1;
      
      switch (spread) {
        case 'upward':
          angle = (Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 0.6; // Mostly upward
          break;
        case 'spiral':
          angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
          break;
        case 'radial':
        default:
          angle = Math.random() * Math.PI * 2;
          break;
      }
      
      return {
        id: i,
        angle,
        distance: 100 + Math.random() * 200, // 100-300px
        duration: 600 + Math.random() * 600, // 600-1200ms
        size: 4 + Math.random() * 4, // 4-8px
        delay: baseDelay + Math.random() * 0.1,
      };
    });
  });

  useEffect(() => {
    if (onComplete) {
      const maxDuration = Math.max(...particles.map(p => p.duration + p.delay * 1000));
      const timer = setTimeout(onComplete, maxDuration);
      return () => clearTimeout(timer);
    }
  }, [onComplete, particles]);

  return (
    <>
      {particles.map((particle) => {
        const endX = Math.cos(particle.angle) * particle.distance;
        const endY = Math.sin(particle.angle) * particle.distance;
        
        return (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: origin.x,
              top: origin.y,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: color,
              boxShadow: `0 0 ${particle.size * 2}px ${color}`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: endX,
              y: endY,
              opacity: [1, 0.8, 0],
              scale: [1, 1.2, 0.5],
            }}
            transition={{
              duration: particle.duration / 1000,
              delay: particle.delay,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        );
      })}
    </>
  );
}
