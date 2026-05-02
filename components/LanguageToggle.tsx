'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { Locale } from '@/types';

interface Props {
  value: Locale;
  onChange: (next: Locale) => void;
}

const OPTIONS: { id: Locale; label: string }[] = [
  { id: 'ru', label: 'RU' },
  { id: 'tj', label: 'TJ' },
];

export function LanguageToggle({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Language"
      className="relative inline-flex items-center rounded-full p-1 glass overflow-hidden"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative z-10 px-3 py-1 text-xs font-semibold tracking-wider transition-colors',
              active ? 'text-ink-950' : 'text-white/70 hover:text-white'
            )}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-neon-blue to-neon-magenta shadow-neon-blue"
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
