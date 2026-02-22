import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/70 backdrop-blur-2xl border-b border-[var(--border)]">
      <div className="max-w-[1200px] mx-auto px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display font-bold text-[1.6rem] text-[var(--text-primary)]">
          acquiro<span className="text-accent">.</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <a href="#demo" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Demo
          </a>
          <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
          <Link to="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Log in
          </Link>
        </div>

        {/* CTA Button */}
        <Link to="/builder">
          <Button variant="nav">Create Your Agent</Button>
        </Link>
      </div>
    </nav>
  );
}
