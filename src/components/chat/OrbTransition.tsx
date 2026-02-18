import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';

interface OrbTransitionProps {
  onComplete: () => void;
  headerOrbRef: React.RefObject<HTMLDivElement>;
  duration?: number;
}

/**
 * Transition component that animates the orb from header position to center
 * Used when transitioning from ChatContainer to CallScreen
 */
export function OrbTransition({ 
  onComplete, 
  headerOrbRef,
  duration = 1.2 
}: OrbTransitionProps) {
  const { config } = useAdvisorStore();
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const headerSize = 48;
  const centerSize = 400;
  const scaleRatio = headerSize / centerSize;

  useEffect(() => {
    // Small delay to ensure header orb is rendered
    const timer = setTimeout(() => {
      if (!headerOrbRef.current) {
        // Fallback: use estimated header position
        const estimatedX = 24 + 24; // left padding + half orb size
        const estimatedY = 16 + 24; // top padding + half orb size
        setStartPos({ x: estimatedX, y: estimatedY });
      } else {
        // Get header orb position
        const headerRect = headerOrbRef.current.getBoundingClientRect();
        
        // Calculate start position (header orb center relative to viewport)
        const startX = headerRect.left + headerRect.width / 2;
        const startY = headerRect.top + headerRect.height / 2;
        
        setStartPos({ x: startX, y: startY });
      }
    }, 50);

    // Call onComplete when animation finishes
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration * 1000 + 50); // Add small buffer

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [headerOrbRef, duration, onComplete]);

  if (!startPos) {
    return null;
  }

  // Calculate end position to match CallScreen layout
  // CallScreen has: header (~64px) + flex-1 container with py-12 (48px top padding)
  // Orb is centered in the flex-1 area, which accounts for header height
  const endX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  // Adjust Y to account for header height - make it slightly higher
  // Header is approximately 64px, so we offset from true center
  const headerHeight = 64; // Approximate header height
  const endY = typeof window !== 'undefined' 
    ? (window.innerHeight - headerHeight) / 2 + headerHeight - 20 // Offset upward by 20px
    : 0;

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[100]"
      style={{ background: 'var(--bg-primary)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        // Fade out after orb reaches center
        setTimeout(() => {
          // This will be handled by onComplete callback
        }, duration * 1000);
      }}
    >
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          left: startPos.x,
          top: startPos.y,
          x: '-50%',
          y: '-50%',
        }}
        initial={{
          scale: scaleRatio,
        }}
        animate={{
          left: endX,
          top: endY,
          scale: 1,
        }}
        transition={{
          duration,
          ease: [0.4, 0, 0.2, 1], // Custom easing for smooth transition
        }}
      >
        <AdvisorOrb
          intensity={100}
          isActivated
          size={centerSize}
          allowProfanity={config.allowProfanity}
        />
      </motion.div>
    </motion.div>
  );
}
