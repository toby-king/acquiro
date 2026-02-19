import { MessageSquare, CreditCard, CheckCircle2, Mail, Shield, MessageSquare as MessagesSquare } from 'lucide-react';
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
    description: 'Search across multiple business marketplaces and platforms simultaneously from one interface.',
  },
  {
    icon: CheckCircle2,
    title: 'Smart Match Scoring',
    description: 'AI-powered scoring algorithm evaluates each opportunity against your specific criteria.',
  },
  {
    icon: Mail,
    title: 'Email Alerts & Reports',
    description: 'Receive daily or weekly summaries of new matches and detailed analysis reports.',
  },
  {
    icon: Shield,
    title: 'Confidential & Secure',
    description: 'Your data and search criteria are encrypted and never shared with third parties.',
  },
  {
    icon: MessagesSquare,
    title: 'Discovery Calls',
    description: 'Schedule voice calls with your advisor for deeper discussions and strategy sessions.',
  },
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

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={300 + index * 50}>
                <Card className="h-full">
                  <div className="flex items-start gap-4">
                    <IconBadge size="sm">
                      <Icon size={20} className="text-accent" />
                    </IconBadge>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h3>
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
