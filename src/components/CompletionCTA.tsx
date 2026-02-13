import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';
import { useAdvisor } from '../contexts/AdvisorContext';

const advisorTypeNames = {
  mentor: 'Mentor',
  workhorse: 'Workhorse',
  hybrid: 'Hybrid',
};

const personalityNames = {
  buffett: 'Warren Buffett',
  jobs: 'Steve Jobs',
  oprah: 'Oprah Winfrey',
  musk: 'Elon Musk',
  custom: 'Custom',
};

const voiceNames: Record<string, string> = {
  'british-professional': 'British Professional',
  'american-confident': 'American Confident',
  'australian-warm': 'Australian Warm',
  'irish-friendly': 'Irish Friendly',
  'canadian-balanced': 'Canadian Balanced',
  'american-executive': 'American Executive',
};

interface CompletionCTAProps {
  onActivate: () => void;
}

export function CompletionCTA({ onActivate }: CompletionCTAProps) {
  const { state, getCompletionPercentage } = useAdvisor();
  const isComplete = getCompletionPercentage() === 100;

  if (!isComplete) return null;

  return (
    <motion.div
      className="mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="glass-card rounded-2xl p-8"
        style={{
          border: '1px solid var(--accent-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <motion.div
          className="text-center mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl accent-bg mb-4"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Check size={32} style={{ color: '#0a0a0a' }} strokeWidth={3} />
          </motion.div>

          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Configuration Complete
          </h2>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Your AI advisor is ready to be deployed
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full accent-bg" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Type
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {state.advisorType && advisorTypeNames[state.advisorType]}
              </p>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full accent-bg" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Personality
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {state.personalityPreset && personalityNames[state.personalityPreset]}
              </p>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full accent-bg" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Traits
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {state.likedTraits.length + state.dislikedTraits.length} set
              </p>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full accent-bg" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Voice
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {state.voice && voiceNames[state.voice].split(' ')[0]}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="px-8 py-4 rounded-full text-lg font-semibold accent-bg"
            style={{ color: '#0a0a0a' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onActivate}
          >
            Activate Your Advisor
          </motion.button>

          <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Your configuration will be saved and ready to use
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
