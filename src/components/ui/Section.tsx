import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section
      className={cn('py-16 md:py-24 lg:py-[120px] px-4 sm:px-6 md:px-8 lg:px-12 max-w-[1200px] mx-auto border-t border-[var(--border)]', className)}
      {...props}
    >
      {children}
    </section>
  );
}

interface SectionLabelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function SectionLabel({ children, className, ...props }: SectionLabelProps) {
  return (
    <div
      className={cn('text-[0.72rem] text-accent uppercase tracking-[0.16em] font-semibold', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function SectionTitle({ children, className, ...props }: SectionTitleProps) {
  return (
    <h2
      className={cn('font-display font-bold text-[clamp(2rem,3.5vw,3rem)] leading-[1.15] tracking-tight', className)}
      {...props}
    >
      {children}
    </h2>
  );
}

interface SectionDescProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function SectionDesc({ children, className, ...props }: SectionDescProps) {
  return (
    <p
      className={cn('text-[var(--text-secondary)] text-[1.05rem] leading-[1.7] font-light w-full max-w-[520px]', className)}
      {...props}
    >
      {children}
    </p>
  );
}
