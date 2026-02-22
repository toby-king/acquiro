import { useStepNavigation } from '../../hooks/useStepNavigation';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ProgressBar } from '../ui/ProgressBar';
import { ThemeToggle } from './ThemeToggle';
import { Link } from 'react-router-dom';

const STEP_LABELS = ['Type', 'Personality', 'Traits', 'Style', 'Voice'];
const STEP_ORDER = ['type', 'personality', 'traits', 'style', 'voice'];

export function Header() {
  const { showInterstitial } = useStepNavigation();
  const { currentStep } = useAdvisorStore();
  
  // Calculate progress bar state
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  
  // During interstitials, show the completed step as filled, next step remains unfilled
  // Example: After completing Type (index 0), during interstitial:
  // - Type (step 1) should be filled/completed
  // - Personality (step 2) should be upcoming/unfilled
  // ProgressBar logic: isCompleted = stepNumber < currentStep, isCurrent = stepNumber === currentStep
  // So if currentStep=1, step 1 is current (filled), step 2+ are upcoming (unfilled)
  const progressStepIndex = showInterstitial 
    ? currentStepIndex + 1  // Show completed step as "current" (filled), next step shows as upcoming
    : currentStepIndex + 1;  // Normal: show current step (1-indexed)
  
  const completedSteps = showInterstitial 
    ? currentStepIndex  // Completed steps are before the "current" (which is the completed step)
    : currentStepIndex; // Normal: completed steps are before current
  
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-6 min-w-0">
          {/* Logo */}
          <Link to="/" className="font-display font-bold text-lg sm:text-[1.6rem] text-[var(--text-primary)] flex-shrink-0 min-h-[44px] flex items-center">
            acquiro<span className="text-accent">.</span>
          </Link>
          
          {/* Progress Bar - centered and flexible */}
          <div className="flex-1 flex justify-end min-w-0 overflow-hidden">
            <ProgressBar
              steps={STEP_LABELS}
              currentStep={progressStepIndex}
              completedSteps={completedSteps}
            />
          </div>
          
          {/* Theme Toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
