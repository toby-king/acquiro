import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { cancelSubscription } from '../../services/checkoutService';
import { unsubscribeUser } from '../../services/userService';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsPage() {
  const navigate = useNavigate();
  const { userId, isSubscribed, subscriptionId, setSubscriptionStatus } = useAdvisorStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const canCancel = Boolean(isSubscribed && subscriptionId);
  const showUnableToManage = isSubscribed && !subscriptionId;

  const handleCancelClick = () => {
    setCancelError(null);
    setConfirmOpen(true);
  };

  const handleKeepSubscription = () => {
    setConfirmOpen(false);
    setCancelError(null);
  };

  const handleConfirmCancel = async () => {
    if (!subscriptionId || !userId) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelSubscription(subscriptionId);
    } catch (e) {
      setCancelError('Something went wrong. Please try again.');
      setCancelling(false);
      return;
    }
    try {
      await unsubscribeUser(userId);
    } catch {
      // Still update local state and redirect; Stripe/webhook can sync later
    }
    setSubscriptionStatus(false, null);
    setCancelling(false);
    setConfirmOpen(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">Settings</h1>
        <div className="w-[120px]" aria-hidden />
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-xl mx-auto w-full">
        {/* Subscription section */}
        <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Subscription</h2>
          {isSubscribed && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"
                  aria-hidden
                />
                <span className="text-[var(--text-primary)]">Active</span>
              </div>
              {showUnableToManage && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Unable to manage subscription. Please contact support.
                </p>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="min-h-[44px] px-5 py-2.5 rounded-full font-medium bg-red-600/90 text-white hover:bg-red-600 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </>
          )}
          {isSubscribed === false && (
            <p className="text-[var(--text-secondary)] text-sm">
              You are not currently subscribed. Subscribe from the dashboard to get full access.
            </p>
          )}
          {isSubscribed === null && (
            <p className="text-[var(--text-secondary)] text-sm">Checking subscription…</p>
          )}
        </section>
      </main>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={handleKeepSubscription}
              aria-hidden
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Are you sure you want to cancel?
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                  You'll lose access to your matched listings, advisor, and email alerts at the end of
                  your current billing period.
                </p>
                {cancelError && (
                  <p className="text-red-500 text-sm mb-4" role="alert">
                    {cancelError}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleKeepSubscription}
                    disabled={cancelling}
                    className="min-h-[44px] px-5 py-2.5 rounded-full font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors disabled:opacity-50"
                  >
                    Keep Subscription
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="min-h-[44px] px-5 py-2.5 rounded-full font-medium bg-red-600/90 text-white hover:bg-red-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling…
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
