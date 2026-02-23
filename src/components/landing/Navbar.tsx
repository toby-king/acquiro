import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Demo' },
  { href: '#pricing', label: 'Pricing' },
];

const overlayVariants = {
  closed: { opacity: 0 },
  open: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: 'beforeChildren',
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const itemVariants = {
  closed: { opacity: 0, y: 20 },
  open: { opacity: 1, y: 0 },
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/70 backdrop-blur-2xl border-b border-[var(--border)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 flex items-center justify-between">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display font-bold text-[1.6rem] text-[var(--text-primary)]"
        >
          acquiro<span className="text-accent">.</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link to="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Log in
          </Link>
        </div>

        {/* Desktop CTA + Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <Link to="/builder" className="hidden md:block">
            <Button variant="nav">Create Your Agent</Button>
          </Link>

          {/* Hamburger: min 44x44, visible below md */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            onClick={() => setIsOpen((o) => !o)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="relative w-5 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.span
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="absolute"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                    className="absolute"
                  >
                    <Menu className="w-5 h-5" strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu: portaled so it fills the viewport (nav has backdrop-blur which creates a containing block) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile menu"
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="exit"
                className="fixed inset-0 z-[100] md:hidden flex flex-col min-h-screen w-full"
                style={{
                  backgroundColor: '#0A0A0C',
                  overflow: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {/* Close button - top right */}
                <div className="flex-shrink-0 flex justify-end p-4">
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-[var(--text-primary)] hover:bg-white/10 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" strokeWidth={2} />
                  </button>
                </div>

                {/* Centered nav items */}
                <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-6 pb-16 min-h-0">
                  {NAV_LINKS.map((link) => (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      variants={itemVariants}
                      className="min-h-[48px] flex items-center justify-center w-full max-w-[280px] px-6 py-3 rounded-xl text-[var(--text-primary)] hover:bg-white/10 transition-colors text-xl font-medium"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </motion.a>
                  ))}
                  <motion.div variants={itemVariants} className="w-full max-w-[280px] pt-4">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="min-h-[48px] flex items-center justify-center w-full px-6 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors text-xl font-medium"
                    >
                      Log in
                    </Link>
                  </motion.div>
                  <motion.div variants={itemVariants} className="pt-6">
                    <Link to="/builder" onClick={closeMenu}>
                      <Button variant="nav" className="min-h-[48px] px-8 py-4 text-base">
                        Create Your Agent
                      </Button>
                    </Link>
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </nav>
  );
}
