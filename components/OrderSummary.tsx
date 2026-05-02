'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { dict, t } from '@/lib/i18n';
import type { Game, Locale, PriceItem } from '@/types';

interface Props {
  game: Game;
  item: PriceItem;
  playerId?: string;
  locale: Locale;
  compact?: boolean;
}

export function OrderSummary({ game, item, playerId, locale, compact }: Props) {
  const [iconErr, setIconErr] = useState(false);

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="rounded-2xl glass p-3 sm:p-4 flex items-center gap-3"
    >
      <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl glass-strong grid place-items-center overflow-hidden">
        {!iconErr ? (
          <Image
            src={game.icon}
            alt={game.name}
            width={40}
            height={40}
            unoptimized
            className="object-contain h-7 w-7 sm:h-8 sm:w-8"
            onError={() => setIconErr(true)}
          />
        ) : (
          <Image
            src={`/games/${game.id}.svg`}
            alt={game.name}
            width={40}
            height={40}
            className="h-7 w-7 sm:h-8 sm:w-8"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/55">
          {game.name}
        </div>
        <div className="font-display font-semibold text-sm sm:text-base truncate">
          {typeof item.label === 'string' ? item.label : item.label[locale]}
        </div>
        {playerId && !compact && (
          <div className="mt-0.5 text-[11px] font-mono text-white/55 truncate">
            ID: {playerId}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/55">
          {locale === 'ru' ? 'Итого' : 'Ҳамагӣ'}
        </div>
        <div className="font-display font-extrabold text-lg sm:text-xl shimmer-text">
          {new Intl.NumberFormat('ru-RU').format(item.priceTjs)}{' '}
          <span className="text-xs text-white/60 font-normal">
            {t(dict.currency, locale)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
