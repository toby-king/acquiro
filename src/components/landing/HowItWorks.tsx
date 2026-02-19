import { Mic, Search, CheckCircle } from 'lucide-react';
import { Section, SectionLabel, SectionTitle, SectionDesc } from '../ui/Section';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import { Reveal } from '../ui/Reveal';

const steps = [
  {
    number: '01',
    icon: Mic,
    title: 'Build Your Agent',
    description: 'Configure your AI advisor with personality traits, communication style, and specific criteria for business acquisitions.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Automated Search',
    description: 'Your agent continuously scans multiple platforms, filters opportunities, and scores matches based on your preferences.',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Close With Confidence',
    description: 'Get detailed analysis, recommendations, and expert guidance to make informed acquisition decisions.',
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <div className="space-y-12">
        <div className="space-y-4">
          <Reveal delay={0}>
            <SectionLabel>Process</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>How It Works</SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <SectionDesc>
              Three simple steps to transform how you discover and evaluate acquisition opportunities.
            </SectionDesc>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={300 + index * 100}>
                <Card glowLine className="relative h-full">
                  {/* Step Number - Large faded accent text */}
                  <div className="absolute top-6 right-6 text-[4rem] font-bold text-accent/10 leading-none">
                    {step.number}
                  </div>

                  <div className="space-y-6 relative z-10">
                    <IconBadge size="md">
                      <Icon size={24} className="text-accent" />
                    </IconBadge>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">{step.title}</h3>
                      <p className="text-text-secondary leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
