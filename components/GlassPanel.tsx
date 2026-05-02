'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Use the slightly heavier variant */
  strong?: boolean;
  /** Animated rotating neon hairline border */
  neon?: boolean;
  /** Padding preset */
  pad?: 'none' | 'sm' | 'md' | 'lg';
  /** Rounded preset (defaults to 3xl, very iOS) */
  radius?: 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  children?: ReactNode;
}

const padMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-7',
} as const;

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel(
    { className, strong, neon, pad = 'md', radius = '3xl', children, ...rest },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          `rounded-${radius}`,
          strong ? 'glass-strong' : 'glass',
          neon && 'neon-border',
          padMap[pad],
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
