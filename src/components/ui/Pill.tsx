import { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../../utils/animations';

type PillProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDrag'
> & {
  children: ReactNode;
  selected?: boolean;
  variant?: 'embrace' | 'avoid' | 'neutral';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

export function Pill({
  children,
  selected = false,
  variant = 'neutral',
  onClick,
  className = '',
  ...props
}: PillProps) {
  const variantStyles = {
    embrace: selected
      ? 'bg-accent text-[var(--bg-primary)] border-accent'
      : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-accent',
    avoid: selected
      ? 'bg-red-500/20 text-red-400 border-red-500/50'
      : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-red-500/50',
    neutral: selected
      ? 'bg-accent text-[var(--bg-primary)] border-accent'
      : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-accent',
  };

  return (
    <motion.button
      variants={scaleIn}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
