export const ADVISOR_TYPES = [
  {
    id: 'mentor',
    name: 'Mentor',
    tagline: 'Patient guidance through every decision',
    description: 'Perfect for first-time acquirers. Your advisor will explain concepts, ask clarifying questions, and ensure you understand each step before moving forward.',
    icon: 'graduation-cap',
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    tagline: 'Adaptive intelligence that reads the room',
    description: 'Starts supportive, learns your style, and adjusts. Get guidance when you need it, speed when you don\'t.',
    icon: 'scale',
  },
  {
    id: 'workhorse',
    name: 'Workhorse',
    tagline: 'Maximum efficiency, minimum hand-holding',
    description: 'For experienced buyers who want powerful analysis without the preamble. Direct insights, rapid execution, advanced features unlocked.',
    icon: 'zap',
  },
] as const;
