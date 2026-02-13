import { PersonalityPreset } from '../../types/advisor';
import { motion } from 'framer-motion';

interface StatsDisplayProps {
  stats: PersonalityPreset['stats'] | null;
  showPlaceholder?: boolean;
  isActive?: boolean;
}

export function StatsDisplay({ stats, showPlaceholder = false, isActive = false }: StatsDisplayProps) {
  const statLabels = {
    patience: 'Patience',
    analytical: 'Analytical',
    warmth: 'Warmth',
    directness: 'Directness',
    verbosity: 'Verbosity',
  };
  
  const displayStats = stats || {
    patience: 0,
    analytical: 0,
    warmth: 0,
    directness: 0,
    verbosity: 0,
  };
  
  return (
    <div className="space-y-3">
      {Object.entries(statLabels).map(([key, label]) => {
        const value = displayStats[key as keyof typeof displayStats];
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{label}</span>
              {showPlaceholder && !stats ? (
                <span className="text-[var(--text-secondary)]">—</span>
              ) : (
                <span className="text-[var(--text-primary)] font-medium">{value}</span>
              )}
            </div>
            <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden">
              {showPlaceholder && !stats ? (
                <div className="h-full bg-[var(--border)] w-full" />
              ) : isActive ? (
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ) : (
                <div className="h-full bg-[var(--border)] w-full" />
              )}
            </div>
          </div>
        );
      })}
      {showPlaceholder && !stats && (
        <p className="text-xs text-[var(--text-secondary)] mt-2">Set in Step 2</p>
      )}
    </div>
  );
}
