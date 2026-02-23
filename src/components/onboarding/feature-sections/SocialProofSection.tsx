import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Factory, Package, Truck, Check } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useAdvisorStore } from '../../../hooks/useAdvisorStore';

const DEAL_CARDS = [
  {
    id: 1,
    label: 'Manufacturing',
    date: 'Closed Jun 2025',
    icon: Factory,
    rotation: -2.5,
    zIndex: 1,
  },
  {
    id: 2,
    label: 'Ecommerce',
    date: 'Closed Nov 2025',
    icon: Package,
    rotation: 0,
    zIndex: 2,
  },
  {
    id: 3,
    label: 'Import',
    date: 'Closed Feb 2026',
    icon: Truck,
    rotation: 2.5,
    zIndex: 3,
  },
];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const setInterstitialReady = useAdvisorStore((s) => s.setInterstitialReady);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    setInterstitialReady(true);
  }, [setInterstitialReady]);
  const [showBlogPost, setShowBlogPost] = useState(false);

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
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4 w-full min-w-0 overflow-x-hidden">
      <Card className="w-full max-w-[700px] border-none overflow-visible py-10 min-w-0" style={{ background: 'transparent', border: 'none', overflow: 'visible' }}>
        <div className="space-y-8 overflow-visible min-w-0">
          {/* Headline */}
          <h2 className="text-2xl md:text-3xl font-display font-medium text-[var(--text-primary)] text-center">
            3 acquisitions. 11 months. 1 advisor.
          </h2>
          
          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] text-center leading-relaxed">
            One buyer used their Acquiro advisor to source, evaluate, and close three businesses - all within a year.{' '}
            <button
              onClick={() => setShowBlogPost(true)}
              className="text-[var(--text-secondary)] hover:text-accent transition-colors underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 font-inherit"
              style={{ textDecorationColor: 'var(--accent)' }}
            >
              Read more
            </button>
            {' '}about their story.
          </p>

          {/* Deal Cards Container / Blog Post */}
          <div className="flex items-center justify-center mt-12 mb-8 relative overflow-visible" style={{ minHeight: '280px', overflow: 'visible', paddingBottom: '60px' }}>
            <AnimatePresence mode="wait">
              {!showBlogPost ? (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {/* Counter */}
                  <motion.div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-[var(--text-secondary)]"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {visibleCards.size} {visibleCards.size === 1 ? 'deal' : 'deals'} closed
                  </motion.div>

                  {/* Deal Cards - vertical stack on mobile (with overlap), horizontal fanned on desktop */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-0 relative w-full max-w-full">
                    {DEAL_CARDS.map((card, index) => {
                      const Icon = card.icon;
                      const isCardVisible = visibleCards.has(card.id);
                      const showCheckmark = isCardVisible;
                      // On mobile: bottom cards on top when overlapping
                      const zIndexClass = index === 0 ? 'z-[1] md:z-[1]' : index === 1 ? 'z-[2] md:z-[2]' : 'z-[3] md:z-[3]';

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
                          className={`relative w-full max-w-[200px] md:max-w-none md:w-[180px] md:flex-shrink-0 ${zIndexClass} ${index > 0 ? '-mt-14 md:mt-0 md:-ml-5' : ''}`}
                        >
                          <div
                            className="w-full md:w-[180px] h-[200px] md:h-[240px] rounded-xl p-6 flex flex-col items-center justify-between relative flex-shrink-0"
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
                </motion.div>
              ) : (
                <motion.div
                  key="blog-post"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <div
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 max-h-[500px] overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'var(--accent) transparent',
                    }}
                  >
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                        How VENTURE ltd. Closed Three Deals in 11 Months
                      </h3>
                      <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
                        <p>
                          When VENTURE ltd. first approached Acquiro, they had a clear vision: acquire three businesses across different industries within a year. What seemed ambitious became reality with the help of their dedicated Acquiro advisor.
                        </p>
                        <p>
                          <strong className="text-[var(--text-primary)]">The First Deal: Manufacturing (June 2025)</strong>
                        </p>
                        <p>
                          The journey began with a manufacturing company that perfectly matched their criteria. Their advisor identified the opportunity within days of setting up their search parameters. The deal closed smoothly in June 2025, setting a strong precedent for what was to come.
                        </p>
                        <p>
                          <strong className="text-[var(--text-primary)]">The Second Deal: Ecommerce (November 2025)</strong>
                        </p>
                        <p>
                          Just five months later, their advisor surfaced an ecommerce business that aligned with VENTURE ltd.'s growth strategy. The evaluation process was streamlined thanks to the advisor's expertise in due diligence, and the deal closed in November 2025.
                        </p>
                        <p>
                          <strong className="text-[var(--text-primary)]">The Third Deal: Import (February 2026)</strong>
                        </p>
                        <p>
                          The final acquisition—an import business—was completed in February 2026, bringing their total to three successful deals in just 11 months. Throughout the process, their Acquiro advisor provided continuous support, from initial sourcing to final negotiations.
                        </p>
                        <p>
                          <strong className="text-[var(--text-primary)]">The Result</strong>
                        </p>
                        <p>
                          VENTURE ltd. credits their success to the personalized approach of their Acquiro advisor, who understood their specific needs and worked tirelessly to find the right opportunities. The advisor's ability to navigate complex deal structures and provide expert guidance at every step made all the difference.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] italic mt-6">
                          *verified acquisitions made by VENTURE ltd.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </div>
  );
}
