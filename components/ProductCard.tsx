'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { dict, t } from '@/lib/i18n';
import type { Locale, PriceItem } from '@/types';
import Image from 'next/image';

interface Props {
  item: PriceItem;
  locale: Locale;
  selected?: boolean;
  onSelect: (id: string) => void;
  delay?: number;
}

export function ProductCard({ item, locale, selected, onSelect, delay = 0 }: Props) {
  const label = typeof item.label === 'string' ? item.label : item.label[locale];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(item.id)}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group flex flex-col gap-3 w-full text-left overflow-hidden rounded-xl glass p-4',
        'shadow-md border transition-all duration-300',
        selected 
          ? 'border-neon-blue/80 shadow-[0_0_15px_rgba(0,212,255,0.4)] ring-1 ring-neon-blue/40' 
          : 'border-white/10 hover:border-white/20'
      )}
      aria-pressed={selected}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-1">
          {/* Tag */}
          {(item.popular || item.bestValue) && (
            <span
              className={cn(
                'self-start chip text-[10px] uppercase tracking-wider font-bold mb-1',
                item.bestValue
                  ? 'text-neon-green border-neon-green/40 shadow-neon-green'
                  : 'text-neon-magenta border-neon-magenta/40'
              )}
            >
              {item.bestValue ? t(dict.pack.best, locale) : t(dict.pack.popular, locale)}
            </span>
          )}
          
          {/* Icon */}
          {item.icon && (
            <div className="relative w-12 h-12 shrink-0 mb-1 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">
              <Image 
                src={item.icon} 
                alt="Diamond" 
                fill 
                className="object-contain"
                sizes="48px"
              />
            </div>
          )}
        </div>

        {/* Selected check pip */}
        {selected && (
          <motion.div
            layoutId={`check-${item.id}`}
            className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-neon-blue text-ink-950 shadow-[0_0_10px_rgba(0,212,255,0.8)]"
          >
            <span className="text-[12px] font-bold">✓</span>
          </motion.div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 mt-auto">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">
          {locale === 'ru' ? 'Пакет' : 'Пакет'}
        </div>
        <div className="font-display text-base font-semibold leading-tight min-h-[40px] flex items-center">
          {label}
        </div>
        
        <div className="mt-2 flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/5 group-hover:bg-white/10 transition-colors">
          <span className="text-[11px] uppercase tracking-wider text-white/60">
            {locale === 'ru' ? 'Цена' : 'Нарх'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-extrabold text-lg text-neon-blue drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">
              {new Intl.NumberFormat('ru-RU').format(item.priceTjs)}
            </span>
            <span className="text-xs text-white/60 font-medium">{t(dict.currency, locale)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
