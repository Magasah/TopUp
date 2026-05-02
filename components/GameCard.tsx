'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { dict, t } from '@/lib/i18n';
import type { Game, Locale } from '@/types';

interface Props {
  game: Game;
  locale: Locale;
  selected?: boolean;
  onSelect: (id: Game['id']) => void;
  delay?: number;
}

const glowToShadow: Record<Game['glow'], string> = {
  blue: 'shadow-neon-blue',
  magenta: 'shadow-neon-magenta',
  green: 'shadow-neon-green',
};

export function GameCard({ game, locale, selected, onSelect, delay = 0 }: Props) {
  const [iconErr, setIconErr] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(game.id)}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative w-full text-left overflow-hidden rounded-3xl',
        'glass neon-border p-5 sm:p-6',
        'transition-shadow duration-500',
        selected && glowToShadow[game.glow]
      )}
      aria-pressed={selected}
    >
      {/* Color wash backdrop */}
      <div
        aria-hidden
        className={cn(
          'absolute -inset-1 -z-10 opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-80',
          'bg-gradient-to-br', game.gradient
        )}
      />

      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ rotate: 6, scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl overflow-hidden glass-strong p-2 grid place-items-center"
        >
          {!iconErr ? (
            <Image
              src={game.icon}
              alt={game.name}
              width={80}
              height={80}
              priority
              unoptimized
              className="object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
              onError={() => setIconErr(true)}
            />
          ) : (
            <Image
              src={`/games/${game.id}.svg`}
              alt={game.name}
              width={80}
              height={80}
              priority
              className="drop-shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
            />
          )}
        </motion.div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
            {game.name}
          </h3>
          <p className="mt-1 text-sm text-white/65 leading-snug">
            {t(game.tagline, locale)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="chip text-neon-green border-neon-green/30">
              {locale === 'ru' ? 'Мгновенно' : 'Фаврӣ'}
            </span>
            <span className="chip text-white/80">
              {game.items.length} {locale === 'ru' ? 'пакетов' : 'пакет'}
            </span>
          </div>
        </div>

        <div
          aria-hidden
          className="hidden sm:grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-white/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white/10"
        >
          →
        </div>
      </div>

      {/* Bottom action hint */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-white/50 uppercase tracking-[0.2em]">
          {t(dict.game.subtitle, locale)}
        </span>
        <span className="text-xs font-medium text-white/85 group-hover:text-white">
          {t(dict.buttons.next, locale)} →
        </span>
      </div>
    </motion.button>
  );
}
