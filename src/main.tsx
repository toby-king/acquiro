import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdvisorProvider } from './contexts/AdvisorContext';
import { ParticleProvider } from './contexts/ParticleContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AdvisorProvider>
        <ParticleProvider>
          <App />
        </ParticleProvider>
      </AdvisorProvider>
    </ThemeProvider>
  </StrictMode>
);
