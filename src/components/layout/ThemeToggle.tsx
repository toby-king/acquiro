import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="min-h-[44px] min-w-[44px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </motion.button>
  );
}
