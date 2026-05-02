'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { dict, t } from '@/lib/i18n';
import { formatPaymentDisplay } from '@/lib/format-payment';
import type { Locale, Wallet } from '@/types';

interface Props {
  wallet: Wallet;
  locale: Locale;
  selected?: boolean;
  onSelect: (id: Wallet['id']) => void;
  delay?: number;
}

export function WalletCard({ wallet, locale, selected, onSelect, delay = 0 }: Props) {
  const [iconErr, setIconErr] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(wallet.id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full text-left overflow-hidden rounded-2xl glass p-4',
        'transition-shadow duration-500',
        selected && 'ring-1 ring-neon-blue/40 shadow-neon-blue'
      )}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'relative h-12 w-12 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br grid place-items-center',
            wallet.gradient
          )}
        >
          {!iconErr && wallet.icon ? (
            <Image
              src={wallet.icon}
              alt=""
              width={48}
              height={48}
              className="object-contain p-1 h-full w-full"
              unoptimized
              onError={() => setIconErr(true)}
            />
          ) : (
            <span className="font-display font-extrabold text-ink-950 text-base">
              {wallet.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold leading-tight">
            {wallet.name}
          </div>
          <div className="text-xs text-white/55 mt-0.5">{t(wallet.hint, locale)}</div>
        </div>

        <div
          aria-hidden
          className={cn(
            'h-5 w-5 shrink-0 rounded-full border-2 transition-colors',
            selected ? 'border-neon-blue bg-neon-blue' : 'border-white/20'
          )}
        />
      </div>
    </motion.button>
  );
}

interface CopyRowProps {
  label: string;
  /** Value written to the clipboard (canonical) */
  value: string;
  /** Optional prettier line in the UI (e.g. grouped card digits) */
  displayValue?: string;
  locale: Locale;
}

export function CopyRow({ label, value, displayValue, locale }: CopyRowProps) {
  const [copied, setCopied] = useState(false);
  const shown = displayValue ?? formatPaymentDisplay(value);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl glass p-3 sm:p-4">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/55">{label}</div>
        <div className="mt-0.5 font-mono text-base sm:text-lg font-semibold tracking-wide truncate">
          {shown}
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={handleCopy}
        className={cn(
          'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
          copied
            ? 'bg-neon-green/15 text-neon-green border border-neon-green/40'
            : 'bg-white/8 text-white/90 border border-white/15 hover:bg-white/14'
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="inline-flex items-center gap-1"
            >
              ✓ {t(dict.buttons.copied, locale)}
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="inline-flex items-center gap-1"
            >
              <CopyIcon /> {t(dict.buttons.copy, locale)}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
