import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ADVISOR_TYPES } from '../../constants/advisorTypes';
import { Card } from '../ui/Card';
import { GraduationCap, Zap, Scale, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerChildren, slideUp } from '../../utils/animations';
import { useAbsorption } from '../../hooks/useAbsorption';
import { useRef } from 'react';

const iconMap = {
  'graduation-cap': GraduationCap,
  'zap': Zap,
  'scale': Scale,
};

export function TypeStep() {
  const { config, setType } = useAdvisorStore();
  const { triggerAbsorption } = useAbsorption();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const handleSelect = (typeId: string) => {
    setType(typeId as typeof config.type);
    const element = cardRefs.current[typeId];
    if (element) {
      triggerAbsorption(element, `type-${typeId}`);
    }
  };
  
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="text-center min-w-0">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 text-[var(--text-primary)]">
          Choose Your Advisor Type
        </h2>
        <p className="text-[var(--text-secondary)]">
          Select the style of guidance that best fits your acquisition journey.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        {ADVISOR_TYPES.map((type) => {
          const Icon = iconMap[type.icon as keyof typeof iconMap] || GraduationCap;
          const isSelected = config.type === type.id;
          
          return (
            <motion.div key={type.id} variants={slideUp}>
              <div
                ref={(el) => { cardRefs.current[type.id] = el; }}
                className="relative"
                data-card-id={`type-${type.id}`}
              >
                <Card
                  selected={isSelected}
                  interactive
                  onClick={() => handleSelect(type.id)}
                  className="relative"
                >
                <div className="flex items-center gap-6">
                  <div 
                    className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      isSelected ? '' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                    style={isSelected ? {
                      background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(168, 85, 247))',
                    } : undefined}
                  >
                    <Icon size={48} className={isSelected ? 'text-white' : ''} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                        {type.name}
                      </h3>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                        >
                          <Check size={12} className="text-[var(--bg-primary)]" />
                        </motion.div>
                      )}
                    </div>
                    <p className={`font-medium mb-2 ${isSelected ? 'text-accent' : 'text-[var(--text-secondary)]'}`}>
                      {type.tagline}
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
