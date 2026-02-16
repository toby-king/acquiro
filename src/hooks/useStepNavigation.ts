import { useAdvisorStore } from './useAdvisorStore';
import { WizardStep } from '../types/advisor';

const STEP_ORDER: WizardStep[] = ['type', 'personality', 'traits', 'style', 'voice'];

export function useStepNavigation() {
  const { currentStep, nextStep, prevStep, goToStep, showInterstitial } = useAdvisorStore();
  
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  // During interstitials, we're between steps, so don't show step indicator
  // The step index is still based on currentStep for internal logic
  const displayStepIndex = currentStepIndex + 1; // 1-indexed for display
  const isFirstStep = currentStepIndex === 0 && !showInterstitial;
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1 && !showInterstitial;
  
  const canProceed = () => {
    // Interstitials always allow proceeding (no selection required)
    if (showInterstitial) {
      return true;
    }
    
    const { config } = useAdvisorStore.getState();
    switch (currentStep) {
      case 'type':
        return !!config.type;
      case 'personality':
        return !!(config.personality || config.customStats);
      case 'traits':
        return true; // Traits are optional
      case 'style':
        return !!config.challengeStyle;
      case 'voice':
        return !!config.voice;
      default:
        return false;
    }
  };
  
  return {
    currentStep,
    currentStepIndex: displayStepIndex,
    totalSteps: STEP_ORDER.length,
    isFirstStep,
    isLastStep,
    canProceed: canProceed(),
    nextStep,
    prevStep,
    goToStep,
    showInterstitial,
  };
}
