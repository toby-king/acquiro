import { useCallback, useRef } from 'react';

/*
 * useAbsorption — same API as the original hook.
 *
 * Instead of creating DOM elements and CSS-transitioning them,
 * this dispatches a CustomEvent that AbsorptionCanvas listens for.
 * The canvas renders bezier-curved glowing particles that travel
 * to the orb, then dispatches 'orb-absorb' on arrival (which
 * AdvisorOrb listens for to trigger the absorb state).
 *
 * Usage unchanged:
 *   const { triggerAbsorption } = useAbsorption();
 *   triggerAbsorption(cardElement, 'personality-warren-buffett');
 */

export function useAbsorption() {
  const triggeredCards = useRef<Set<string>>(new Set());
  const currentSelections = useRef<Map<string, string>>(new Map());

  const triggerAbsorption = useCallback((sourceElement: HTMLElement | null, cardId?: string) => {
    if (!sourceElement) return;

    // Extract step from cardId (e.g., "type-mentor" -> "type")
    const step = cardId?.split('-')[0] || 'unknown';

    // Identifier logic — same as original
    const identifier =
      cardId ||
      sourceElement.getAttribute('data-card-id') ||
      sourceElement.id ||
      `card-${sourceElement.offsetTop}-${sourceElement.offsetLeft}`;

    // Allow re-selection of different card in same step
    const previousCardId = currentSelections.current.get(step);
    if (previousCardId && previousCardId !== identifier) {
      triggeredCards.current.delete(previousCardId);
    }

    // Skip if this exact card already triggered
    if (triggeredCards.current.has(identifier)) return;

    triggeredCards.current.add(identifier);
    currentSelections.current.set(step, identifier);

    // Get positions
    const sourceRect = sourceElement.getBoundingClientRect();
    const sx = sourceRect.left + sourceRect.width / 2;
    const sy = sourceRect.top + sourceRect.height / 2;

    const orbElement = document.querySelector('[data-orb]');
    if (!orbElement) return;

    const targetRect = orbElement.getBoundingClientRect();
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top + targetRect.height / 2;

    // Dispatch event for AbsorptionCanvas to pick up
    window.dispatchEvent(
      new CustomEvent('absorption-particle', {
        detail: { sx, sy, tx, ty, color: '#C6FF4A' },
      })
    );
  }, []);

  return { triggerAbsorption };
}
