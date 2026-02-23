import { useEffect, useState, useRef } from 'react';
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
  const { leadId: storeLeadId, setUserId, setLeadId, userName, config } = useAdvisorStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [showWhatsNext, setShowWhatsNext] = useState(false);
  /** Guard: only run create-user flow once per session (avoids duplicate calls when setLeadId triggers re-render) */
  const processedSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    getSessionStatus(sessionId)
      .then(async (data) => {
        if (data.status !== 'complete') {
          console.error('[CheckoutComplete] Payment session status is not complete:', data.status);
          setStatus('error');
          return;
        }

        // Only run create-user once per session (effect may re-run when we setLeadId)
        if (processedSessionIdRef.current === sessionId) {
          setStatus('success');
          return;
        }
        processedSessionIdRef.current = sessionId;

        // Use leadId from store (same tab) or from session metadata (returned from Stripe redirect)
        const leadId = storeLeadId ?? data.leadId ?? null;
        if (leadId && !storeLeadId) {
          setLeadId(leadId);
        }

        // Create user account in Bubble API after successful payment (once per session)
        if (leadId) {
          try {
            console.log('[CheckoutComplete] Payment successful, creating user account in Bubble API for lead:', leadId);
            const userResult = await createUser(leadId);
            
            if (userResult?.user_id) {
              setUserId(userResult.user_id);
              console.log('[CheckoutComplete] ✅ User account created. Stored userId for dashboard:', userResult.user_id);
            } else {
              console.error('[CheckoutComplete] ❌ No user_id returned from Bubble API');
            }
          } catch (error) {
            console.error('[CheckoutComplete] ❌ Error creating user account in Bubble API:', error);
            if (error instanceof Error) {
              console.error('[CheckoutComplete] Error details:', error.message);
            }
          }
        } else {
          console.warn('[CheckoutComplete] ⚠️ No leadId – cannot create user account in Bubble');
        }
        
        setStatus('success');
        setTimeout(() => setShowWhatsNext(true), 2000);
      })
      .catch((error) => {
        console.error('[CheckoutComplete] Error verifying payment session:', error);
        setStatus('error');
      });
  }, [searchParams, storeLeadId, setUserId, setLeadId]);

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
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h1>
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
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome aboard!</h1>
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
