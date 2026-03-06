import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MatchesList } from './MatchesList';
import { AdvisorPanel } from './AdvisorPanel';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ThemeToggle } from '../layout/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, LogOut, Loader2, Settings, X, Shield } from 'lucide-react';
import { getUser } from '../../services/userService';

type SubscriptionCheckStatus = 'loading' | 'subscribed' | 'unsubscribed';

export function Dashboard() {
  const navigate = useNavigate();
  const { userId, userName, isSubscribed: storeSubscribed, subscriptionId: storeSubscriptionId, cancelAt: storeCancelAt, isAdmin, setUserName, setUserEmail, setSubscriptionStatus, setAdmin, logout } = useAdvisorStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  // If store already has subscribed + subscriptionId, start as subscribed so we don't flash the overlay while refetching
  const [subscriptionCheckStatus, setSubscriptionCheckStatus] = useState<SubscriptionCheckStatus>(
    () => (userId && storeSubscribed === true && storeSubscriptionId ? 'subscribed' : 'loading')
  );
  const [cancelBannerDismissed, setCancelBannerDismissed] = useState(false);

  // Subscription check + user profile: run on every dashboard mount so we re-check after returning from /offer
  useEffect(() => {
    if (!userId) return;
    // Only show loading if we don't have a clear subscribed state in store
    if (!(storeSubscribed === true && storeSubscriptionId)) {
      setSubscriptionCheckStatus('loading');
    }

    getUser(userId)
      .then(({ name, email, isSubscribed, subscriptionId, cancelAt, isAdmin: userIsAdmin }) => {
        if (name) setUserName(name);
        if (email) setUserEmail(email);
        setSubscriptionStatus(isSubscribed, subscriptionId, cancelAt ?? null);
        setAdmin(userIsAdmin);
        setSubscriptionCheckStatus(isSubscribed ? 'subscribed' : 'unsubscribed');
      })
      .catch((err) => {
        console.error('[Dashboard] Failed to fetch user / subscription status:', err);
        // Don't treat API failure as unsubscribed if we have a valid subscription in store (avoids locking user out)
        if (storeSubscribed === true && storeSubscriptionId) {
          setSubscriptionCheckStatus('subscribed');
        } else {
          setSubscriptionCheckStatus('unsubscribed');
        }
      });
  }, [userId, setUserName, setUserEmail, setSubscriptionStatus, setAdmin, storeSubscribed, storeSubscriptionId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  if (subscriptionCheckStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Checking subscription...</p>
      </div>
    );
  }

  const showSubscriptionOverlay = subscriptionCheckStatus === 'unsubscribed';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col overflow-x-hidden relative">
      {/* Subscription required overlay (not dismissable) */}
      {showSubscriptionOverlay && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-[8px] bg-[var(--bg-primary)]/60"
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl p-8 text-center">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                Subscription Required
              </h2>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                Subscribe to unlock full access to your matched listings, advisor, and email alerts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/offer"
                  className="min-h-[44px] px-6 py-3 rounded-full font-medium bg-accent text-black hover:bg-accent/90 transition-colors inline-flex items-center justify-center"
                >
                  Subscribe
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className="min-h-[44px] px-6 py-3 rounded-full font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[var(--border)]"
      >
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          {/* Logo */}
          <Link to="/" className="font-display font-bold text-lg sm:text-[1.6rem] text-[var(--text-primary)] flex-shrink-0 min-h-[44px] flex items-center">
            <span className="relative inline-flex items-baseline">
              acquiro<span className="text-accent">.</span>
              <span className="absolute right-[-1em] bottom-[2.2em] font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-tertiary)]">BETA</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-xl lg:text-2xl text-[var(--text-primary)] hidden sm:block">
            Welcome back, {userName || 'there'}.
          </h1>
        </div>

        {/* Right side - Theme, Admin (if admin), Profile */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* User Profile - Avatar with dropdown */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen((o) => !o)}
              className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <span className="text-gray-400 text-sm font-semibold">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </motion.button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 py-1 min-w-[160px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] shadow-lg z-50"
                >
                  {isAdmin === true && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors text-sm"
                      >
                        <Shield size={16} />
                        Admin panel
                      </Link>
                      <div className="my-1 border-t border-[var(--border)]" />
                    </>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors text-sm"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/', { replace: true });
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors text-sm"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Cancellation banner: subscribed but cancelling at period end */}
      {!showSubscriptionOverlay && storeCancelAt && !cancelBannerDismissed && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-[var(--text-primary)] flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm flex-1 min-w-0">
            Your subscription will end on{' '}
            <time dateTime={storeCancelAt}>
              {new Date(storeCancelAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            . You'll lose access to matches and email alerts after this date.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/offer"
              className="min-h-[40px] px-4 py-2 rounded-full font-medium bg-accent text-black hover:bg-accent/90 transition-colors inline-flex items-center justify-center text-sm whitespace-nowrap"
            >
              Resubscribe
            </Link>
            <button
              type="button"
              onClick={() => setCancelBannerDismissed(true)}
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-amber-500/20 transition-colors"
              aria-label="Dismiss banner"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content - 50/50 Split (only when subscribed; no API calls when unsubscribed) */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {showSubscriptionOverlay ? (
          <div className="flex-1 flex items-center justify-center min-h-[40vh] text-[var(--text-tertiary)] text-sm">
            Subscribe to view your matches and advisor.
          </div>
        ) : (
          <>
            {/* Left - Matches (50%) */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-20 md:pb-8 relative min-w-0">
              {/* Divider - 70% height */}
              <div className="hidden lg:block absolute right-0 top-[15%] bottom-[15%] w-px bg-[var(--border)]" />

              <MatchesList />
            </div>

            {/* Right Panel - Advisor (50%, centered vertically) */}
            <div className="flex-1 flex items-center justify-center lg:block">
              <AdvisorPanel />
            </div>
          </>
        )}
      </div>

      {/* Mobile: Floating Call Button - only when subscribed */}
      {!showSubscriptionOverlay && (
        <div className="lg:hidden fixed bottom-20 right-6 z-50">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg hover:bg-accent/90 transition-colors"
            title="Call Agent"
          >
            <Phone className="w-6 h-6 text-black" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
