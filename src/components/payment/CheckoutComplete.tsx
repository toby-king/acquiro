import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getSessionStatus } from '../../services/checkoutService';
import { createUser } from '../../services/userService';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { WhatsNextScreen } from '../onboarding/WhatsNextScreen';
import { motion } from 'framer-motion';

export function CheckoutComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { leadId, setUserId, userName, config } = useAdvisorStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [showWhatsNext, setShowWhatsNext] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    getSessionStatus(sessionId)
      .then(async (data) => {
        if (data.status === 'complete') {
          // Create user account in Bubble API after successful payment
          if (leadId) {
            try {
              console.log('[CheckoutComplete] Payment successful, creating user account in Bubble API for lead:', leadId);
              const userResult = await createUser(leadId);
              
              if (userResult?.user_id) {
                setUserId(userResult.user_id);
                console.log('[CheckoutComplete] ✅ User account created successfully in Bubble. User ID:', userResult.user_id);
              } else {
                console.error('[CheckoutComplete] ❌ Failed to create user account - no user_id returned from Bubble API');
                // Still proceed but log the error - user can contact support
              }
            } catch (error) {
              console.error('[CheckoutComplete] ❌ Error creating user account in Bubble API:', error);
              // Log detailed error for debugging
              if (error instanceof Error) {
                console.error('[CheckoutComplete] Error details:', error.message);
                console.error('[CheckoutComplete] Stack trace:', error.stack);
              }
              // Still proceed to success screen - payment was successful
              // User account creation can be retried manually if needed
            }
          } else {
            console.warn('[CheckoutComplete] ⚠️ Payment successful but no leadId found - cannot create user account in Bubble');
          }
          
          setStatus('success');
          // Show "What's Next" screen after brief success message
          setTimeout(() => {
            setShowWhatsNext(true);
          }, 2000);
        } else {
          console.error('[CheckoutComplete] Payment session status is not complete:', data.status);
          setStatus('error');
        }
      })
      .catch((error) => {
        console.error('[CheckoutComplete] Error verifying payment session:', error);
        setStatus('error');
      });
  }, [searchParams, navigate, leadId, setUserId]);

  // Show "What's Next" screen after successful payment
  if (showWhatsNext && status === 'success') {
    return (
      <WhatsNextScreen
        userName={userName || undefined}
        advisorName={config.advisorName || undefined}
        onContinue={() => navigate('/dashboard', { replace: true })}
      />
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Verifying your subscription...</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            We couldn't verify your subscription. Please contact support if you were charged.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome aboard!</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Your subscription is now active. Redirecting you to your dashboard...
        </p>
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      </motion.div>
    </div>
  );
}
