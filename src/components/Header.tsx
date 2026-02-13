import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAdvisor } from '../contexts/AdvisorContext';

interface HeaderProps {
  currentStep?: number;
}

const stepLabels = ['Type', 'Personality', 'Traits', 'Style', 'Voice'];

export function Header({ currentStep = 0 }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isStepComplete } = useAdvisor();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: '#0a0a0a' }}>A</span>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Acquiro Advisor Builder
          </h1>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1;
              const isComplete = isStepComplete(stepNumber);
              const isCurrent = index === currentStep;
              const isPast = index < currentStep;

              return (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative group">
                      <motion.div
                        className="w-24 h-2 rounded-full overflow-hidden"
                        style={{
                          background: 'var(--border-color)',
                        }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: 'var(--accent-color)',
                          }}
                          initial={{ width: '0%' }}
                          animate={{
                            width: isComplete ? '100%' : (isCurrent ? '50%' : '0%'),
                          }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs px-2 py-1 rounded"
                        style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {label}
                      </motion.div>
                    </div>
                    <span
                      className="text-xs font-medium mt-1"
                      style={{
                        color: isCurrent ? 'var(--accent-color)' : (isComplete || isPast ? 'var(--text-secondary)' : 'var(--text-tertiary)'),
                        transition: 'color 0.3s',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {index < stepLabels.length - 1 && (
                    <div
                      className="w-2 h-0.5 mb-5"
                      style={{
                        background: 'var(--border-color)',
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <motion.button
            onClick={toggleTheme}
            className="relative w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              initial={false}
              animate={{
                rotate: theme === 'dark' ? 0 : 180,
                scale: theme === 'dark' ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
              }}
            >
              {theme === 'dark' && <Moon size={18} style={{ color: 'var(--text-primary)' }} />}
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                rotate: theme === 'light' ? 0 : 180,
                scale: theme === 'light' ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
              }}
            >
              {theme === 'light' && <Sun size={18} style={{ color: 'var(--text-primary)' }} />}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
