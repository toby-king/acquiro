import { useRef, useEffect, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Card } from '../../ui/Card';

type ChatState = 'user' | 'typing' | 'agent' | 'pause';

export function CustomisationSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [chatState, setChatState] = useState<ChatState>('user');

  // Animation sequence: user -> pause -> typing -> agent -> stop
  useEffect(() => {
    if (!isInView) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Start with user message
    setChatState('user');

    // After 0.5s, show typing indicator
    const typingTimer = setTimeout(() => {
      setChatState('typing');
    }, 500);
    timers.push(typingTimer);

    // After 1.2s total (~0.7s typing), show agent message
    const agentTimer = setTimeout(() => {
      setChatState('agent');
    }, 1200);
    timers.push(agentTimer);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isInView]);

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 rounded-full bg-accent"
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4 w-full min-w-0">
      <Card className="max-w-[600px] w-full border-none min-w-0" style={{ background: 'transparent', border: 'none' }}>
        <div className="space-y-8 min-w-0">
          {/* Headline */}
          <h2 className="text-2xl md:text-3xl font-display font-medium text-[var(--text-primary)] text-center">
            Your advisor, your rules.
          </h2>
          
          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] text-center leading-relaxed">
            Your expert advisor adapts to how you think — so every conversation moves you closer to the right deal, not just any deal.
          </p>

          {/* Animated Chat Mockup */}
          <motion.div
            className="flex flex-col items-center mt-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full max-w-[500px] space-y-4" style={{ minHeight: '280px' }}>
              {/* User Message */}
              <AnimatePresence>
                {(chatState === 'user' || chatState === 'typing' || chatState === 'agent' || chatState === 'pause') && (
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                <div
                  className="px-4 py-3 rounded-2xl max-w-[85%]"
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    borderRadius: '20px 20px 4px 20px', // More rounded on top-right
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  Actually, can you exclude any hospitality businesses unless they're in the South West, have staff-managed operations, and are turning over at least £500k with margins above 15%?
                </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Typing Indicator */}
              {chatState === 'typing' && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="rounded-2xl"
                    style={{
                      background: '#1a1a2e',
                      borderRadius: '20px 20px 20px 4px', // More rounded on top-left
                    }}
                  >
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              {/* Agent Message */}
              <AnimatePresence>
                {(chatState === 'agent' || chatState === 'pause') && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                <div
                  className="px-4 py-3 rounded-2xl max-w-[85%]"
                  style={{
                    background: '#1a1a2e',
                    color: '#fff',
                    borderRadius: '20px 20px 20px 4px', // More rounded on top-left
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  Done. I've updated your filters — you'll only see hospitality listings in the South West matching those specs. Everything else stays the same.
                </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
