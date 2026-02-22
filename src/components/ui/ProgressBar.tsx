import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  steps: string[];
  currentStep: number;
  completedSteps: number;
}

export function ProgressBar({ steps, currentStep, completedSteps: _completedSteps, className = '' }: ProgressBarProps) {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        // Determine segment color
        const segmentColor = isCompleted || isCurrent
          ? 'bg-accent'
          : 'bg-[var(--border)]';
        
        // Determine text color
        const textColor = isCurrent
          ? 'text-accent'
          : 'text-[var(--text-secondary)]';
        
        return (
          <div key={step} className="flex flex-col items-center gap-1.5">
            {/* Pill-shaped segment */}
            <motion.div
              className={`h-2 w-24 rounded-full transition-all duration-500 ${segmentColor}`}
              initial={false}
              animate={{
                scale: isCurrent ? [1, 1.05, 1] : 1,
              }}
              transition={{ 
                duration: 0.5,
                repeat: isCurrent ? Infinity : 0,
                repeatType: 'reverse',
              }}
            />
            
            {/* Step label */}
            <span
              className={`text-xs transition-colors duration-300 whitespace-nowrap ${textColor}`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
