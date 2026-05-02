'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface NeonButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'name' | 'value'> {
  variant?: Variant;
  size?: Size;
  glow?: 'blue' | 'magenta' | 'green' | 'mixed';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

const sizeMap: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
};

const glowShadow: Record<NonNullable<NeonButtonProps['glow']>, string> = {
  blue: 'shadow-neon-blue',
  magenta: 'shadow-neon-magenta',
  green: 'shadow-neon-green',
  mixed:
    '[box-shadow:0_0_24px_rgba(0,212,255,0.45),0_0_48px_rgba(255,43,214,0.35)]',
};

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  function NeonButton(
    {
      className,
      variant = 'primary',
      size = 'md',
      glow = 'mixed',
      loading,
      leftIcon,
      rightIcon,
      full,
      disabled,
      children,
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    const base =
      'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight select-none ' +
      'transition-[transform,box-shadow,background-color,color] duration-300 ease-out ' +
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClass: Record<Variant, string> = {
      primary:
        'text-ink-950 bg-gradient-to-r from-neon-blue via-white to-neon-magenta ' +
        'bg-[length:200%_100%] bg-left hover:bg-right ' +
        glowShadow[glow],
      ghost:
        'text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl',
      subtle:
        'text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] backdrop-blur-md',
      danger:
        'text-white bg-gradient-to-r from-rose-500 to-neon-magenta shadow-[0_0_24px_rgba(255,43,214,0.4)]',
    };

    return (
      <motion.button
        ref={ref}
        type={rest.type ?? 'button'}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        whileHover={isDisabled ? undefined : { y: -1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        disabled={isDisabled}
        className={cn(base, sizeMap[size], variantClass[variant], full && 'w-full', className)}
        {...rest}
      >
        {/* Specular sheen */}
        {variant === 'primary' && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full overflow-hidden"
          >
            <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-md skew-x-12 translate-x-0 group-hover:translate-x-[400%] transition-transform duration-700 ease-out" />
          </span>
        )}

        {loading ? (
          <span
            aria-hidden
            className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"
          />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}

        <span className="relative">{children}</span>

        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);
