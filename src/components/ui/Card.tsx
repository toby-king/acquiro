import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardHover, cardTap } from '../../utils/animations';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  selected?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  glowLine?: boolean;
}

export function Card({ 
  children, 
  selected = false, 
  interactive = false,
  onClick,
  glowLine = false,
  className = '',
  ...props 
}: CardProps) {
  const baseStyles = 'relative rounded-card p-6 transition-all duration-300 overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]';
  const borderStyles = selected 
    ? 'border-2 border-accent' 
    : '';
  const interactiveStyles = interactive || glowLine
    ? 'cursor-pointer hover:border-accent/20 hover:bg-[rgba(28,28,34,1)] hover:-translate-y-1' 
    : '';
  
  const content = (
    <div 
      className={cn(baseStyles, borderStyles, interactiveStyles, className)}
      style={{
        ...(selected && {
          border: '2px solid var(--accent)',
          boxShadow: '0 0 30px rgba(198, 255, 74, 0.3)',
        }),
      }}
      {...props}
    >
      {/* Glow line at top - appears on hover */}
      {glowLine && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
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
        className={glowLine ? 'group' : ''}
      >
        {content}
      </motion.div>
    );
  }
  
  if (glowLine) {
    return (
      <div className="group">
        {content}
      </div>
    );
  }
  
  return content;
}
