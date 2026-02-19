import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate, useMotionValueEvent } from 'framer-motion';
import { Card } from '../../ui/Card';

function CounterDisplay({ value, duration, delay, isInView }: { value: number; duration: number; delay: number; isInView: boolean }) {
  const progress = useMotionValue(0);
  const count = useTransform(progress, [0, 1], [0, value]);
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (isInView) {
      const controls = animate(progress, 1, {
        duration,
        delay,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [isInView, progress, duration, delay]);

  useMotionValueEvent(count, 'change', (latest) => {
    const num = Math.floor(latest);
    setDisplayValue(num.toLocaleString());
  });

  return <span>{displayValue}</span>;
}

export function EfficiencySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
      <Card className="max-w-[600px] w-full border-none" style={{ background: 'transparent', border: 'none' }}>
        <div className="space-y-8">
          {/* Headline */}
          <h2 className="text-3xl font-medium text-[var(--text-primary)] text-center">
            You're building something powerful.
          </h2>
          
          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] text-center leading-relaxed">
            In the time it would take you to browse 20 listings, your agent can scan 25,000 listings, and surface only what matches your exact criteria.
          </p>

          {/* Bar Comparison Visual */}
          <div className="space-y-6 mt-8">
            {/* Top Bar - You manually */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">You, searching manually</span>
                <span className="text-sm text-[var(--text-secondary)]">
                  <CounterDisplay value={20} duration={1.5} delay={0.3} isInView={isInView} /> deals
                </span>
              </div>
              <div className="relative h-12 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: '12%' } : { width: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-[var(--text-secondary)] rounded-full"
                />
              </div>
            </div>

            {/* Bottom Bar - Acquiro */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">Your advisor, searching daily</span>
                <span className="text-sm text-accent">
                  <CounterDisplay value={25000} duration={1.5} delay={0.5} isInView={isInView} /> deals
                </span>
              </div>
              <div className="relative h-12 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: '100%' } : { width: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
