import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardHover, cardTap } from '../../utils/animations';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ 
  children, 
  selected = false, 
  interactive = false,
  onClick,
  className = '',
  ...props 
}: CardProps) {
  const baseStyles = 'relative rounded-2xl p-6 transition-all duration-300 overflow-hidden';
  const borderStyles = selected 
    ? 'border-2 border-accent' 
    : 'border border-[var(--border)]';
  const interactiveStyles = interactive 
    ? 'cursor-pointer hover:border-[var(--text-secondary)]' 
    : '';
  
  const content = (
    <div 
      className={`${baseStyles} ${borderStyles} ${interactiveStyles} ${className}`}
      style={{
        background: 'var(--bg-card)',
        ...(selected && {
          border: '2px solid var(--accent)',
          boxShadow: '0 0 30px rgba(198, 255, 74, 0.3)',
        }),
      }}
      {...props}
    >
      {/* Blue gradient overlay */}
      {selected && (
        <div 
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(96, 165, 250, 0.1) 100%)',
            opacity: 0.1,
          }}
        />
      )}
      
      {/* Yellow-green radial gradient overlay */}
      {selected && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(198, 255, 74, 0.15) 0%, transparent 70%)',
            opacity: 0.3,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
  
  if (interactive && onClick) {
    return (
      <motion.div
        whileHover={cardHover}
        whileTap={cardTap}
        onClick={onClick}
      >
        {content}
      </motion.div>
    );
  }
  
  return content;
}
