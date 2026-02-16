import { useStepNavigation } from '../../hooks/useStepNavigation';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

export function StepNavigation() {
  const { isFirstStep, isLastStep, canProceed, nextStep, prevStep, currentStepIndex, totalSteps, showInterstitial } = useStepNavigation();
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
      <div>
        {!isFirstStep && (
          <Button variant="ghost" onClick={prevStep}>
            Previous
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        {/* Hide step indicator during interstitials */}
        {!showInterstitial && (
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
            Step {currentStepIndex} of {totalSteps}
          </span>
        )}
        
        {isLastStep && !showInterstitial ? (
          <Button
            variant="primary"
            onClick={nextStep}
            disabled={!canProceed}
            className="flex-1 sm:flex-none px-12"
          >
            Activate Your Advisor
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={nextStep}
            disabled={!canProceed}
            className="flex-1 sm:flex-none px-12"
          >
            {showInterstitial ? 'Continue' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}
