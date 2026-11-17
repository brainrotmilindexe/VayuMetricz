import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds hover/focus affordances for cards that act as controls. */
  interactive?: boolean;
}

export function Card({ children, className = '', interactive = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-surface/70 backdrop-blur-xl shadow-soft',
        interactive ? 'transition-colors duration-200 hover:border-accent/40' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
