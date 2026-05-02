import type { Game } from '@/types';

export const GAMES: Game[] = [
  {
    id: 'freefire',
    name: 'Free Fire',
    icon: '/games/freefire.jpg',
    tagline: {
      ru: 'Алмазы для Garena Free Fire',
      tj: 'Алмосҳо барои Garena Free Fire',
    },
    gradient: 'from-[#ff7a00] via-[#ff2bd6] to-[#9d6bff]',
    glow: 'magenta',
    items: [
      { id: 'ff-100', label: '100 💎', priceTjs: 11, icon: '/diamonds.png' },
      { id: 'ff-310', label: '310 💎', priceTjs: 31, icon: '/diamonds.png', popular: true },
      { id: 'ff-520', label: '520 💎', priceTjs: 51, icon: '/diamonds.png' },
      { id: 'ff-1060', label: '1060 💎', priceTjs: 110, icon: '/diamonds.png', popular: true },
      { id: 'ff-2180', label: '2180 💎', priceTjs: 180, icon: '/diamonds.png' },
      { id: 'ff-5600', label: '5600 💎', priceTjs: 550, icon: '/diamonds.png', bestValue: true },
      {
        id: 'ff-week',
        label: { ru: 'Недельная подписка (450 💎)', tj: 'Обунаи ҳафтавор (450 💎)' },
        priceTjs: 17,
        icon: '/diamonds.png'
      },
      {
        id: 'ff-month',
        label: { ru: 'Месячная подписка (2600 💎)', tj: 'Обунаи моҳона (2600 💎)' },
        priceTjs: 110,
        icon: '/diamonds.png'
      },
      {
        id: 'ff-level-up',
        label: { ru: 'Пропуск прокачки (1270 💎)', tj: 'Гузарномаи рушд (1270 💎)' },
        priceTjs: 50,
        icon: '/diamonds.png'
      },
    ],
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    icon: '/games/pubg.png',
    tagline: {
      ru: 'UC для PUBG Mobile (глобальная версия)',
      tj: 'UC барои PUBG Mobile (версияи глобалӣ)',
    },
    gradient: 'from-[#00d4ff] via-[#39ff7a] to-[#00d4ff]',
    glow: 'blue',
    items: [
      { id: 'pubg-60', label: '60 UC', priceTjs: 11 },
      { id: 'pubg-325', label: '325 UC', priceTjs: 53, popular: true },
      { id: 'pubg-660', label: '660 UC', priceTjs: 105 },
      { id: 'pubg-1800', label: '1800 UC', priceTjs: 263, popular: true },
      { id: 'pubg-3850', label: '3850 UC', priceTjs: 525 },
      { id: 'pubg-8100', label: '8100 UC', priceTjs: 1050, bestValue: true },
    ],
  },
];

export function getGame(id: string) {
  return GAMES.find((g) => g.id === id);
}
