import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cardTap } from '../../utils/animations';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', disabled, ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]';
  
  const variantStyles = {
    primary: 'bg-accent text-[var(--bg-primary)] hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-card)] disabled:opacity-50 disabled:cursor-not-allowed',
  };
  
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? cardTap : {}}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
