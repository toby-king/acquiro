import { useAdvisorStore } from './useAdvisorStore';
import { WizardStep } from '../types/advisor';

const STEP_ORDER: WizardStep[] = ['type', 'personality', 'traits', 'style', 'voice'];

export function useStepNavigation() {
  const { currentStep, nextStep, prevStep, goToStep } = useAdvisorStore();
  
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1;
  
  const canProceed = () => {
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
    currentStepIndex: currentStepIndex + 1,
    totalSteps: STEP_ORDER.length,
    isFirstStep,
    isLastStep,
    canProceed: canProceed(),
    nextStep,
    prevStep,
    goToStep,
  };
}
