import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { PRICING_PLANS } from '../../constants/pricing';
import { BillingToggle } from './BillingToggle';
import { PricingCard } from './PricingCard';
import { GuaranteeSection } from './GuaranteeSection';
import { FAQSection } from './FAQSection';

interface SubscriptionPageProps {
  advisorName?: string;
  onSelectPlan: (planId: string, billingPeriod: 'monthly' | 'annual') => void;
  onTalkToAdvisor?: () => void;
  onBack?: () => void;
}

export function SubscriptionPage({ advisorName, onSelectPlan, onTalkToAdvisor, onBack }: SubscriptionPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  
  const handleSelectPlan = (planId: string) => {
    onSelectPlan(planId, billingPeriod);
  };
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header with back button */}
      {onBack && (
        <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Back to Chat</span>
            </Button>
          </div>
        </header>
      )}
      
      {/* Hero Section */}
      <section className="pt-16 pb-12 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-white"
        >
          Unlock {advisorName ? `${advisorName}'s` : 'Your Advisor\'s'} Full Potential
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto"
        >
          Get personalized deal flow, expert guidance, and everything you need to find and acquire the perfect business.
        </motion.p>
      </section>
      
      {/* Billing Toggle */}
      <section className="pb-12 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BillingToggle 
            billingPeriod={billingPeriod} 
            onChange={setBillingPeriod} 
          />
        </motion.div>
      </section>
      
      {/* Pricing Cards */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-start">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            >
              <PricingCard
                plan={plan}
                billingPeriod={billingPeriod}
                onSelect={handleSelectPlan}
              />
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Trust/Guarantee Section */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <GuaranteeSection />
          </motion.div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="pb-16 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <FAQSection />
        </motion.div>
      </section>
      
      {/* Final CTA */}
      <section className="pb-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="max-w-xl mx-auto p-8 rounded-2xl bg-gray-900/50 border border-gray-800"
        >
          <h3 className="text-xl font-semibold text-white">Still have questions?</h3>
          <p className="mt-2 text-gray-400">
            {advisorName ? `${advisorName} is` : 'Your advisor is'} here to help you choose the right plan.
          </p>
          {onTalkToAdvisor && (
            <button
              onClick={onTalkToAdvisor}
              className="mt-6 px-6 py-3 bg-accent text-black font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Talk to {advisorName || 'Your Advisor'}
            </button>
          )}
        </motion.div>
      </section>
    </div>
  );
}
