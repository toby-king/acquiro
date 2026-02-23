import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo */}
          <div>
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="font-display font-bold text-xl text-[var(--text-primary)] mb-4 inline-block"
            >
              acquiro<span className="text-accent">.</span>
            </Link>
            <p className="text-[var(--text-secondary)] text-sm">
              AI-powered M&A advisory for modern acquirers.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">Navigation</h3>
            <nav className="flex flex-col gap-0">
              <a href="#how-it-works" className="min-h-[44px] flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm py-2">
                How It Works
              </a>
              <a href="#features" className="min-h-[44px] flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm py-2">
                Features
              </a>
              <a href="#demo" className="min-h-[44px] flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm py-2">
                Demo
              </a>
              <a href="#pricing" className="min-h-[44px] flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm py-2">
                Pricing
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">Legal</h3>
            <nav className="flex flex-col gap-0">
              <Link to="/privacy" className="min-h-[44px] flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm py-2">
                Privacy Policy
              </Link>
              <Link to="/terms" className="min-h-[44px] flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm py-2">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-[var(--text-tertiary)] text-sm text-center">
            © {currentYear} Acquiro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
