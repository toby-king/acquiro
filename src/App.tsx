import { useEffect, useState } from 'react';
import { useAdvisorStore } from './hooks/useAdvisorStore';
import { Header } from './components/layout/Header';
import { AdvisorPanel } from './components/advisor/AdvisorPanel';
import { StepNavigation } from './components/layout/StepNavigation';
import { BirthAnimation } from './components/advisor/BirthAnimation';
import { NamingCeremony } from './components/advisor/NamingCeremony';
import { ChatContainer } from './components/chat/ChatContainer';
import { TypeStep } from './components/steps/TypeStep';
import { PersonalityStep } from './components/steps/PersonalityStep';
import { TraitsStep } from './components/steps/TraitsStep';
import { StyleStep } from './components/steps/StyleStep';
import { VoiceStep } from './components/steps/VoiceStep';
import { InterstitialContent } from './components/onboarding/InterstitialContent';
import { useStepNavigation } from './hooks/useStepNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from './utils/animations';
import { AbsorptionCanvas } from './components/advisor/AbsorptionCanvas';

function StepContent() {
  const { currentStep, showInterstitial } = useStepNavigation();
  const { currentInterstitial } = useAdvisorStore();
  
  const stepComponents = {
    type: TypeStep,
    personality: PersonalityStep,
    traits: TraitsStep,
    style: StyleStep,
    voice: VoiceStep,
  };
  
  const StepComponent = stepComponents[currentStep];
  
  return (
    <AnimatePresence mode="wait">
      {showInterstitial && currentInterstitial ? (
        <motion.div
          key={`interstitial-${currentInterstitial}`}
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <InterstitialContent id={currentInterstitial} />
        </motion.div>
      ) : (
        <motion.div
          key={currentStep}
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <StepComponent />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WizardView() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-8">
          {/* Left Panel */}
          <div className="lg:sticky lg:top-24 h-fit order-2 lg:order-1">
            <AdvisorPanel />
          </div>
          
          {/* Right Panel - Step Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <StepContent />
            <StepNavigation />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const { isActivated, activateAdvisor, isComplete } = useAdvisorStore();
  const [showBirthAnimation, setShowBirthAnimation] = useState(false);
  
  useEffect(() => {
    // Handle activation when configuration is complete
    if (isComplete && !isActivated && !showBirthAnimation) {
      setShowBirthAnimation(true);
    }
  }, [isComplete, isActivated, showBirthAnimation]);
  
  const handleBirthComplete = () => {
    // This is called after birth animation fully completes (if naming ceremony is skipped)
    setShowBirthAnimation(false);
    activateAdvisor();
  };

  
  if (showBirthAnimation) {
    return <BirthAnimation onComplete={handleBirthComplete} />;
  }
  
  if (isActivated) {
    return <ChatContainer />;
  }
  
  return (
    <>
      <AbsorptionCanvas />
      {showBirthAnimation ? (
        <BirthAnimation onComplete={handleBirthComplete} />
      ) : isActivated ? (
        <ChatContainer />
      ) : (
        <WizardView />
      )}
    </>
  );
}

export default App;
