import { PersonalityPreset } from '../types/advisor';

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: 'jeff-bezos',
    name: 'Jeff Bezos',
    stats: { patience: 80, analytical: 95, warmth: 45, directness: 75, verbosity: 35 },
    quote: "It's all about the long game. Let's work backwards from your perfect acquisition.",
  },
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    stats: { patience: 20, analytical: 95, warmth: 30, directness: 90, verbosity: 50 },
    quote: "The best deals are the ones everyone else thinks are crazy. Let's look at the fundamentals.",
  },
  {
    id: 'sara-blakely',
    name: 'Sara Blakely',
    stats: { patience: 75, analytical: 70, warmth: 90, directness: 65, verbosity: 55 },
    quote: "Every great business started with someone saying 'why not me?' Let's find yours.",
  },
  {
    id: 'richard-branson',
    name: 'Richard Branson',
    stats: { patience: 40, analytical: 55, warmth: 85, directness: 70, verbosity: 65 },
    quote: "Screw it, let's do it. But first, let's make sure the adventure is worth taking.",
  },
];

export const CUSTOM_PERSONALITY: PersonalityPreset = {
  id: 'custom',
  name: 'Custom',
  stats: { patience: 50, analytical: 50, warmth: 50, directness: 50, verbosity: 50 },
  quote: "Your advisor, your way. Adjust every trait to match your ideal partner.",
};
