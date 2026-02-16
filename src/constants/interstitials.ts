export type InterstitialId = 'after-type' | 'after-personality' | 'after-traits' | 'after-style';

export interface InterstitialContent {
  id: InterstitialId;
  icon?: string; // Lucide icon name, optional
  headline: string;
  body: string;
}

export const INTERSTITIALS: InterstitialContent[] = [
  {
    id: 'after-type',
    headline: "You're building something powerful",
    body: "Placeholder content about what makes Acquiro's advisors different. This will be replaced with actual sales copy later.",
  },
  {
    id: 'after-personality',
    headline: "Personality matters",
    body: "Placeholder content about why a personalized advisor is more effective than generic tools. Sales copy TBD.",
  },
  {
    id: 'after-traits',
    headline: "Tailored to you",
    body: "Placeholder content about the value of customization. Maybe stats about user success rates. Sales copy TBD.",
  },
  {
    id: 'after-style',
    headline: "Almost there",
    body: "Placeholder content building anticipation for the final step. Maybe mention what happens after creation. Sales copy TBD.",
  },
];

export function getInterstitialContent(id: InterstitialId): InterstitialContent | undefined {
  return INTERSTITIALS.find(i => i.id === id);
}

export function getInterstitialAfterStep(step: string): InterstitialId | null {
  const mapping: Record<string, InterstitialId> = {
    'type': 'after-type',
    'personality': 'after-personality',
    'traits': 'after-traits',
    'style': 'after-style',
  };
  return mapping[step] || null;
}

export function getInterstitialBeforeStep(step: string): InterstitialId | null {
  const mapping: Record<string, InterstitialId> = {
    'personality': 'after-type',
    'traits': 'after-personality',
    'style': 'after-traits',
    'voice': 'after-style',
  };
  return mapping[step] || null;
}
