import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { AdvisorOrb } from '../advisor/AdvisorOrb';
import { Reveal } from '../ui/Reveal';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]">
      {/* Radial gradient glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,255,74,0.15),transparent_70%)]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-12 py-[120px] flex flex-col lg:flex-row items-center gap-12">
        {/* Left Column - Content */}
        <div className="flex-1 flex flex-col items-start gap-8">

          {/* Headline */}
          <Reveal delay={100}>
            <h1 className="font-display font-bold text-[clamp(2.8rem,6vw,5.2rem)] leading-[1.1] tracking-tight text-[var(--text-primary)]">
              Find your perfect business <span className="italic text-accent">acquisition</span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={200}>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-[600px]">
              Build your AI advisor agent in minutes. Get personalized business recommendations, automated search, and expert guidance—all powered by conversational AI.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={300}>
            <Link to="/builder">
              <Button variant="primary" arrow>
                Create Your Agent
              </Button>
            </Link>
          </Reveal>

          {/* Stats */}
          <Reveal delay={400}>
            <div className="flex flex-wrap items-center gap-8 mt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[var(--text-primary)]">25,000+</span>
                <span className="text-sm text-[var(--text-secondary)]">Listings scanned daily</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[var(--text-primary)]">24/7</span>
                <span className="text-sm text-[var(--text-secondary)]">Availability</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[var(--text-primary)]">15 min</span>
                <span className="text-sm text-[var(--text-secondary)]">Setup Time</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right Column - AdvisorOrb */}
        <Reveal delay={500}>
          <div className="relative flex items-center justify-center">
            {/* Glow container */}
            <div className="absolute inset-0 animate-orb-glow-pulse">
              <div className="w-full h-full rounded-full bg-accent/15 blur-3xl" />
            </div>
            
            {/* Float container */}
            <div className="relative animate-orb-float">
              <AdvisorOrb 
                size={280} 
                paletteIndex={0}
                isActivated={true}
                intensity={100}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
