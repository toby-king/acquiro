import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ToggleProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label, className = '', ...props }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] rounded-lg ${className}`}
      {...props}
    >
      <div
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-[var(--bg-card)] border border-[var(--border)]'
        }`}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      {label && (
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      )}
    </button>
  );
}
