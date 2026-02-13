import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AdvisorOrbProps {
  intensity?: number; // 0-100
  isActivated?: boolean;
  className?: string;
  size?: number; // Size in pixels, defaults to 200
  allowProfanity?: boolean;
  glowMultiplier?: number; // Multiplier for glow intensity
  particleSpeed?: number; // Multiplier for particle speed (1 = normal, 2-3 = faster)
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function AdvisorOrb({ intensity = 0, isActivated = false, className = '', size = 200, allowProfanity = false, glowMultiplier = 1, particleSpeed = 1 }: AdvisorOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [isRippling, setIsRippling] = useState(false);
  
  const ORB_SIZE = size;
  const CENTER_X = ORB_SIZE / 2;
  const CENTER_Y = ORB_SIZE / 2;
  const RADIUS = (ORB_SIZE * 0.4); // Scale radius with size
  const PARTICLE_COUNT = Math.max(8, Math.floor(size / 25)); // Scale particle count
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = ORB_SIZE;
    canvas.height = ORB_SIZE;
    
    // Initialize particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
      const distance = Math.random() * RADIUS * 0.6;
      return {
        id: i,
        x: CENTER_X + Math.cos(angle) * distance,
        y: CENTER_Y + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 2 + Math.random() * 2,
      };
    });
    
    const animate = () => {
      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);
      
      // Draw orb background gradient
      const gradient = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, RADIUS);
      gradient.addColorStop(0, 'rgba(198, 255, 74, 0.15)');
      gradient.addColorStop(0.5, 'rgba(198, 255, 74, 0.08)');
      gradient.addColorStop(1, 'rgba(198, 255, 74, 0.02)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position with speed multiplier
        particle.x += particle.vx * particleSpeed;
        particle.y += particle.vy * particleSpeed;
        
        // Boundary check - keep particles within orb
        const dx = particle.x - CENTER_X;
        const dy = particle.y - CENTER_Y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > RADIUS - 5) {
          // Bounce back
          const angle = Math.atan2(dy, dx);
          particle.x = CENTER_X + Math.cos(angle) * (RADIUS - 5);
          particle.y = CENTER_Y + Math.sin(angle) * (RADIUS - 5);
          // Reverse velocity component
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          const dot = particle.vx * normalX + particle.vy * normalY;
          particle.vx -= 2 * dot * normalX;
          particle.vy -= 2 * dot * normalY;
        }
        
        // Add some drift toward center when activated (with speed multiplier)
        if (isActivated) {
          const centerDx = CENTER_X - particle.x;
          const centerDy = CENTER_Y - particle.y;
          const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
          if (centerDistance > 0) {
            particle.vx += (centerDx / centerDistance) * 0.01 * particleSpeed;
            particle.vy += (centerDy / centerDistance) * 0.01 * particleSpeed;
          }
        }
        
        // Draw particle
        ctx.fillStyle = '#C6FF4A';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        glowGradient.addColorStop(0, 'rgba(198, 255, 74, 0.6)');
        glowGradient.addColorStop(1, 'rgba(198, 255, 74, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActivated, particleSpeed]);
  
  const glowIntensity = (isActivated ? 1 : 0.5 + (intensity / 100) * 0.5) * glowMultiplier;
  const glowSize = (allowProfanity ? 60 : 20) * glowMultiplier;
  
  return (
    <div className={`relative ${className}`} data-orb>
      <motion.div
        className="relative mx-auto"
        style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
        animate={{
          scale: isActivated ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: allowProfanity ? '#ef4444' : '#C6FF4A',
          }}
          animate={{
            opacity: allowProfanity ? [0.8, 1, 0.8] : [0.7, 1, 0.7],
          }}
          transition={{
            duration: allowProfanity ? 1.5 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Base glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 ${glowSize * glowIntensity}px rgba(198, 255, 74, ${0.6 * glowIntensity}), inset 0 0 ${30 * glowIntensity}px rgba(198, 255, 74, ${0.2 * glowIntensity})`,
            }}
          />
          {/* Red glow overlay when profanity is allowed */}
          {allowProfanity && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: `0 0 ${glowSize * glowIntensity * 1.2}px rgba(239, 68, 68, ${0.7 * glowIntensity}), 0 0 ${glowSize * glowIntensity * 2}px rgba(239, 68, 68, ${0.4 * glowIntensity}), 0 0 ${glowSize * glowIntensity * 3}px rgba(239, 68, 68, ${0.2 * glowIntensity})`,
              mixBlendMode: 'screen',
              opacity: 0.9,
              filter: 'blur(2px)',
              transform: 'scale(1.1)',
              transformOrigin: 'center',
              pointerEvents: 'none',
              zIndex: -1,
            }}
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1.05, 1.15, 1.05],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
        
        {/* Canvas for particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 rounded-full"
          style={{ mixBlendMode: 'screen' }}
        />
        
        {/* Ripple effect */}
        {isRippling && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-accent"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setIsRippling(false)}
          />
        )}
      </motion.div>
      
      {/* CSS class for external ripple trigger */}
      <style>{`
        .orb-ripple {
          animation: ripple 0.6s ease-out;
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
