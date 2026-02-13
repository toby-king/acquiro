import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { CHALLENGE_STYLES } from '../../constants/challengeStyles';
import { Card } from '../ui/Card';
import { Slider } from '../ui/Slider';
import { motion } from 'framer-motion';
import { staggerChildren, slideUp } from '../../utils/animations';
import { useAbsorption } from '../../hooks/useAbsorption';
import { ThumbsUp, Shield, HelpCircle, Target, Flame } from 'lucide-react';

const styleIconMap = {
  'yes-person': ThumbsUp,
  'supportive-challenger': Shield,
  'devils-advocate': HelpCircle,
  'tough-love': Target,
  'ruthless-critic': Flame,
};

export function StyleStep() {
  const { config, setChallengeStyle, setChallengeLevel } = useAdvisorStore();
  const { triggerAbsorption } = useAbsorption();
  
  const currentStyle = CHALLENGE_STYLES.find(s => s.id === config.challengeStyle) || CHALLENGE_STYLES[2];
  
  const getStyleColor = (level: number): string => {
    // Color mapping based on challenge level
    if (level <= 12.5) return 'rgb(96, 165, 250)'; // blue (0%)
    if (level <= 37.5) return 'rgb(52, 211, 153)'; // teal/green (25%)
    if (level <= 62.5) return 'rgb(251, 191, 36)'; // yellow (50%)
    if (level <= 87.5) return 'rgb(251, 146, 60)'; // orange (75%)
    return 'rgb(239, 68, 68)'; // red (100%)
  };

  const getBackgroundColor = (color: string): string => {
    // Convert rgb to rgba with 0.4 opacity
    return color.replace('rgb', 'rgba').replace(')', ', 0.4)');
  };

  const getBorderColor = (color: string): string => {
    // Convert rgb to rgba with 1.0 opacity (full opacity)
    return color.replace('rgb', 'rgba').replace(')', ', 1)');
  };
  
  const handlePresetClick = (styleId: string, position: number, element: HTMLElement) => {
    setChallengeStyle(styleId as typeof config.challengeStyle);
    setChallengeLevel(position);
    triggerAbsorption(element, `style-${styleId}`);
  };
  
  const handleSliderChange = (value: number) => {
    // Snap to nearest preset position
    const presetPositions = CHALLENGE_STYLES.map(s => s.position);
    const closestPosition = presetPositions.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    setChallengeLevel(closestPosition);
  };

  // Map slider values to visual positions aligned with button centers
  // First and last buttons at slider edges: 0% -> 0%, 25% -> 30%, 50% -> 50%, 75% -> 70%, 100% -> 100%
  const getThumbPosition = (value: number): number => {
    const positions: { [key: number]: number } = {
      0: 0,
      25: 30,
      50: 50,
      75: 70,
      100: 100,
    };
    
    // If exact match, return mapped position
    if (positions[value] !== undefined) {
      return positions[value];
    }
    
    // Linear interpolation between known points
    const sortedKeys = Object.keys(positions).map(Number).sort((a, b) => a - b);
    let lower = sortedKeys[0];
    let upper = sortedKeys[sortedKeys.length - 1];
    
    for (let i = 0; i < sortedKeys.length - 1; i++) {
      if (value >= sortedKeys[i] && value <= sortedKeys[i + 1]) {
        lower = sortedKeys[i];
        upper = sortedKeys[i + 1];
        break;
      }
    }
    
    const lowerPos = positions[lower];
    const upperPos = positions[upper];
    const ratio = (value - lower) / (upper - lower);
    return lowerPos + (upperPos - lowerPos) * ratio;
  };
  
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className='text-center'>
        <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">
          Set Challenge Style
        </h2>
        <p className="text-[var(--text-secondary)]">
          How much pushback do you want from your advisor?
        </p>
      </div>
      
      {/* Current Style Card */}
      <motion.div variants={slideUp}>
        <Card className="p-6">
          <div className="text-center space-y-4">
            {/* Icon with colored circle background */}
            <div className="flex justify-center">
              {(() => {
                const IconComponent = styleIconMap[currentStyle.id as keyof typeof styleIconMap];
                const iconColor = getStyleColor(config.challengeLevel);
                return (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300"
                    style={{ backgroundColor: iconColor }}
                  >
                    {IconComponent && (
                      <IconComponent size={48} className="text-white" />
                    )}
                  </div>
                );
              })()}
            </div>
            <h3 
              className="text-2xl font-bold transition-colors duration-300"
              style={{ color: getStyleColor(config.challengeLevel) }}
            >
              {currentStyle.name}
            </h3>
            <p className="text-[var(--text-secondary)]">
              {currentStyle.description}
            </p>
          </div>
        </Card>
      </motion.div>
      
      {/* Slider */}
      <motion.div variants={slideUp} className="space-y-4" style={{ paddingBottom: '12px' }}>
        <Slider
          value={config.challengeLevel}
          onChange={handleSliderChange}
          min={0}
          max={100}
          step={25}
          showLabels
          customLabels={{
            left: 'Agreeable',
            middle: 'Balanced',
            right: 'Critical',
          }}
          positionMap={getThumbPosition}
        />
      </motion.div>
      
      {/* Preset Buttons */}
      <motion.div
        variants={staggerChildren}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
      >
        {CHALLENGE_STYLES.map((style) => {
          const isSelected = config.challengeStyle === style.id;
          const IconComponent = styleIconMap[style.id as keyof typeof styleIconMap];
          const iconColor = getStyleColor(style.position);
          return (
            <motion.button
              key={style.id}
              variants={slideUp}
              onClick={(e) => handlePresetClick(style.id, style.position, e.currentTarget)}
              data-card-id={`style-${style.id}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-full border-2 transition-all duration-200 text-sm font-medium ${
                isSelected
                  ? 'text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}
              style={{
                backgroundColor: isSelected ? getBackgroundColor(iconColor) : undefined,
                borderColor: getBorderColor(iconColor),
              }}
            >
              {IconComponent && (
                <IconComponent 
                  size={28} 
                  className={isSelected ? 'text-white' : 'text-[var(--text-secondary)]'} 
                />
              )}
              <span>{style.name}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
