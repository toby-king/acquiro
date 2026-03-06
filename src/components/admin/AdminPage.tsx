import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, Activity, Globe, LayoutDashboard, Settings, LogOut, Mail } from 'lucide-react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { ThemeToggle } from '../layout/ThemeToggle';
import './chartConfig';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminListingsTab } from './AdminListingsTab';
import { AdminAgentActivityTab } from './AdminAgentActivityTab';
import { AdminSourcesTab } from './AdminSourcesTab';
import { AdminLangcliffeTab } from './AdminLangcliffeTab';

type AdminTab = 'users' | 'listings' | 'activity' | 'sources' | 'langcliffe';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { userName, logout } = useAdvisorStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/"
            className="font-display font-bold text-lg sm:text-[1.6rem] text-[var(--text-primary)] flex-shrink-0 min-h-[44px] flex items-center"
          >
            <span className="relative inline-flex items-baseline">
              acquiro<span className="text-accent">.</span>
              <span className="absolute right-[-1em] bottom-[2.2em] font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-tertiary)]">BETA</span>
            </span>
          </Link>
          <span className="font-display font-bold text-lg sm:text-[1.6rem] text-[var(--text-primary)] italic">
            admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/dashboard"
            className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-accent hover:border-accent/50 hover:bg-[var(--bg-secondary)] transition-colors duration-200"
            aria-label="Dashboard"
          >
            <LayoutDashboard size={20} />
          </Link>
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
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors text-sm"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <button
                    type="button"
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
      </header>

      <nav className="border-b border-[var(--border)] px-4 sm:px-6">
        <div className="flex gap-1">
          {(
            [
              { id: 'users' as const, label: 'Users', icon: Users },
              { id: 'listings' as const, label: 'Listings', icon: FileText },
              { id: 'activity' as const, label: 'Agent Activity', icon: Activity },
              { id: 'sources' as const, label: 'Sources', icon: Globe },
              { id: 'langcliffe' as const, label: 'Langcliffe', icon: Mail },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'listings' && <AdminListingsTab />}
        {activeTab === 'activity' && <AdminAgentActivityTab />}
        {activeTab === 'sources' && <AdminSourcesTab />}
        {activeTab === 'langcliffe' && <AdminLangcliffeTab />}
      </main>
    </div>
  );
}
