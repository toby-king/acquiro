import { create } from 'zustand';
import { AdvisorConfig, WizardStep } from '../types/advisor';
import { CHALLENGE_STYLES } from '../constants/challengeStyles';

interface AdvisorStore {
  config: AdvisorConfig;
  currentStep: WizardStep;
  isComplete: boolean;
  isActivated: boolean;
  advisorName: string | null;
  userName: string | null;
  userEmail: string | null;
  
  // Actions
  setType: (type: AdvisorConfig['type']) => void;
  setPersonality: (personality: AdvisorConfig['personality']) => void;
  setCustomStats: (stats: AdvisorConfig['customStats']) => void;
  setTraits: (traits: AdvisorConfig['traits']) => void;
  setChallengeStyle: (style: AdvisorConfig['challengeStyle']) => void;
  setChallengeLevel: (level: number) => void;
  setVoice: (voice: AdvisorConfig['voice']) => void;
  setAllowProfanity: (allow: boolean) => void;
  setAdvisorName: (name: string) => void;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  activateAdvisor: () => void;
  reset: () => void;
}

const STEP_ORDER: WizardStep[] = ['type', 'personality', 'traits', 'style', 'voice'];

const initialConfig: AdvisorConfig = {
  type: null,
  personality: null,
  customStats: null,
  traits: {
    embrace: [],
    avoid: [],
  },
  challengeStyle: null,
  challengeLevel: 50,
  voice: null,
  allowProfanity: false,
};

export const useAdvisorStore = create<AdvisorStore>((set, get) => ({
  config: initialConfig,
  currentStep: 'type',
  isComplete: false,
  isActivated: false,
  advisorName: null,
  userName: null,
  userEmail: null,
  
  setType: (type) => set((state) => ({ config: { ...state.config, type } })),
  
  setPersonality: (personality) => set((state) => ({ 
    config: { ...state.config, personality, customStats: null } 
  })),
  
  setCustomStats: (customStats) => set((state) => ({ 
    config: { ...state.config, customStats, personality: null } 
  })),
  
  setTraits: (traits) => set((state) => ({ config: { ...state.config, traits } })),
  
  setChallengeStyle: (challengeStyle) => set((state) => ({ 
    config: { ...state.config, challengeStyle } 
  })),
  
  setChallengeLevel: (challengeLevel) => {
    // Find the closest style based on position
    const closestStyle = CHALLENGE_STYLES.reduce((prev, curr) => 
      Math.abs(curr.position - challengeLevel) < Math.abs(prev.position - challengeLevel) ? curr : prev
    );
    // Only set the style if we're within 15 units of a preset position
    const style = Math.abs(closestStyle.position - challengeLevel) < 15 
      ? closestStyle 
      : null;
    set((state) => ({ 
      config: { 
        ...state.config, 
        challengeLevel,
        challengeStyle: style?.id as AdvisorConfig['challengeStyle'] || state.config.challengeStyle
      } 
    }));
  },
  
  setVoice: (voice) => set((state) => ({ config: { ...state.config, voice } })),
  
  setAllowProfanity: (allowProfanity) => set((state) => ({ 
    config: { ...state.config, allowProfanity } 
  })),
  
  setAdvisorName: (name) => set({ advisorName: name }),
  
  setUserName: (name) => set({ userName: name }),
  
  setUserEmail: (email) => set({ userEmail: email }),
  
  goToStep: (step) => set({ currentStep: step }),
  
  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1] });
    } else {
      // Check if all required fields are set
      const { config } = get();
      const isComplete = !!(
        config.type &&
        (config.personality || config.customStats) &&
        config.challengeStyle &&
        config.voice
      );
      set({ isComplete });
    }
  },
  
  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },
  
  activateAdvisor: () => set({ isActivated: true }),
  
  reset: () => set({ 
    config: initialConfig, 
    currentStep: 'type', 
    isComplete: false, 
    isActivated: false,
    advisorName: null,
    userName: null,
    userEmail: null,
  }),
}));
