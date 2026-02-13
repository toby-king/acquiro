import { useStepNavigation } from '../../hooks/useStepNavigation';
import { ProgressBar } from '../ui/ProgressBar';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';

const STEP_LABELS = ['Type', 'Personality', 'Traits', 'Style', 'Voice'];

export function Header() {
  const { currentStepIndex } = useStepNavigation();
  
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
              currentStep={currentStepIndex}
              completedSteps={currentStepIndex - 1}
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
