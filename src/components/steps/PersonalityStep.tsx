import { useState, useRef } from 'react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { PERSONALITY_PRESETS, CUSTOM_PERSONALITY } from '../../constants/personalities';
import { Card } from '../ui/Card';
import { StatsDisplay } from '../advisor/StatsDisplay';
import { RadarChart } from '../advisor/RadarChart';
import { Toggle } from '../ui/Toggle';
import { Slider } from '../ui/Slider';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerChildren, slideUp } from '../../utils/animations';
import { useAbsorption } from '../../hooks/useAbsorption';

export function PersonalityStep() {
  const { config, setPersonality, setCustomStats, setAllowProfanity } = useAdvisorStore();
  const [showCustomSliders, setShowCustomSliders] = useState(false);
  const [hoveredPersonality, setHoveredPersonality] = useState<string | null>(null);
  const { triggerAbsorption } = useAbsorption();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const handleSelectPreset = (personalityId: string) => {
    const personality = PERSONALITY_PRESETS.find(p => p.id === personalityId);
    if (personality) {
      setPersonality(personality);
      setShowCustomSliders(false);
      const element = cardRefs.current[personalityId];
      if (element) {
        triggerAbsorption(element, `personality-${personalityId}`);
      }
    }
  };
  
  const handleCustomSelect = () => {
    setShowCustomSliders(true);
    if (!config.customStats) {
      setCustomStats(CUSTOM_PERSONALITY.stats);
    }
    // Note: Custom doesn't trigger absorption as it's not a card selection
  };
  
  const handleStatChange = (stat: keyof typeof CUSTOM_PERSONALITY.stats, value: number) => {
    setCustomStats({
      ...(config.customStats || CUSTOM_PERSONALITY.stats),
      [stat]: value,
    });
  };
  
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">
          Choose Your Personality
        </h2>
        <p className="text-[var(--text-secondary)]">
          Select a preset personality or customize your advisor's traits.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERSONALITY_PRESETS.map((personality) => {
          const isSelected = config.personality?.id === personality.id;
          const isHovered = hoveredPersonality === personality.id;
          const showRadarActive = isSelected || isHovered;
          
          return (
            <motion.div 
              key={personality.id} 
              variants={slideUp}
              onMouseEnter={() => setHoveredPersonality(personality.id)}
              onMouseLeave={() => setHoveredPersonality(null)}
            >
              <div
                ref={(el) => { cardRefs.current[personality.id] = el; }}
                className="relative"
                data-card-id={`personality-${personality.id}`}
              >
                <Card
                  selected={isSelected}
                  interactive
                  onClick={() => handleSelectPreset(personality.id)}
                  className="relative"
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-accent text-[var(--bg-primary)] text-xs font-medium rounded-full flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-primary)]" />
                      Active
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                    {personality.name}
                  </h3>
                  
                  <div className="flex items-start gap-6 mb-4">
                    {/* Radar Chart */}
                    <div className="flex-shrink-0">
                      <RadarChart stats={personality.stats} isActive={showRadarActive} size={120} />
                    </div>
                    
                    {/* Stats Display */}
                    <div className="flex-1">
                      <StatsDisplay stats={personality.stats} isActive={showRadarActive} />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-secondary)] italic">
                      "{personality.quote}"
                    </p>
                  </div>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Custom Option */}
      <motion.div variants={slideUp}>
        <Card
          selected={showCustomSliders || !!config.customStats}
          interactive
          onClick={handleCustomSelect}
          className="relative"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              showCustomSliders || config.customStats
                ? 'bg-accent text-[var(--bg-primary)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            } transition-colors duration-200`}>
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Custom Personality
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Adjust each trait to your preference
              </p>
            </div>
          </div>
          
          <AnimatePresence>
            {showCustomSliders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-4"
                style={{ paddingBottom: '12px' }}
              >
                {Object.entries(CUSTOM_PERSONALITY.stats).map(([key, value], index, array) => (
                  <div key={key} style={{ paddingBottom: index === array.length - 1 ? '12px' : '0' }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-[var(--text-primary)] capitalize">
                        {key}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {config.customStats?.[key as keyof typeof config.customStats] || value}
                      </span>
                    </div>
                    <Slider
                      value={config.customStats?.[key as keyof typeof config.customStats] || value}
                      onChange={(val) => handleStatChange(key as keyof typeof CUSTOM_PERSONALITY.stats, val)}
                      min={0}
                      max={100}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      {/* Profanity Toggle */}
      <div className="pt-4 border-t border-[var(--border)]">
        <Toggle
          checked={config.allowProfanity}
          onChange={setAllowProfanity}
          label="Allow colorful language"
        />
      </div>
    </motion.div>
  );
}
