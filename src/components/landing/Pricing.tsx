import { Check } from 'lucide-react';
import { Section, SectionLabel, SectionTitle, SectionDesc } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const plans = [
  {
    name: 'Professional',
    price: '£1',
    period: '/mo',
    description: 'For serious acquirers',
    features: [
      
    ],
    featured: true,
  }
];

export function Pricing() {
  return (
    <Section id="pricing">
      <div className="space-y-12">
        <div className="space-y-4 text-center">
          <Reveal delay={0}>
            <SectionLabel>Pricing</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>Pricing</SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <SectionDesc className="mx-auto">
              Traditional M&A advisors charge £10,000+ upfront. Your advisor costs less than lunch.
            </SectionDesc>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full md:max-w-[50%] md:mx-auto">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={300 + index * 100}>
              <Card
                className={cn(
                  'h-full flex flex-col',
                  plan.featured && 'border-accent shadow-accent-glow'
                )}
              >
                {plan.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-semibold bg-accent text-bg-primary rounded-pill">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{plan.name}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                    {plan.period && (
                      <span className="text-[var(--text-secondary)]">{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check size={18} className="text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-[var(--text-secondary)] text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link to="/builder">
                    <Button
                      variant={plan.featured ? 'primary' : 'secondary'}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
