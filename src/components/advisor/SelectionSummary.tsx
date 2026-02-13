import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ADVISOR_TYPES } from '../../constants/advisorTypes';
import { CHALLENGE_STYLES } from '../../constants/challengeStyles';

interface SelectionSummaryProps {
  showTraits?: boolean;
  textColor?: 'primary' | 'secondary';
}

export function SelectionSummary({ showTraits = true, textColor = 'primary' }: SelectionSummaryProps) {
  const { config } = useAdvisorStore();
  
  // Collect all config values
  const values: (string | null)[] = [];
  
  if (config.type) {
    values.push(ADVISOR_TYPES.find(t => t.id === config.type)?.name || null);
  }
  
  if (config.personality) {
    values.push(config.personality.name);
  } else if (config.customStats) {
    values.push('Custom');
  }
  
  if (config.challengeStyle) {
    values.push(CHALLENGE_STYLES.find(s => s.id === config.challengeStyle)?.name || null);
  }
  
  const filteredValues = values.filter((v): v is string => v !== null);
  
  return (
    <div className="mt-1 text-sm text-center">
      {filteredValues.length > 0 && (
        <div className="flex flex-wrap items-center justify-center">
          {filteredValues.map((value, index) => (
            <span key={index} className={textColor === 'secondary' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}>
              {index > 0 && <span className="text-[var(--text-secondary)] mx-1">|</span>}
              {value}
            </span>
          ))}
        </div>
      )}
      
      {showTraits && (config.traits.embrace.length > 0 || config.traits.avoid.length > 0) && (
        <div className="pt-2 mt-2 border-t border-[var(--border)]">
          <div className="space-y-1">
            {config.traits.embrace.length > 0 && (
              <div>
                <span className="text-accent text-xs">
                  {config.traits.embrace.join(', ')}
                </span>
              </div>
            )}
            {config.traits.avoid.length > 0 && (
              <div>
                <span className="text-red-400 text-xs">
                  {config.traits.avoid.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
