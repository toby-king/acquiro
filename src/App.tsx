import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdvisorStore } from './hooks/useAdvisorStore';
import { getAgent } from './services/getAgentService';
import { Header } from './components/layout/Header';
import { AdvisorPanel } from './components/advisor/AdvisorPanel';
import { StepNavigation } from './components/layout/StepNavigation';
import { BirthAnimation } from './components/advisor/BirthAnimation';
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
import { getOrbPalette } from './utils/orbPalette';

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
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        <div className="grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-8 min-w-0">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const leadParam = searchParams.get('lead');
  const { isActivated, activateAdvisor, isComplete, config, hydrateFromLead } = useAdvisorStore();
  const [showBirthAnimation, setShowBirthAnimation] = useState(false);
  const [leadReconnectionLoading, setLeadReconnectionLoading] = useState(!!leadParam);
  const [leadReconnectionError, setLeadReconnectionError] = useState<string | null>(null);

  // Handle /builder?lead=LEAD_ID - fetch agent and show chat with reconnection flow
  useEffect(() => {
    if (!leadParam) {
      setLeadReconnectionLoading(false);
      return;
    }
    getAgent(leadParam)
      .then((result) => {
        if (result) {
          hydrateFromLead(leadParam, result.config, result.userName, result.userEmail);
          setSearchParams({}, { replace: true });
        } else {
          setLeadReconnectionError('Could not load your advisor. Please try again.');
        }
      })
      .catch(() => setLeadReconnectionError('Could not load your advisor. Please try again.'))
      .finally(() => setLeadReconnectionLoading(false));
  }, [leadParam, hydrateFromLead, setSearchParams]);

  useEffect(() => {
    // Handle activation when configuration is complete (skip if we're loading lead reconnection)
    if (leadReconnectionLoading) return;
    if (isComplete && !isActivated && !showBirthAnimation) {
      setShowBirthAnimation(true);
    }
  }, [isComplete, isActivated, showBirthAnimation, leadReconnectionLoading]);
  
  const handleBirthComplete = () => {
    // This is called after birth animation fully completes (if naming ceremony is skipped)
    setShowBirthAnimation(false);
    activateAdvisor();
  };

  // Get consistent palette based on config
  const birthPalette = getOrbPalette(config.allowProfanity || false);
  
  if (showBirthAnimation) {
    return <BirthAnimation onComplete={handleBirthComplete} palette={birthPalette} allowProfanity={config.allowProfanity || false} />;
  }
  
  if (leadReconnectionLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading your advisor...</p>
      </div>
    );
  }

  if (leadReconnectionError) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-primary)] mb-4">{leadReconnectionError}</p>
          <a href="/builder" className="text-accent hover:underline">Start over</a>
        </div>
      </div>
    );
  }

  if (isActivated) {
    return <ChatContainer />;
  }
  
  return (
    <>
      <AbsorptionCanvas />
      {showBirthAnimation ? (
        <BirthAnimation onComplete={handleBirthComplete} palette={birthPalette} allowProfanity={config.allowProfanity || false} />
      ) : isActivated ? (
        <ChatContainer />
      ) : (
        <WizardView />
      )}
    </>
  );
}

export default App;
