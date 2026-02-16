import { getInterstitialContent, InterstitialId } from '../../constants/interstitials';
import { motion } from 'framer-motion';
import { fadeIn } from '../../utils/animations';

interface InterstitialContentProps {
  id: InterstitialId;
}

export function InterstitialContent({ id }: InterstitialContentProps) {
  const content = getInterstitialContent(id);
  
  if (!content) {
    return null;
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4"
    >
      <div className="max-w-[500px] text-center space-y-6">
        {/* Optional Icon - placeholder for now */}
        {content.icon && (
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              {/* Icon would go here when implemented */}
            </div>
          </div>
        )}
        
        {/* Headline */}
        <h2 className="text-3xl font-medium text-[var(--text-primary)]">
          {content.headline}
        </h2>
        
        {/* Body Copy */}
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          {content.body}
        </p>
      </div>
    </motion.div>
  );
}
