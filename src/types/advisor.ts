export type AdvisorType = 'mentor' | 'workhorse' | 'hybrid';

export interface PersonalityPreset {
  id: string;
  name: string;
  stats: {
    patience: number;
    analytical: number;
    warmth: number;
    directness: number;
    verbosity: number;
  };
  quote: string;
  icon?: string;
}

export interface TraitSelection {
  embrace: string[];  // max 5
  avoid: string[];    // max 5
}

export type ChallengeStyle = 
  | 'yes-person' 
  | 'supportive-challenger' 
  | 'devils-advocate' 
  | 'tough-love' 
  | 'ruthless-critic';

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  sampleQuote: string;
  waveformData?: number[];
}

export interface AdvisorConfig {
  type: AdvisorType | null;
  personality: PersonalityPreset | null;
  customStats: PersonalityPreset['stats'] | null;
  traits: TraitSelection;
  challengeStyle: ChallengeStyle | null;
  challengeLevel: number; // 0-100
  voice: VoiceOption | null;
  allowProfanity: boolean;
  advisorName: string | null;
}

export type WizardStep = 'type' | 'personality' | 'traits' | 'style' | 'voice';
