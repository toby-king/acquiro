/**
 * Utility functions for consistent orb palette selection across the app
 */

const PALETTE_SETS = [
  ['#c6ff4a', '#10b981', '#0ea5e9', '#6366f1'],
  ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'],
  ['#06b6d4', '#8b5cf6', '#d946ef', '#f97316'],
  ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
  ['#f43f5e', '#fb923c', '#facc15', '#a3e635'],
  ['#c6ff4a', '#facc15', '#fb923c', '#f43f5e'],
];

// Profanity palette override — reds
export const PROFANITY_PALETTE = ['#ef4444', '#dc2626', '#f97316', '#fbbf24'];

// Default palette index (palette 1 - the purple/pink one)
const DEFAULT_PALETTE_INDEX = 1;

/**
 * Get the palette array based on allowProfanity setting
 * @param allowProfanity - Whether profanity is allowed
 * @param paletteIndex - Optional palette index (defaults to 1)
 * @returns The palette array to use
 */
export function getOrbPalette(allowProfanity: boolean, paletteIndex: number = DEFAULT_PALETTE_INDEX): string[] {
  if (allowProfanity) {
    return PROFANITY_PALETTE;
  }
  return PALETTE_SETS[paletteIndex % PALETTE_SETS.length];
}

/**
 * Get the palette index to use (for components that need the index)
 * @param allowProfanity - Whether profanity is allowed
 * @param paletteIndex - Optional palette index (defaults to 1)
 * @returns The palette index (or -1 if profanity palette)
 */
export function getPaletteIndex(allowProfanity: boolean, paletteIndex: number = DEFAULT_PALETTE_INDEX): number {
  if (allowProfanity) {
    return -1; // Special value indicating profanity palette
  }
  return paletteIndex % PALETTE_SETS.length;
}

export { PALETTE_SETS };
