import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface FlyingParticle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  timestamp: number;
}

interface ParticleContextType {
  particles: FlyingParticle[];
  triggerParticle: (element: HTMLElement) => void;
  setOrbPosition: (x: number, y: number) => void;
  orbPosition: { x: number; y: number };
}

const ParticleContext = createContext<ParticleContextType | undefined>(undefined);

export function ParticleProvider({ children }: { children: ReactNode }) {
  const [particles, setParticles] = useState<FlyingParticle[]>([]);
  const [orbPosition, setOrbPositionState] = useState({ x: 0, y: 0 });

  const setOrbPosition = useCallback((x: number, y: number) => {
    setOrbPositionState({ x, y });
  }, []);

  const triggerParticle = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const particle: FlyingParticle = {
      id: `particle-${Date.now()}-${Math.random()}`,
      startX,
      startY,
      endX: orbPosition.x,
      endY: orbPosition.y,
      timestamp: Date.now(),
    };

    setParticles((prev) => [...prev, particle]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particle.id));
    }, 800);
  }, [orbPosition]);

  return (
    <ParticleContext.Provider value={{ particles, triggerParticle, setOrbPosition, orbPosition }}>
      {children}
    </ParticleContext.Provider>
  );
}

export function useParticles() {
  const context = useContext(ParticleContext);
  if (!context) {
    throw new Error('useParticles must be used within ParticleProvider');
  }
  return context;
}
