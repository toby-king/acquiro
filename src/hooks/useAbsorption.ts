import { useCallback, useRef } from 'react';

export function useAbsorption() {
  const triggeredCards = useRef<Set<string>>(new Set());
  const currentSelections = useRef<Map<string, string>>(new Map()); // step -> cardId
  
  const triggerAbsorption = useCallback((sourceElement: HTMLElement | null, cardId?: string) => {
    if (!sourceElement) return;
    
    // Extract step from cardId (e.g., "type-mentor" -> "type", "personality-warren-buffett" -> "personality")
    const step = cardId?.split('-')[0] || 'unknown';
    
    // Use cardId if provided, otherwise use element's data-card-id attribute or generate from element
    const identifier = cardId || sourceElement.getAttribute('data-card-id') || sourceElement.id || `card-${sourceElement.offsetTop}-${sourceElement.offsetLeft}`;
    
    // Check if a different card was previously selected in this step
    const previousCardId = currentSelections.current.get(step);
    if (previousCardId && previousCardId !== identifier) {
      // Reset the previous card's particle state
      triggeredCards.current.delete(previousCardId);
    }
    
    // Check if this card has already triggered absorption
    if (triggeredCards.current.has(identifier)) {
      return; // Skip if already triggered
    }
    
    // Mark this card as triggered and update current selection for this step
    triggeredCards.current.add(identifier);
    currentSelections.current.set(step, identifier);
    
    // Create a particle element
    const particle = document.createElement('div');
    particle.className = 'absorption-particle';
    particle.style.cssText = `
      position: fixed;
      width: 28px;
      height: 28px;
      background: #C6FF4A;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 30px #C6FF4A, 0 0 60px rgba(198, 255, 74, 0.6), 0 0 90px rgba(198, 255, 74, 0.3);
    `;
    
    // Get source and target positions
    const sourceRect = sourceElement.getBoundingClientRect();
    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    
    // Find the orb element (assuming it has a specific class/id)
    const orbElement = document.querySelector('[data-orb]');
    if (!orbElement) return;
    
    const targetRect = orbElement.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    // Set initial position
    particle.style.left = `${sourceX}px`;
    particle.style.top = `${sourceY}px`;
    document.body.appendChild(particle);
    
    // Animate to orb
    requestAnimationFrame(() => {
      particle.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      particle.style.left = `${targetX}px`;
      particle.style.top = `${targetY}px`;
      particle.style.transform = 'scale(0)';
      
      // Trigger ripple effect on orb
      setTimeout(() => {
        orbElement.classList.add('orb-ripple');
        setTimeout(() => {
          orbElement.classList.remove('orb-ripple');
        }, 600);
      }, 500);
      
      // Remove particle
      setTimeout(() => {
        particle.remove();
      }, 600);
    });
  }, []);
  
  return { triggerAbsorption };
}
