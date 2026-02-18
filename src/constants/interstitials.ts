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
    headline: "You're building something powerful.",
    body: "Most people search blind. By telling us what you're looking for, your advisor can filter tens of thousands of live listings down to only the ones worth your attention.",
  },
  {
    id: 'after-personality',
    headline: "Your advisor. Your rules.",
    body: "Whether you want to be challenged or guided, your advisor adapts to how you think — so every conversation moves you closer to the right deal, not just any deal.",
  },
  {
    id: 'after-traits',
    headline: "This is what having a personal advisor feels like.",
    body: "Available 24/7, backed by real acquisition expertise, and built around your unique criteria. It's not just about finding deals, it's about finding the right deal for you.",
  },
  {
    id: 'after-style',
    headline: "You're already ahead of most buyers.",
    body: "Your advisor is almost ready. You're about to save yourself a lot of time and effort by having your advisor do the heavy lifting for you.",
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
