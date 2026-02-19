import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cardTap } from '../../utils/animations';
import { cn } from '../../utils/cn';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'nav';
  children: ReactNode;
  arrow?: boolean;
}

export function Button({ variant = 'primary', children, className = '', disabled, arrow = false, ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]';
  
  const variantStyles = {
    primary: 'bg-accent text-[var(--bg-primary)] px-9 py-4 rounded-pill font-semibold hover:bg-accent-light hover:-translate-y-0.5 hover:shadow-accent-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
    secondary: 'bg-transparent text-[var(--text-primary)] px-9 py-4 rounded-pill border border-[var(--border)] hover:border-white/15 hover:bg-white/[0.03] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
    nav: 'bg-accent text-[var(--bg-primary)] px-6 py-2.5 rounded-pill text-[0.85rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
  };
  
  return (
    <motion.button
      whileHover={!disabled && variant !== 'ghost' ? { scale: 1.02 } : {}}
      whileTap={!disabled ? cardTap : {}}
      className={cn(baseStyles, variantStyles[variant], className)}
      disabled={disabled}
      {...(props as any)}
    >
      <span className="flex items-center gap-2">
        {children}
        {arrow && <ArrowRight size={16} />}
      </span>
    </motion.button>
  );
}
