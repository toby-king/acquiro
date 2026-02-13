import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from './components/Header';
import { FluidOrbAvatar } from './components/FluidOrbAvatar';
import { ParticleLayer } from './components/ParticleLayer';
import { Step1AdvisorType } from './components/steps/Step1AdvisorType';
import { Step2PersonalityPresets } from './components/steps/Step2PersonalityPresets';
import { Step3TraitsCloud } from './components/steps/Step3TraitsCloud';
import { Step4NegotiationStyle } from './components/steps/Step4NegotiationStyle';
import { Step5VoiceSelection } from './components/steps/Step5VoiceSelection';
import { CompletionCTA } from './components/CompletionCTA';
import { BirthAnimation } from './components/BirthAnimation';
import { ConversationView } from './components/ConversationView';
import { useAdvisor } from './contexts/AdvisorContext';

const steps = [
  { component: Step1AdvisorType, id: 1 },
  { component: Step2PersonalityPresets, id: 2 },
  { component: Step3TraitsCloud, id: 3 },
  { component: Step4NegotiationStyle, id: 4 },
  { component: Step5VoiceSelection, id: 5 },
];

type AppMode = 'configuration' | 'birth' | 'conversation';

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<AppMode>('configuration');
  const { isStepComplete, getCompletionPercentage } = useAdvisor();
  const isComplete = getCompletionPercentage() === 100;

  const StepComponent = steps[currentStep].component;
  const canGoNext = currentStep < steps.length - 1 && isStepComplete(currentStep + 1);
  const canGoPrev = currentStep > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleActivate = () => {
    setMode('birth');
  };

  const handleBirthComplete = () => {
    setMode('conversation');
  };

  if (mode === 'conversation') {
    return <ConversationView />;
  }

  if (mode === 'birth') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <div className="noise-overlay" />
        <BirthAnimation onComplete={handleBirthComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div className="noise-overlay" />
      <ParticleLayer />
      <motion.div
        initial={false}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
      >
        <Header currentStep={currentStep} />
      </motion.div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/3 flex items-center justify-center">
            <FluidOrbAvatar />
          </div>

          <motion.div
            className="w-full lg:w-2/3"
            initial={false}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <StepComponent />
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="flex items-center justify-between mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {canGoPrev ? (
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 rounded-full font-medium glass-card"
                    style={{
                      color: 'var(--text-primary)',
                    }}
                    onClick={handlePrev}
                    whileHover={{ scale: 1.05, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </motion.button>
                ) : (
                  <div />
                )}
              </AnimatePresence>

              <motion.button
                className="flex items-center gap-2 px-8 py-3 rounded-full font-medium"
                style={{
                  background: canGoNext ? 'var(--accent-color)' : 'var(--border-color)',
                  color: canGoNext ? '#0a0a0a' : 'var(--text-secondary)',
                  cursor: canGoNext ? 'pointer' : 'not-allowed',
                }}
                onClick={handleNext}
                disabled={!canGoNext}
                whileHover={canGoNext ? { scale: 1.05, x: 2 } : {}}
                whileTap={canGoNext ? { scale: 0.95 } : {}}
              >
                <span>Next</span>
                <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {isComplete && (
          <motion.div
            className="w-full max-w-7xl mx-auto mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <CompletionCTA onActivate={handleActivate} />
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
