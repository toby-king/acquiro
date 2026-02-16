import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Mail, Reply, MessageCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';

const STEPS = [
  {
    id: 1,
    title: 'Searching',
    description: "I'm currently out searching for market listings that meet your criteria.",
    icon: Search,
  },
  {
    id: 2,
    title: 'Matching',
    description: "As soon as a match is found, I will email you directly.",
    icon: Mail,
  },
  {
    id: 3,
    title: 'Responding',
    description: "You can respond directly to the email, telling me if any of the matches are of interest, if you'd like more info on a specific listing, or if they aren't quite right.",
    icon: Reply,
  },
  {
    id: 4,
    title: 'Refining',
    description: "You can also chat to me via email to narrow down your search criteria, or ask for expert M&A advice.",
    icon: MessageCircle,
  },
  {
    id: 5,
    title: 'Always Available',
    description: "While you're waiting for the first matches, feel free to speak directly to me about what you're looking for!",
    icon: Clock,
  },
];

interface WhatsNextScreenProps {
  userName?: string;
  advisorName?: string;
  onContinue?: () => void;
}

export function WhatsNextScreen({ userName, advisorName, onContinue }: WhatsNextScreenProps) {
  const navigate = useNavigate();
  const { userName: storeUserName, config } = useAdvisorStore();
  const displayUserName = userName || storeUserName;
  const displayAdvisorName = advisorName || config.advisorName;
  
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animate through steps on mount
  useEffect(() => {
    const animateSteps = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setActiveStep(i);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      setAnimationComplete(true);
    };
    
    animateSteps();
  }, []);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 md:mb-16"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Welcome{displayUserName ? `, ${displayUserName}` : ''}!
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          {displayAdvisorName ? `${displayAdvisorName} is` : 'Your advisor is'} ready to work for you.
        </p>
      </motion.div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block w-full max-w-5xl mb-16">
        <div className="flex items-start justify-between relative">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {/* Connector Arrow */}
              {index < STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: activeStep !== null && activeStep >= index ? 1 : 0 
                  }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="absolute top-8 left-[60%] w-[80%] flex items-center justify-center z-0"
                >
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </motion.div>
              )}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: activeStep !== null && activeStep >= index ? 1 : 0,
                  opacity: activeStep !== null && activeStep >= index ? 1 : 0,
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative z-10"
              >
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeStep !== null && activeStep >= index
                      ? 'bg-accent/10 border-2 border-accent' 
                      : 'bg-gray-900/50 border-2 border-gray-700'
                  }`}
                >
                  {(() => {
                    const IconComponent = step.icon;
                    return (
                      <IconComponent 
                        className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${
                          activeStep !== null && activeStep >= index
                            ? 'text-accent'
                            : 'text-gray-600'
                        }`}
                      />
                    );
                  })()}
                </div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: activeStep !== null && activeStep >= index ? 1 : 0,
                  y: activeStep !== null && activeStep >= index ? 0 : 10,
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6 text-center px-2"
              >
                <p className="text-sm text-gray-400 leading-relaxed max-w-[180px]">
                  {step.description}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden w-full max-w-md mb-12">
        <div className="flex flex-col gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: activeStep !== null && activeStep >= index ? 1 : 0,
                x: activeStep !== null && activeStep >= index ? 0 : -20,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4 relative"
            >
              {/* Connector Line (vertical) */}
              {index < STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: activeStep !== null && activeStep >= index ? 1 : 0 
                  }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="absolute top-12 left-6 w-0.5 h-16 bg-gray-600"
                />
              )}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: activeStep !== null && activeStep >= index ? 1 : 0,
                  opacity: activeStep !== null && activeStep >= index ? 1 : 0,
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative flex-shrink-0"
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeStep !== null && activeStep >= index
                      ? 'bg-accent/10 border-2 border-accent' 
                      : 'bg-gray-900/50 border-2 border-gray-700'
                  }`}
                >
                  {(() => {
                    const IconComponent = step.icon;
                    return (
                      <IconComponent 
                        className={`w-6 h-6 transition-colors ${
                          activeStep !== null && activeStep >= index
                            ? 'text-accent'
                            : 'text-gray-600'
                        }`}
                      />
                    );
                  })()}
                </div>
              </motion.div>

              {/* Text */}
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: animationComplete ? 1 : 0, 
          y: animationComplete ? 0 : 20 
        }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={handleContinue}
          disabled={!animationComplete}
          className="flex items-center gap-2 px-8 py-4 bg-accent text-black font-semibold rounded-full hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Enter Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
