import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

export function CTA() {
  return (
    <section className="relative py-[120px] px-12 overflow-hidden">
      {/* Radial gradient glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,255,74,0.15),transparent_70%)]" />

      <div className="relative z-10 max-w-[1200px] mx-auto text-center space-y-8">
        <Reveal delay={0}>
          <h2 className="font-display font-bold text-[clamp(2rem,4vw,3.5rem)] leading-[1.15] tracking-tight text-[var(--text-primary)]">
            Your next acquisition starts with an agent
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <Link to="/builder">
            <Button variant="primary" arrow className="text-lg px-12 py-5">
              Create Your Agent
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
