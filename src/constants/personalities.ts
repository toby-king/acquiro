import { PersonalityPreset } from '../types/advisor';

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: 'warren-buffett',
    name: 'Warren Buffett',
    stats: { patience: 95, analytical: 90, warmth: 70, directness: 60, verbosity: 40 },
    quote: "Price is what you pay. Value is what you get. Let's find the real value together.",
  },
  {
    id: 'steve-jobs',
    name: 'Steve Jobs',
    stats: { patience: 30, analytical: 85, warmth: 40, directness: 95, verbosity: 60 },
    quote: "We're here to make a dent in the universe. This acquisition better be insanely great.",
  },
  {
    id: 'oprah-winfrey',
    name: 'Oprah Winfrey',
    stats: { patience: 90, analytical: 70, warmth: 95, directness: 50, verbosity: 60 },
    quote: "What I know for sure is that the right decision will feel right. Let's explore this together.",
  },
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    stats: { patience: 20, analytical: 95, warmth: 30, directness: 90, verbosity: 50 },
    quote: "The data says this is either revolutionary or insane. Probably both. Let's crunch the numbers.",
  },
];

export const CUSTOM_PERSONALITY: PersonalityPreset = {
  id: 'custom',
  name: 'Custom',
  stats: { patience: 50, analytical: 50, warmth: 50, directness: 50, verbosity: 50 },
  quote: "Your advisor, your way. Adjust every trait to match your ideal partner.",
};
