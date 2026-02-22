import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MatchesList } from './MatchesList';
import { AdvisorPanel } from './AdvisorPanel';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ThemeToggle } from '../layout/ThemeToggle';
import { motion } from 'framer-motion';
import { Phone, Settings, LogOut } from 'lucide-react';
import { getUser } from '../../services/userService';

export function Dashboard() {
  const navigate = useNavigate();
  const { userId, userName, setUserName, setUserEmail, logout } = useAdvisorStore();
  const fetchedUserIdRef = useRef<string | null>(null);

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
            acquiro<span className="text-accent">.</span>
          </Link>
          <h1 className="font-display font-bold text-xl lg:text-2xl text-[var(--text-primary)] hidden sm:block">
            Welcome back, {userName || 'there'}.
          </h1>
        </div>

        {/* Right side - Actions and Avatar */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={18} />
          </motion.button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
            aria-label="Logout"
            title="Logout"
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
          >
            <LogOut size={18} />
          </motion.button>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden ml-2">
            {/* Placeholder avatar - replace with actual user image */}
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm font-semibold">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
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
