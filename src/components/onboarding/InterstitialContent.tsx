import { InterstitialId } from '../../constants/interstitials';
import { motion } from 'framer-motion';
import { fadeIn } from '../../utils/animations';
import {
  EfficiencySection,
  CustomisationSection,
  TimeToSuccessSection,
  SocialProofSection,
} from './feature-sections';

interface InterstitialContentProps {
  id: InterstitialId;
}

const FEATURE_SECTION_MAP: Record<InterstitialId, React.ComponentType> = {
  'after-type': EfficiencySection,
  'after-personality': CustomisationSection,
  'after-traits': TimeToSuccessSection,
  'after-style': SocialProofSection,
};

export function InterstitialContent({ id }: InterstitialContentProps) {
  const FeatureComponent = FEATURE_SECTION_MAP[id];
  
  if (!FeatureComponent) {
    return null;
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ overflow: 'visible' }}
    >
      <FeatureComponent />
    </motion.div>
  );
}
