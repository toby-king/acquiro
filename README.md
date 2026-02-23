# Acquiro Advisor Builder

A production-ready React application for building personalized M&A advisor agents through an intuitive multi-step wizard interface.

## Features

- 🎨 **Beautiful UI** - Modern, clean interface with smooth animations
- 🌓 **Dark/Light Theme** - Toggle between themes with persistent preferences
- ✨ **Animated Orb** - Interactive particle-based visualization that responds to configuration
- 📊 **5-Step Wizard** - Guided configuration process:
  1. **Type Selection** - Choose Mentor, Workhorse, or Hybrid
  2. **Personality** - Select preset personalities or customize traits
  3. **Traits** - Define traits to embrace and avoid
  4. **Challenge Style** - Set how much pushback you want
  5. **Voice** - Choose communication style and voice
- 💬 **Chat Interface** - Post-activation chat interface with typing indicators
- 🎭 **Birth Animation** - Spectacular animation sequence when activating your advisor
- 📱 **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- ♿ **Accessible** - WCAG AA compliant with keyboard navigation and screen reader support

## Tech Stack

- **React 18+** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploying to Vercel (acquirolabs.vercel.app)

1. Connect the repo to a Vercel project (frontend).
2. Set **Environment Variables** for Production (and Preview if needed):
   - `VITE_API_URL` = `https://acquiro-backend.vercel.app` (so checkout and session-status use the backend)
   - All other `VITE_*` vars (Bubble, OpenAI, ElevenLabs, Stripe publishable key).
3. Build Command: `npm run build`, Output Directory: `dist`.
4. The app will call the backend at `https://acquiro-backend.vercel.app` when `VITE_API_URL` is set or when running in production (fallback).

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── advisor/         # Advisor-specific components (orb, stats, etc.)
│   ├── steps/           # Wizard step components
│   ├── chat/            # Chat interface components
│   └── layout/          # Layout components (header, navigation)
├── hooks/               # Custom React hooks
├── constants/           # Configuration constants
├── types/               # TypeScript type definitions
├── utils/               # Utility functions and animations
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Key Components

### AdvisorOrb
The central animated orb visualization with particle effects. Responds to configuration progress and activation state.

### Step Components
Each step (`TypeStep`, `PersonalityStep`, etc.) follows a consistent pattern with selection cards, animations, and absorption effects.

### BirthAnimation
Multi-phase animation sequence that plays when activating the advisor:
1. Anticipation - UI fades, particles drift
2. Awakening - Light burst and energy rays
3. Stabilization - Orb settles into active state
4. Transition - Moves to chat interface

## State Management

The application uses Zustand for global state management. The `useAdvisorStore` hook provides:
- Configuration state (type, personality, traits, etc.)
- Step navigation
- Activation state
- Actions to update configuration

## Theming

The app supports dark and light themes with CSS custom properties. Theme preference is persisted in localStorage.

## Future Integration Points

The codebase is structured to easily integrate:
- **ElevenLabs API** - Voice preview and chat
- **Backend API** - Save/load configurations, authentication
- **Analytics** - Track user behavior and selections

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint configured for React best practices
- Prettier recommended for code formatting

### Adding New Steps
1. Add step type to `types/advisor.ts`
2. Create step component in `components/steps/`
3. Add to step order in `hooks/useStepNavigation.ts`
4. Add step component to `App.tsx`

## License

MIT
