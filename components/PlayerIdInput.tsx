'use client';

import { useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { dict, t } from '@/lib/i18n';
import {
  isValidPlayerId,
  PLAYER_ID_REGEX,
  sanitizePlayerId,
} from '@/lib/validation';
import type { Locale } from '@/types';

interface Props {
  value: string;
  onChange: (next: string) => void;
  locale: Locale;
}

export function PlayerIdInput({ value, onChange, locale }: Props) {
  const id = useId();
  const valid = useMemo(() => isValidPlayerId(value), [value]);
  const showError = value.length > 0 && !valid;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/55"
      >
        Player ID
      </label>

      <div
        className={cn(
          'relative rounded-2xl glass overflow-hidden transition-shadow duration-500',
          valid && 'shadow-neon-green',
          showError && 'shadow-[0_0_24px_rgba(255,59,99,0.4)]'
        )}
      >
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          // Hardened: only digits, max length, pattern
          pattern={PLAYER_ID_REGEX.source}
          maxLength={14}
          value={value}
          onChange={(e) => onChange(sanitizePlayerId(e.target.value))}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text');
            onChange(sanitizePlayerId(pasted));
          }}
          placeholder={t(dict.id.placeholder, locale)}
          className={cn(
            'w-full bg-transparent px-5 py-4 text-lg font-mono tracking-[0.18em] text-white',
            'placeholder:text-white/35 placeholder:font-sans placeholder:tracking-normal',
            'focus:outline-none'
          )}
          aria-invalid={showError}
          aria-describedby={`${id}-hint`}
        />

        {/* Trailing status pill */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="popLayout">
            {valid && (
              <motion.span
                key="ok"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="inline-flex items-center gap-1 rounded-full bg-neon-green/15 border border-neon-green/40 px-2.5 py-1 text-[11px] font-semibold text-neon-green"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                OK
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div id={`${id}-hint`} className="mt-2 min-h-[1.25rem] text-xs">
        <AnimatePresence mode="wait" initial={false}>
          {showError ? (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-rose-400"
            >
              {t(dict.id.invalid, locale)}
            </motion.p>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-white/50"
            >
              {t(dict.id.hint, locale)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
