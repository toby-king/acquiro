import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface IconBadgeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'md' | 'sm';
}

export function IconBadge({ children, size = 'md', className, ...props }: IconBadgeProps) {
  const sizeStyles = {
    md: 'w-12 h-12',
    sm: 'w-[42px] h-[42px]',
  };

  return (
    <div
      className={cn(
        'bg-accent/15 border border-accent/20 text-accent rounded-xl flex items-center justify-center',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
