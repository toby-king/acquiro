import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MatchesList } from './MatchesList';
import { AdvisorPanel } from './AdvisorPanel';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ThemeToggle } from '../layout/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, LogOut } from 'lucide-react';
import { getUser } from '../../services/userService';

export function Dashboard() {
  const navigate = useNavigate();
  const { userId, userName, setUserName, setUserEmail, logout } = useAdvisorStore();
  const fetchedUserIdRef = useRef<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || fetchedUserIdRef.current === userId) return;
    fetchedUserIdRef.current = userId;
    getUser(userId)
      .then(({ name, email }) => {
        if (name) setUserName(name);
        if (email) setUserEmail(email);
      })
      .catch((err) => console.error('[Dashboard] Failed to fetch user profile:', err));
  }, [userId, setUserName, setUserEmail]);

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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col overflow-x-hidden">
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
            acquiro<span className="inline-flex flex-col items-center leading-none">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-tertiary)]">BETA</span>
              <span className="text-accent">.</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-xl lg:text-2xl text-[var(--text-primary)] hidden sm:block">
            Welcome back, {userName || 'there'}.
          </h1>
        </div>

        {/* Right side - Theme and Profile */}
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

      {/* Main Content - 50/50 Split */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left - Matches (50%) */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-20 md:pb-8 relative min-w-0">
          {/* Divider - 70% height */}
          <div className="hidden lg:block absolute right-0 top-[15%] bottom-[15%] w-px bg-[var(--border)]" />
          
          {/* Matches Section */}
          <MatchesList />
        </div>

        {/* Right Panel - Advisor (50%, centered vertically) */}
        <div className="flex-1 flex items-center justify-center lg:block">
          <AdvisorPanel />
        </div>
      </div>

      {/* Mobile: Floating Call Button */}
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
    </div>
  );
}
