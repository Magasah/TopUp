import type { Wallet } from '@/types';

/**
 * Requisites are loaded from env when set (e.g. Vercel), otherwise defaults below.
 * Icons: place PNG/WebP in `public/cards/` — see `public/cards/README.md`.
 */
function env(name: string, fallback: string): string {
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name] as string;
  }
  return fallback;
}

export const WALLETS: Wallet[] = [
  {
    id: 'dc',
    name: 'DC City',
    icon: '/cards/dc.jpg',
    holder: { ru: 'TopUp.TJ', tj: 'TopUp.TJ' },
    number: env('NEXT_PUBLIC_WALLET_DC', '+992888788181'),
    gradient: 'from-[#ffb547] to-[#ff2bd6]',
    hint: {
      ru: 'Перевод на номер DC City (Душанбе Сити)',
      tj: 'Интиқол ба рақами DC City (Душанбе Ситӣ)',
    },
  },
  {
    id: 'alif',
    name: 'Alif Mobi',
    icon: '/cards/alif.webp',
    holder: { ru: 'TopUp.TJ', tj: 'TopUp.TJ' },
    number: env('NEXT_PUBLIC_WALLET_ALIF', '+992888788181'),
    gradient: 'from-[#ff2bd6] to-[#9d6bff]',
    hint: {
      ru: 'Перевод по номеру в приложении Alif Mobi',
      tj: 'Интиқол аз рӯи рақам дар Alif Mobi',
    },
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    icon: '/cards/mastercard.jpg',
    holder: { ru: 'TopUp.TJ', tj: 'TopUp.TJ' },
    number: env('NEXT_PUBLIC_WALLET_MASTERCARD', '5413525250170749'),
    gradient: 'from-[#eb001b] via-[#f79e1b] to-[#ff5f00]',
    hint: {
      ru: 'Банковский перевод на карту Mastercard',
      tj: 'Интиқоли бонкӣ ба корти Mastercard',
    },
  },
  {
    id: 'milli',
    name: 'Корти милли',
    icon: '/cards/milli.webp',
    holder: { ru: 'TopUp.TJ', tj: 'TopUp.TJ' },
    number: env('NEXT_PUBLIC_WALLET_MILLI', '9762000106186207'),
    gradient: 'from-[#00d4ff] to-[#39ff7a]',
    hint: {
      ru: 'Перевод на карту «Корти милли»',
      tj: 'Интиқол ба корти «Корти миллӣ»',
    },
  },
];

export function getWallet(id: string) {
  return WALLETS.find((w) => w.id === id);
}
