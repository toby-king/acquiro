import { type MouseEvent } from 'react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { EMBRACE_TRAITS } from '../../constants/traits';
import { Pill } from '../ui/Pill';
import { motion } from 'framer-motion';
import { staggerChildren, slideUp } from '../../utils/animations';
import { useAbsorption } from '../../hooks/useAbsorption';

const MAX_SELECTIONS = 5;

export function TraitsStep() {
  const { config, setTraits } = useAdvisorStore();
  const { triggerAbsorption } = useAbsorption();
  
  const handleEmbraceToggle = (trait: string, element: HTMLElement) => {
    const current = config.traits.embrace;
    const newEmbrace = current.includes(trait)
      ? current.filter(t => t !== trait)
      : current.length < MAX_SELECTIONS
      ? [...current, trait]
      : current;
    
    setTraits({
      ...config.traits,
      embrace: newEmbrace,
    });
    // Only trigger absorption when adding a trait (not removing)
    if (!current.includes(trait) && newEmbrace.includes(trait)) {
      triggerAbsorption(element, `trait-embrace-${trait}`);
    }
  };
  
  // handleAvoidToggle is commented out since avoid traits section is hidden
  // const handleAvoidToggle = (trait: string, element: HTMLElement) => {
  //   const current = config.traits.avoid;
  //   const newAvoid = current.includes(trait)
  //     ? current.filter(t => t !== trait)
  //     : current.length < MAX_SELECTIONS
  //     ? [...current, trait]
  //     : current;
  //   
  //   setTraits({
  //     ...config.traits,
  //     avoid: newAvoid,
  //   });
  //   triggerAbsorption(element, `trait-avoid-${trait}`);
  // };
  
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className='text-center'>
        <h2 className="text-3xl font-display font-bold mb-2 text-[var(--text-primary)]">
          Define Your Advisor's Traits
        </h2>
        <p className="text-[var(--text-secondary)]">
          Select up to 5 traits to embrace.
        </p>
      </div>
      
      <div className="w-full">
        {/* Embrace Section */}
        <motion.div variants={slideUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Embrace These Traits
            </h3>
            <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full">
              {config.traits.embrace.length}/{MAX_SELECTIONS}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {EMBRACE_TRAITS.map((trait) => {
              const isSelected = config.traits.embrace.includes(trait);
              return (
                <Pill
                  key={trait}
                  selected={isSelected}
                  variant="embrace"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => handleEmbraceToggle(trait, e.currentTarget)}
                >
                  {trait}
                </Pill>
              );
            })}
          </div>
          
          {config.traits.embrace.length > 0 && (
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Selected:</p>
              <p className="text-sm text-accent">
                {config.traits.embrace.join(', ')}
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Avoid Section - Commented out */}
        {/* <motion.div variants={slideUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Avoid These Traits
            </h3>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">
              {config.traits.avoid.length}/{MAX_SELECTIONS}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {AVOID_TRAITS.map((trait) => {
              const isSelected = config.traits.avoid.includes(trait);
              return (
                <Pill
                  key={trait}
                  selected={isSelected}
                  variant="avoid"
                  onClick={(e) => handleAvoidToggle(trait, e.currentTarget)}
                >
                  {trait}
                </Pill>
              );
            })}
          </div>
          
          {config.traits.avoid.length > 0 && (
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Selected:</p>
              <p className="text-sm text-red-400">
                {config.traits.avoid.join(', ')}
              </p>
            </div>
          )}
        </motion.div> */}
      </div>
    </motion.div>
  );
}
