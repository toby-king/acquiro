import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { PRICING_PLANS } from '../../constants/pricing';
import { GuaranteeSection } from './GuaranteeSection';
import { FAQSection } from './FAQSection';
import { createCheckoutSession, CreateCheckoutSessionParams } from '../../services/checkoutService';
import { AdvisorOrb } from '../advisor/AdvisorOrb';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface SubscriptionPageProps {
  advisorName?: string;
  onSelectPlan: (planId: string, billingPeriod: 'monthly' | 'annual') => void;
  onTalkToAdvisor?: () => void;
  onBack?: () => void;
}

export function SubscriptionPage({ advisorName, onSelectPlan, onTalkToAdvisor, onBack }: SubscriptionPageProps) {
  const { leadId, userEmail, config } = useAdvisorStore();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const clientSecretRef = useRef<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setCheckoutError(null);
    setIsLoadingCheckout(true);
    if (onSelectPlan) onSelectPlan(planId, billingPeriod);

    try {
      const params: CreateCheckoutSessionParams = {
        billingPeriod,
        userId: leadId || undefined,
        userEmail: userEmail || undefined,
      };
      const { clientSecret } = await createCheckoutSession(params);
      clientSecretRef.current = clientSecret;
      setShowCheckout(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCheckoutError(msg);
      console.error('[SubscriptionPage] createCheckoutSession failed:', err);
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const fetchClientSecret = useCallback(async () => {
    if (clientSecretRef.current) return clientSecretRef.current;
    const params: CreateCheckoutSessionParams = {
      billingPeriod,
      userId: leadId || undefined,
      userEmail: userEmail || undefined,
    };
    const { clientSecret } = await createCheckoutSession(params);
    clientSecretRef.current = clientSecret;
    return clientSecret;
  }, [billingPeriod, leadId, userEmail]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between min-w-0">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Back to Chat</span>
          </Button>
        </div>
      </header>
      
      {/* NEW Hero Section — Narrative Opening */}
      <section className="max-w-[640px] mx-auto pt-16 pb-0 px-4 sm:px-6 text-center min-w-0">
        {/* Advisor Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-7"
        >
          <AdvisorOrb
            intensity={100}
            isActivated={true}
            size={64}
            allowProfanity={config?.allowProfanity || false}
          />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-serif text-3xl md:text-[42px] font-normal leading-[1.25] mb-5 text-[var(--text-primary)]"
        >
          {advisorName || 'Your advisor'} found <em className="italic text-[var(--accent)]">53 potential deals</em> while you were reading this.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base text-[var(--text-secondary)] leading-relaxed max-w-[520px] mx-auto"
        >
          That's what happens when an AI works 24/7 on your acquisition criteria. 
          We've built the toolkit that traditional M&A advisors charge five figures for. Yours costs less than a weekly coffee run.
        </motion.p>
      </section>

      {/* NEW Stat Cards Row */}
      <section className="max-w-[640px] mx-auto px-4 sm:px-6 pt-14 pb-16 border-b border-[var(--border)] min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { num: '53', label: 'matches found\nfor your criteria' },
            { num: '127', label: 'listed in the\nlast 7 days' },
            { num: '8', label: 'acquisitions made\nin the last 2 months' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 text-center"
            >
              <div className="font-serif text-5xl font-medium text-[var(--accent)] leading-none mb-1.5">
                {stat.num}
              </div>
              <div className="text-medium text-[var(--text-tertiary)] leading-snug whitespace-pre-line">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Card */}
      <section className="pb-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-[640px] mx-auto"
        >
          {/* Billing Toggle */}
          <div className="mt-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-12 h-6 rounded-full bg-gray-800 border border-gray-700 transition-colors overflow-hidden flex items-center justify-center"
              >
                <div
                  className={`absolute top-1/2 left-0.5 w-5 h-5 -translate-y-1/2 rounded-full bg-[var(--accent)] transition-transform ${billingPeriod === 'annual' ? 'translate-x-[26px]' : 'translate-x-0'}`}
                />
              </button>
              <span className={`text-sm ${billingPeriod === 'annual' ? 'text-white' : 'text-gray-500'}`}>Annual</span>
            </div>
            {billingPeriod === 'annual' && (
              <div className="flex justify-center">
                <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] overflow-hidden relative">
            
            {/* Accent top edge */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />

            {/* Top: Price + CTA */}
            <div className="px-6 md:px-10 pt-9 md:pt-11 pb-9 text-center relative">
              {/* Subtle glow */}
              <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 w-[320px] h-[180px] bg-[radial-gradient(ellipse,rgba(198,255,74,0.06),transparent_70%)] pointer-events-none" />
              
              <div className="font-mono text-m tracking-[2.5px] uppercase text-[var(--text-tertiary)] mb-5 relative">
                Professional
              </div>
              
              <div className="flex items-baseline justify-center gap-0.5 mb-1.5 relative">
                <span className="font-serif text-[32px] text-[var(--accent)]">£</span>
                <span className="font-serif text-[76px] leading-none text-white">
                  {billingPeriod === 'monthly' ? PRICING_PLANS[0].monthlyPrice : Math.round(PRICING_PLANS[0].annualMonthlyPrice)}
                </span>
                <span className="text-xl text-gray-500 ml-1 self-end mb-3">/mo</span>
              </div>
              
              <p className="text-[15px] text-gray-500 mb-7 relative">
                Traditional M&A advisors charge <strong className="text-gray-300">£10,000+</strong> upfront.
                <br />Your advisor costs less than lunch.
              </p>
              
              <AnimatePresence mode="wait">
                {!showCheckout ? (
                  <motion.div
                    key="button"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      onClick={() => handleSelectPlan(PRICING_PLANS[0].id)}
                      disabled={isLoadingCheckout}
                      className="w-full max-w-[360px] mx-auto block min-h-[44px] py-[18px] bg-[var(--accent)] text-black rounded-full font-bold text-[17px] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(198,255,74,0.2)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoadingCheckout ? 'Connecting...' : 'Activate Your Advisor'}
                    </button>
                    {checkoutError && (
                      <p className="mt-3 text-red-400 text-sm max-w-[360px] mx-auto">
                        {checkoutError}
                      </p>
                    )}
                    
                    <p className="text-[13px] text-gray-600 mt-3.5 relative">
                      Cancel anytime · No contracts · 30-day guarantee
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="checkout"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    {stripePromise ? (
                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowCheckout(false);
                            setCheckoutError(null);
                            clientSecretRef.current = null;
                          }}
                          className="absolute top-0 right-0 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-colors z-10"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="min-h-[600px]">
                          <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ fetchClientSecret }}
                          >
                            <EmbeddedCheckout />
                          </EmbeddedCheckoutProvider>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[var(--text-secondary)] mb-4">
                          Stripe publishable key is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.
                        </p>
                        <button
                          onClick={() => setShowCheckout(false)}
                          className="px-4 py-2 bg-[var(--accent)] text-black font-medium rounded-full hover:bg-[var(--accent)]/90 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-[var(--border)] mx-6 md:mx-10" />

            {/* Bottom: Features grid */}
            <div className="px-6 md:px-10 pt-8 pb-10">
              <div className="font-mono text-[10px] tracking-[2.5px] uppercase text-gray-700 mb-6">
                Everything included
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2">
                {[
                  { name: 'Dedicated Custom AI Advisor', desc: 'Personalised to your criteria, industry & style' },
                  { name: '25,000+ Listings', desc: 'Every major UK platform, scanned daily' },
                  { name: 'Voice Call Access', desc: 'Talk through matches with your advisor, anytime' },
                  { name: 'Smart Match Alerts', desc: 'Notified the moment a deal lists' },
                  { name: 'Email Conversations', desc: 'Chat with your advisor about matches via email' },
                  { name: '24/7 M&A Expertise', desc: 'Backed by acquisition experts, ready to answer your queries' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className={`flex items-start gap-3 py-4 border-b border-white/[0.03]
                      ${i % 2 === 0 ? 'md:border-r md:border-r-white/[0.03] md:pr-6' : 'md:pl-6'}
                      ${i >= 4 ? 'border-b-0' : ''}
                    `}
                  >
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">{feature.name}</div>
                      <div className="text-[13px] text-gray-500 leading-snug mt-0.5">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social proof bar */}
            <div className="bg-[var(--bg-card)] border-t border-[var(--border)] px-6 md:px-10 py-4 flex items-center justify-center gap-2.5">
              <div className="flex">
                {['T', 'M', 'S', 'R'].map((letter, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-[var(--bg-secondary)] flex items-center justify-center text-[9px] font-bold text-[var(--accent)] bg-[var(--accent)]/10"
                    style={{ marginLeft: i > 0 ? '-5px' : 0 }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                <strong className="text-gray-300 font-semibold">27 buyers</strong> activated this month
              </span>
            </div>

          </div>
        </motion.div>
      </section>
      
      {/* Guarantee Section */}
      <section className="pb-16 px-4">
        <div className="max-w-[920px] mx-auto">
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
          className="max-w-xl mx-auto"
        >
          <Card className="p-8">
            <h3 className="text-xl font-semibold text-white">Still have questions?</h3>
            <p className="mt-2 text-gray-400">
              {advisorName ? `${advisorName} is` : 'Your advisor is'} here to help.
            </p>
            {onTalkToAdvisor && (
              <button
                onClick={onTalkToAdvisor}
                className="mt-6 px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-colors"
              >
                Talk to {advisorName || 'Your Advisor'}
              </button>
            )}
          </Card>
        </motion.div>
      </section>
      
    </div>
  );
}
