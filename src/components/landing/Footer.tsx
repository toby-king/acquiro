import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="max-w-[1200px] mx-auto px-12 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo */}
          <div>
            <Link to="/" className="font-display font-bold text-xl text-[var(--text-primary)] mb-4 inline-block">
              acquiro<span className="text-accent">.</span>
            </Link>
            <p className="text-[var(--text-secondary)] text-sm">
              AI-powered M&A advisory for modern acquirers.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                How It Works
              </a>
              <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                Features
              </a>
              <a href="#demo" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                Demo
              </a>
              <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                Pricing
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">Legal</h3>
            <nav className="flex flex-col gap-2">
              <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                Terms of Service
              </a>
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
