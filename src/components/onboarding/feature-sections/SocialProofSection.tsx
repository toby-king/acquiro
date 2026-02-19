import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Factory, Building2, Truck, Check } from 'lucide-react';
import { Card } from '../../ui/Card';

const DEAL_CARDS = [
  {
    id: 1,
    label: 'SaaS Platform',
    date: 'Closed Jun 2025',
    icon: Building2,
    rotation: -2.5,
    zIndex: 1,
  },
  {
    id: 2,
    label: 'Manufacturing Company',
    date: 'Closed Nov 2025',
    icon: Factory,
    rotation: 0,
    zIndex: 2,
  },
  {
    id: 3,
    label: 'Logistics Firm',
    date: 'Closed Feb 2026',
    icon: Truck,
    rotation: 2.5,
    zIndex: 3,
  },
];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  // Track which cards are visible for counter animation - trigger earlier
  useEffect(() => {
    if (!isInView) return;

    // Set up timers to mark cards as visible earlier in their animation
    const timers = DEAL_CARDS.map((card, index) => {
      const delay = index * 0.4; // Same delay as card animation
      const earlyTrigger = delay + 0.2; // Trigger 0.2s into the animation (before completion)
      
      return setTimeout(() => {
        setVisibleCards((prev) => new Set([...prev, card.id]));
      }, earlyTrigger * 1000);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isInView]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[400px] py-15 px-4" style={{ overflow: 'visible' }}>
      <Card className="max-w-[700px] w-full border-none overflow-visible py-10" style={{ background: 'transparent', border: 'none', overflow: 'visible' }}>
        <div className="space-y-8 overflow-visible">
          {/* Headline */}
          <h2 className="text-3xl font-medium text-[var(--text-primary)] text-center">
            3 acquisitions. 11 months. 1 advisor.
          </h2>
          
          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] text-center leading-relaxed">
            One buyer used their Acquiro advisor to source, evaluate, and close three businesses — all within a year.
          </p>

          {/* Deal Cards Container */}
          <div className="flex items-center justify-center mt-12 mb-8 relative overflow-visible" style={{ minHeight: '280px', overflow: 'visible', paddingBottom: '60px' }}>
            {/* Counter */}
            <motion.div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-[var(--text-secondary)]"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              {visibleCards.size} {visibleCards.size === 1 ? 'deal' : 'deals'} closed
            </motion.div>

            {/* Deal Cards */}
            <div className="flex items-center justify-center gap-4 relative">
              {DEAL_CARDS.map((card, index) => {
                const Icon = card.icon;
                const isCardVisible = visibleCards.has(card.id);
                const showCheckmark = isCardVisible;

                return (
                  <motion.div
                    key={card.id}
                    initial={{
                      opacity: 0,
                      y: 60,
                      rotate: card.rotation + 5,
                      scale: 0.9,
                    }}
                    animate={isInView ? {
                      opacity: 1,
                      y: 0,
                      rotate: card.rotation,
                      scale: 1,
                    } : {
                      opacity: 0,
                      y: 60,
                      rotate: card.rotation + 5,
                      scale: 0.9,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative"
                    style={{
                      zIndex: card.zIndex,
                      marginLeft: index > 0 ? '-20px' : '0', // Overlapping effect
                    }}
                  >
                    <div
                      className="w-[180px] h-[240px] rounded-xl p-6 flex flex-col items-center justify-between relative"
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        transform: 'translateZ(0)', // Force hardware acceleration to prevent blur
                        backfaceVisibility: 'hidden', // Prevent blur on rotation
                        WebkitFontSmoothing: 'antialiased', // Better text rendering
                      }}
                    >
                      {/* Industry Icon */}
                      <div className="mt-2">
                        <Icon className="w-16 h-16 text-accent" />
                      </div>

                      {/* Deal Label */}
                      <div 
                        className="text-center"
                        style={{
                          transform: 'translateZ(0)', // Prevent text blur
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <div className="text-base font-medium text-[var(--text-primary)] mb-2">
                          {card.label}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {card.date}
                        </div>
                      </div>

                      {/* Checkmark */}
                      <motion.div
                        className="absolute bottom-4 right-4"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={showCheckmark ? {
                          scale: 1,
                          opacity: 1,
                        } : {
                          scale: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.4,
                          delay: 0.2,
                          ease: [0.34, 1.56, 0.64, 1], // Bounce effect
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Verified Label */}
            <motion.div
              className="absolute left-1/2 transform -translate-x-1/2 text-xs text-[var(--text-secondary)] whitespace-nowrap"
              style={{
                bottom: '-40px',
                overflow: 'visible',
              }}
              initial={{ opacity: 0 }}
              animate={visibleCards.size === 3 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              *verified acquisitions made by VENTURE ltd.
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  );
}
