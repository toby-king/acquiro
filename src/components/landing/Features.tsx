import { MessageSquare, CreditCard, Mail, Gauge } from 'lucide-react';
import { Section, SectionLabel, SectionTitle, SectionDesc } from '../ui/Section';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import { Reveal } from '../ui/Reveal';

const features = [
  {
    icon: MessageSquare,
    title: 'Conversational AI Advisor',
    description: 'Chat naturally with your AI advisor. Ask questions, refine criteria, and get instant insights.',
  },
  {
    icon: CreditCard,
    title: 'Multi-Platform Aggregation',
    description: 'Your Advisor searches across all major UK business marketplaces and platforms daily, so you don\'t have to.',
  },
  {
    icon: Mail,
    title: 'Email Alerts & Reports',
    description: 'Receive daily summaries of new opportunities and discuss them with your advisor via email.',
  },
  {
    icon: Gauge,
    title: 'Automated Acquisition',
    description: 'Speed up your acquisiton process by taking the legwork out of finding the right business for you.',
  }
];

export function Features() {
  return (
    <Section id="features">
      <div className="space-y-12">
        <div className="space-y-4">
          <Reveal delay={0}>
            <SectionLabel>Capabilities</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>Powerful Features</SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <SectionDesc>
              Everything you need to discover, evaluate, and close your next business acquisition.
            </SectionDesc>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={300 + index * 50}>
                <Card className="h-full">
                  <div className="flex items-start gap-4">
                    <IconBadge size="sm">
                      <Icon size={20} className="text-accent" />
                    </IconBadge>
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                      <p className="text-text-secondary leading-relaxed">{feature.description}</p>
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
