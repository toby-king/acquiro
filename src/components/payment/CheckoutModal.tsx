import { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { X } from 'lucide-react';
import { createCheckoutSession, CreateCheckoutSessionParams } from '../../services/checkoutService';
import { motion, AnimatePresence } from 'framer-motion';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface CheckoutModalProps {
  billingPeriod: 'monthly' | 'annual';
  userId?: string;
  userEmail?: string;
  onClose: () => void;
}

export function CheckoutModal({
  billingPeriod,
  userId,
  userEmail,
  onClose,
}: CheckoutModalProps) {
  
  const fetchClientSecret = useCallback(async () => {
    if (!stripePublishableKey) {
      throw new Error('Stripe publishable key is not configured');
    }
    
    const params: CreateCheckoutSessionParams = {
      billingPeriod,
      userId,
      userEmail,
    };
    
    const { clientSecret } = await createCheckoutSession(params);
    return clientSecret;
  }, [billingPeriod, userId, userEmail]);

  if (!stripePromise) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Configuration Error
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Stripe publishable key is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] mx-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Complete your subscription
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Checkout Form */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
