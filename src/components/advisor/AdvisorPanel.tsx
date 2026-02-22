import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { AdvisorOrb } from './AdvisorOrb';
import { StatsDisplay } from './StatsDisplay';
import { SelectionSummary } from './SelectionSummary';

export function AdvisorPanel() {
  const { config, isActivated } = useAdvisorStore();
  
  // Calculate intensity based on configuration progress
  const calculateIntensity = () => {
    let progress = 0;
    if (config.type) progress += 20;
    if (config.personality || config.customStats) progress += 20;
    if (config.traits.embrace.length > 0 || config.traits.avoid.length > 0) progress += 20;
    if (config.challengeStyle) progress += 20;
    if (config.voice) progress += 20;
    return progress;
  };
  
  const intensity = calculateIntensity();
  const hasStats = !!(config.personality || config.customStats);
  
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 border border-[var(--border)] min-w-0 w-full max-w-full">
      <div className="flex flex-col items-center min-w-0">
        <h2 className="text-xl md:text-2xl font-display font-medium mb-2 text-[var(--text-primary)] text-center">
          Your AI Advisor
        </h2>
        <div className="w-full mb-4 min-w-0">
          <SelectionSummary />
        </div>
        <div className="scale-75 sm:scale-100 w-full max-w-full flex justify-center">
          <AdvisorOrb 
            intensity={intensity} 
            isActivated={isActivated} 
            allowProfanity={config.allowProfanity}
          />
        </div>
        
        <div className="mt-8 w-full">
          <StatsDisplay 
            stats={config.personality?.stats || config.customStats} 
            showPlaceholder={!hasStats}
            isActive={hasStats}
          />
        </div>

      </div>
    </div>
  );
}
