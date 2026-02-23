export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;        // Total annual price
  annualMonthlyPrice: number; // Annual price divided by 12 (for display)
  currency: string;
  features: PlanFeature[];
  ctaText: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
  tooltip?: string;          // Optional explanation on hover
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'For serious acquirers ready to move fast',
    monthlyPrice: 1,
    annualPrice: 12,
    annualMonthlyPrice: 1,
    currency: 'GBP',
    ctaText: 'Get Started',
    features: [
      { text: 'Unlimited advisor conversations', included: true },
      { text: 'Enhanced deal flow (50 matches/month)', included: true },
      { text: 'Priority email & chat support', included: true },
      { text: 'Market insights reports', included: true },
      { text: 'Priority deal alerts', included: true },
      { text: 'Direct negotiation support', included: true },
      { text: 'Due diligence assistance', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. If you cancel, you\'ll retain access until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We use Stripe for secure payment processing. We accept Visa, Mastercard, American Express, Klarna, and Link. All payments are processed securely and encrypted.',
  },
  {
    question: 'What happens to my advisor if I cancel?',
    answer: 'Your advisor configuration is saved. If you resubscribe, you can pick up right where you left off.',
  },
];

export const ANNUAL_DISCOUNT_PERCENTAGE = 20;
