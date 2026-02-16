import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getSessionStatus } from '../../services/checkoutService';
import { motion } from 'framer-motion';

interface CheckoutCompleteProps {
  sessionId: string;
  onComplete?: () => void;
  onError?: () => void;
}

export function CheckoutComplete({ sessionId, onComplete, onError }: CheckoutCompleteProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    getSessionStatus(sessionId)
      .then((data) => {
        setStatus(data.status === 'complete' ? 'success' : 'error');
        if (data.status === 'complete' && onComplete) {
          onComplete();
        } else if (onError) {
          onError();
        }
      })
      .catch(() => {
        setStatus('error');
        if (onError) {
          onError();
        }
      });
  }, [sessionId, onComplete, onError]);

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
          {onError && (
            <button
              onClick={onError}
              className="px-6 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-colors"
            >
              Go Back
            </button>
          )}
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
          Your subscription is now active. You can start using all features immediately.
        </p>
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-accent text-black font-medium rounded-full hover:bg-accent/90 transition-colors"
          >
            Continue
          </button>
        )}
      </motion.div>
    </div>
  );
}
