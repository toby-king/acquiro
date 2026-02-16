export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;        // Total annual price
  annualMonthlyPrice: number; // Annual price divided by 12 (for display)
  currency: string;
  features: PlanFeature[];
  highlighted?: boolean;      // For "Most Popular" styling
  ctaText: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
  tooltip?: string;          // Optional explanation on hover
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For those just beginning their acquisition journey',
    monthlyPrice: 49,
    annualPrice: 470,
    annualMonthlyPrice: 39,
    currency: 'GBP',
    ctaText: 'Start Free Trial',
    features: [
      { text: 'Unlimited advisor conversations', included: true },
      { text: 'Basic deal flow (10 matches/month)', included: true },
      { text: 'Email support', included: true },
      { text: 'Market insights reports', included: true },
      { text: 'Priority deal alerts', included: false },
      { text: 'Direct negotiation support', included: false },
      { text: 'Due diligence assistance', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For serious acquirers ready to move fast',
    monthlyPrice: 149,
    annualPrice: 1430,
    annualMonthlyPrice: 119,
    currency: 'GBP',
    highlighted: true,
    ctaText: 'Start Free Trial',
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
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-service acquisition support',
    monthlyPrice: 399,
    annualPrice: 3830,
    annualMonthlyPrice: 319,
    currency: 'GBP',
    ctaText: 'Contact Sales',
    features: [
      { text: 'Unlimited advisor conversations', included: true },
      { text: 'Unlimited deal flow', included: true },
      { text: '24/7 priority support', included: true },
      { text: 'Market insights reports', included: true },
      { text: 'Priority deal alerts', included: true },
      { text: 'Direct negotiation support', included: true },
      { text: 'Due diligence assistance', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. If you cancel, you\'ll retain access until the end of your current billing period.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all plans include a 14-day free trial. No credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, Amex) and can arrange invoicing for Enterprise plans.',
  },
  {
    question: 'Can I change plans later?',
    answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.',
  },
  {
    question: 'What happens to my advisor if I cancel?',
    answer: 'Your advisor configuration is saved. If you resubscribe, you can pick up right where you left off.',
  },
];

export const ANNUAL_DISCOUNT_PERCENTAGE = 20;
