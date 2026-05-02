'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { dict, t } from '@/lib/i18n';
import type { Locale } from '@/types';

export type StepKey = 'game' | 'pack' | 'id' | 'pay' | 'done';
const ORDER: StepKey[] = ['game', 'pack', 'id', 'pay', 'done'];

interface Props {
  current: StepKey;
  locale: Locale;
}

export function StepIndicator({ current, locale }: Props) {
  const currentIdx = ORDER.indexOf(current);

  return (
    <div className="flex items-center justify-between gap-1 sm:gap-2 w-full max-w-md mx-auto px-1">
      {ORDER.map((key, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={key} className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 last:flex-initial">
            <motion.div
              initial={false}
              animate={{
                scale: active ? 1.05 : 1,
                opacity: active || done ? 1 : 0.55,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] sm:text-xs font-medium tracking-tight whitespace-nowrap',
                active
                  ? 'step-pill-active'
                  : done
                    ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
                    : 'bg-white/5 text-white/60 border border-white/10'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                  active
                    ? 'bg-ink-950/70 text-white'
                    : done
                      ? 'bg-neon-green/30 text-neon-green'
                      : 'bg-white/10 text-white/70'
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="truncate">{t(dict.steps[key], locale)}</span>
            </motion.div>

            {i < ORDER.length - 1 && (
              <div className="flex-1 h-px relative overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-white/10" />
                <motion.div
                  initial={false}
                  animate={{ scaleX: i < currentIdx ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ originX: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-magenta"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
