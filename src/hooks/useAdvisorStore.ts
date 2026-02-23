import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdvisorConfig, WizardStep } from '../types/advisor';
import { CHALLENGE_STYLES } from '../constants/challengeStyles';
import { InterstitialId, getInterstitialAfterStep } from '../constants/interstitials';
import type { Match } from '../services/matchesService';

interface AdvisorStore {
  config: AdvisorConfig;
  currentStep: WizardStep;
  isComplete: boolean;
  isActivated: boolean;
  userName: string | null;
  userEmail: string | null;
  leadId: string | null;
  userId: string | null;
  showInterstitial: boolean;
  currentInterstitial: InterstitialId | null;
  /** Set to true when interstitial animation (e.g. typing) has completed; blocks Next until ready */
  interstitialReady: boolean;
  /** True when user returned via /builder?lead= - skip name/email, show reconnection message */
  isLeadReconnection: boolean;
  /** Match selected for discussion - when set, AdvisorPanel starts call with this context */
  matchToDiscuss: Match | null;

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
  setLeadId: (leadId: string) => void;
  setUserId: (userId: string) => void;
  setInterstitialReady: (ready: boolean) => void;
  /** Hydrate store from get_agent API (for lead reconnection flow) */
  hydrateFromLead: (leadId: string, config: AdvisorConfig, userName: string | null, userEmail: string | null) => void;
  clearLeadReconnection: () => void;
  /** Request a call with the given match - AdvisorPanel will start the call with match context */
  requestCallWithMatch: (match: Match) => void;
  clearMatchToDiscuss: () => void;
  
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  activateAdvisor: () => void;
  reset: () => void;
  logout: () => void;
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
  advisorName: null,
};

const sessionPartialize = (state: AdvisorStore) => ({
  userId: state.userId,
});

export const useAdvisorStore = create<AdvisorStore>()(
  persist(
    (set, get) => ({
  config: initialConfig,
  currentStep: 'type',
  isComplete: false,
  isActivated: false,
  userName: null,
  userEmail: null,
  leadId: null,
  userId: null,
  showInterstitial: false,
  currentInterstitial: null,
  interstitialReady: true,
  isLeadReconnection: false,
  matchToDiscuss: null,

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
  
  setAdvisorName: (name) => set((state) => ({ config: { ...state.config, advisorName: name } })),
  
  setUserName: (name) => set({ userName: name }),
  
  setUserEmail: (email) => set({ userEmail: email }),
  
  setLeadId: (leadId) => set({ leadId }),
  
  setUserId: (userId) => set({ userId }),
  setInterstitialReady: (ready) => set({ interstitialReady: ready }),
  hydrateFromLead: (leadId, config, userName, userEmail) => set({
    leadId,
    config,
    userName,
    userEmail,
    isComplete: true,
    isActivated: true,
    isLeadReconnection: true,
  }),
  clearLeadReconnection: () => set({ isLeadReconnection: false }),
  requestCallWithMatch: (match) => set({ matchToDiscuss: match }),
  clearMatchToDiscuss: () => set({ matchToDiscuss: null }),

  goToStep: (step) => set({ currentStep: step }),
  
  nextStep: () => {
    const { currentStep, showInterstitial } = get();
    
    if (showInterstitial) {
      // Currently on interstitial, advance to next main step (only if animation ready)
      const { interstitialReady } = get();
      if (!interstitialReady) return;
      const currentIndex = STEP_ORDER.indexOf(currentStep);
      if (currentIndex < STEP_ORDER.length - 1) {
        set({ 
          showInterstitial: false, 
          currentInterstitial: null,
          interstitialReady: true,
          currentStep: STEP_ORDER[currentIndex + 1] 
        });
      } else {
        // Last step - check completion
        const { config } = get();
        const isComplete = !!(
          config.type &&
          (config.personality || config.customStats) &&
          config.challengeStyle &&
          config.voice
        );
        set({ 
          showInterstitial: false,
          currentInterstitial: null,
          interstitialReady: true,
          isComplete 
        });
      }
    } else {
      // Currently on main step, check if there's an interstitial after
      const interstitialId = getInterstitialAfterStep(currentStep);
      
      if (interstitialId) {
        // Show interstitial before advancing to next step
        set({ 
          showInterstitial: true, 
          currentInterstitial: interstitialId,
          interstitialReady: false, // Will be set true when animation completes
        });
      } else {
        // No interstitial (after Voice step), proceed to completion check
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
      }
    }
  },
  
  prevStep: () => {
    const { currentStep, showInterstitial } = get();
    
    if (showInterstitial) {
      // Go back to the main step before this interstitial
      // User's selection is preserved since we don't change currentStep
      set({ 
        showInterstitial: false, 
        currentInterstitial: null,
        interstitialReady: true,
      });
    } else {
      // Normal previous behavior - go to previous step
      const currentIndex = STEP_ORDER.indexOf(currentStep);
      if (currentIndex > 0) {
        const prevStep = STEP_ORDER[currentIndex - 1];
        // Check if there's an interstitial after the previous step
        const prevInterstitial = getInterstitialAfterStep(prevStep);
        
        if (prevInterstitial) {
          // Show the interstitial that comes after the previous step
          set({ 
            showInterstitial: true,
            currentInterstitial: prevInterstitial,
            currentStep: prevStep,
            interstitialReady: false,
          });
        } else {
          // No interstitial after previous step, just go to it
          set({ currentStep: prevStep });
        }
      }
    }
  },
  
  activateAdvisor: () => {
    const state = get();
    console.log('=== Agent Created - Current States ===');
    console.log('Config:', state.config);
    console.log('Advisor Name:', state.config.advisorName);
    console.log('User Name:', state.userName);
    console.log('User Email:', state.userEmail);
    console.log('Current Step:', state.currentStep);
    console.log('Is Complete:', state.isComplete);
    console.log('Full State:', state);
    console.log('======================================');
    set({ isActivated: true });
  },
  
  reset: () => set({ 
    config: initialConfig, 
    currentStep: 'type', 
    isComplete: false, 
    isActivated: false,
    userName: null,
    userEmail: null,
    leadId: null,
    userId: null,
    showInterstitial: false,
    currentInterstitial: null,
    interstitialReady: true,
    isLeadReconnection: false,
    matchToDiscuss: null,
  }),

  logout: () => set({
    userId: null,
    userName: null,
    userEmail: null,
    leadId: null,
  }),
}),
    {
      name: 'acquiro-session',
      partialize: sessionPartialize,
    }
  )
);
