import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, CheckCircle } from 'lucide-react';
import { Card } from '../../ui/Card';

const DEAL_CARDS = [
  { id: 1, rotation: -5, translateX: -10 },
  { id: 2, rotation: 0, translateX: 0 },
  { id: 3, rotation: 5, translateX: 10 },
];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
      <Card className="max-w-[600px] w-full">
        <div className="space-y-8">
          {/* Headline */}
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center">
            Some buyers don't stop at one.
          </h2>
          
          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] text-center leading-relaxed">
            Acquiro users come back — because the process works.
          </p>

          {/* Stacked Cards Visual */}
          <div className="flex items-center justify-center mt-8 relative" style={{ height: '220px', width: '100%' }}>
            {DEAL_CARDS.map((card, index) => {
              const baseX = card.translateX * 4; // Horizontal offset for fan effect
              const baseY = index * 12; // Vertical offset for stacking
              
              return (
                <motion.div
                  key={card.id}
                  initial={{ 
                    opacity: 0,
                    scale: 0.8,
                    rotate: card.rotation,
                    x: baseX,
                    y: baseY,
                  }}
                  animate={isInView ? {
                    opacity: 1,
                    scale: 1,
                    rotate: card.rotation,
                    x: baseX,
                    y: baseY,
                  } : {
                    opacity: 0,
                    scale: 0.8,
                  }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: 'easeOut'
                  }}
                  whileHover={{
                    scale: 1.05,
                    rotate: card.rotation * 1.2,
                    x: baseX * 1.5,
                    y: baseY - 10,
                    zIndex: 10,
                  }}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    className="w-32 h-40 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-between relative shadow-lg"
                    style={{
                      transform: `rotateY(${card.rotation * 0.5}deg)`,
                    }}
                  >
                    {/* Building Icon */}
                    <Building2 className="w-8 h-8 text-[var(--text-secondary)] mb-2" />
                    
                    {/* Checkmark in corner */}
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-accent fill-accent" />
                    </div>
                    
                    {/* Subtle pattern lines */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="w-full h-px bg-accent absolute top-1/3" />
                      <div className="w-full h-px bg-accent absolute top-2/3" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
