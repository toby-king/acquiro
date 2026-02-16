import { useStepNavigation } from '../../hooks/useStepNavigation';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ProgressBar } from '../ui/ProgressBar';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';

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
        <div className="flex items-center justify-between gap-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <img src={logo} alt="Acquiro Logo" className="w-full h-full rounded-full" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Acquiro Agents
            </h1>
          </div>
          
          {/* Progress Bar - centered and flexible */}
          <div className="flex-1 flex justify-end">
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
