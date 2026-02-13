import { createContext, useContext, useState, ReactNode } from 'react';

export type AdvisorType = 'mentor' | 'workhorse' | 'hybrid' | null;

export interface PersonalityStats {
  patience: number;
  analytical: number;
  warmth: number;
  directness: number;
  verbosity: number;
}

export type PersonalityPreset = 'buffett' | 'jobs' | 'oprah' | 'musk' | 'custom' | null;

export interface AdvisorState {
  advisorType: AdvisorType;
  personalityPreset: PersonalityPreset;
  personalityStats: PersonalityStats;
  profanityEnabled: boolean;
  likedTraits: string[];
  dislikedTraits: string[];
  negotiationStyle: number;
  negotiationStyleSet: boolean;
  voice: string | null;
  previewType: AdvisorType;
}

interface AdvisorContextType {
  state: AdvisorState;
  updateAdvisorType: (type: AdvisorType) => void;
  updatePersonalityPreset: (preset: PersonalityPreset) => void;
  updatePersonalityStats: (stats: PersonalityStats) => void;
  toggleProfanity: () => void;
  toggleLikedTrait: (trait: string) => void;
  toggleDislikedTrait: (trait: string) => void;
  updateNegotiationStyle: (value: number) => void;
  updateVoice: (voice: string) => void;
  setPreviewType: (type: AdvisorType) => void;
  getCompletionPercentage: () => number;
  isStepComplete: (step: number) => boolean;
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

const presetStats: Record<string, PersonalityStats> = {
  buffett: { patience: 95, analytical: 90, warmth: 70, directness: 60, verbosity: 40 },
  jobs: { patience: 30, analytical: 85, warmth: 40, directness: 95, verbosity: 60 },
  oprah: { patience: 90, analytical: 70, warmth: 95, directness: 50, verbosity: 80 },
  musk: { patience: 20, analytical: 95, warmth: 30, directness: 90, verbosity: 50 },
};

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdvisorState>({
    advisorType: null,
    personalityPreset: null,
    personalityStats: { patience: 50, analytical: 50, warmth: 50, directness: 50, verbosity: 50 },
    profanityEnabled: false,
    likedTraits: [],
    dislikedTraits: [],
    negotiationStyle: 50,
    negotiationStyleSet: false,
    voice: null,
    previewType: null,
  });

  const updateAdvisorType = (type: AdvisorType) => {
    setState(prev => ({ ...prev, advisorType: type }));
  };

  const updatePersonalityPreset = (preset: PersonalityPreset) => {
    setState(prev => ({
      ...prev,
      personalityPreset: preset,
      personalityStats: preset && preset !== 'custom' ? presetStats[preset] : prev.personalityStats,
    }));
  };

  const updatePersonalityStats = (stats: PersonalityStats) => {
    setState(prev => ({ ...prev, personalityStats: stats }));
  };

  const toggleProfanity = () => {
    setState(prev => ({ ...prev, profanityEnabled: !prev.profanityEnabled }));
  };

  const toggleLikedTrait = (trait: string) => {
    setState(prev => ({
      ...prev,
      likedTraits: prev.likedTraits.includes(trait)
        ? prev.likedTraits.filter(t => t !== trait)
        : prev.likedTraits.length < 5
        ? [...prev.likedTraits, trait]
        : prev.likedTraits,
    }));
  };

  const toggleDislikedTrait = (trait: string) => {
    setState(prev => ({
      ...prev,
      dislikedTraits: prev.dislikedTraits.includes(trait)
        ? prev.dislikedTraits.filter(t => t !== trait)
        : prev.dislikedTraits.length < 5
        ? [...prev.dislikedTraits, trait]
        : prev.dislikedTraits,
    }));
  };

  const updateNegotiationStyle = (value: number) => {
    setState(prev => ({ ...prev, negotiationStyle: value, negotiationStyleSet: true }));
  };

  const updateVoice = (voice: string) => {
    setState(prev => ({ ...prev, voice }));
  };

  const setPreviewType = (type: AdvisorType) => {
    setState(prev => ({ ...prev, previewType: type }));
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return state.advisorType !== null;
      case 2:
        return state.personalityPreset !== null;
      case 3:
        return state.likedTraits.length > 0 || state.dislikedTraits.length > 0;
      case 4:
        return state.negotiationStyleSet;
      case 5:
        return state.voice !== null;
      default:
        return false;
    }
  };

  const getCompletionPercentage = (): number => {
    const steps = [1, 2, 3, 4, 5];
    const completed = steps.filter(step => isStepComplete(step)).length;
    return (completed / steps.length) * 100;
  };

  return (
    <AdvisorContext.Provider
      value={{
        state,
        updateAdvisorType,
        updatePersonalityPreset,
        updatePersonalityStats,
        toggleProfanity,
        toggleLikedTrait,
        toggleDislikedTrait,
        updateNegotiationStyle,
        updateVoice,
        setPreviewType,
        getCompletionPercentage,
        isStepComplete,
      }}
    >
      {children}
    </AdvisorContext.Provider>
  );
}

export function useAdvisor() {
  const context = useContext(AdvisorContext);
  if (!context) {
    throw new Error('useAdvisor must be used within AdvisorProvider');
  }
  return context;
}
