import type { Locale } from '@/types';

export const LOCALES: Locale[] = ['ru', 'tj'];

export const dict = {
  brand: {
    name: { ru: 'TopUp.TJ', tj: 'TopUp.TJ' },
    tagline: {
      ru: 'Премиум пополнение игр в Таджикистане',
      tj: 'Пуркунии премиуми бозиҳо дар Тоҷикистон',
    },
  },
  steps: {
    game: { ru: 'Игра', tj: 'Бозӣ' },
    pack: { ru: 'Пакет', tj: 'Пакет' },
    id: { ru: 'ID', tj: 'ID' },
    pay: { ru: 'Оплата', tj: 'Пардохт' },
  },
  buttons: {
    next: { ru: 'Далее', tj: 'Минбаъд' },
    back: { ru: 'Назад', tj: 'Бозгашт' },
    copy: { ru: 'Копировать', tj: 'Нусха гирифтан' },
    copied: { ru: 'Скопировано', tj: 'Нусха гирифта шуд' },
    checkout: {
      ru: 'Оформить в боте',
      tj: 'Дар бот расм кунед',
    },
  },
  game: {
    title: { ru: 'Выберите игру', tj: 'Бозиро интихоб кунед' },
    subtitle: {
      ru: 'Мгновенное зачисление 24/7',
      tj: 'Воридшавии фаврӣ 24/7',
    },
  },
  pack: {
    title: { ru: 'Выберите пакет', tj: 'Пакетро интихоб кунед' },
    popular: { ru: 'Популярное', tj: 'Маъмул' },
    best: { ru: 'Выгода', tj: 'Фоиданок' },
  },
  id: {
    title: { ru: 'Введите Player ID', tj: 'Player ID-ро ворид кунед' },
    placeholder: { ru: 'Например, 1234567890', tj: 'Масалан, 1234567890' },
    hint: {
      ru: 'Только цифры. ID можно найти в профиле игры.',
      tj: 'Танҳо рақамҳо. ID-ро дар профили бозӣ ёфтан мумкин аст.',
    },
    invalid: {
      ru: 'Некорректный ID. Допустимо 6–14 цифр.',
      tj: 'ID нодуруст аст. 6–14 рақам иҷозат аст.',
    },
  },
  pay: {
    title: { ru: 'Способ оплаты', tj: 'Тарзи пардохт' },
    walletLabel: { ru: 'Номер кошелька', tj: 'Рақами ҳамён' },
    holderLabel: { ru: 'Получатель', tj: 'Гиранда' },
    amountLabel: { ru: 'Сумма к оплате', tj: 'Маблағи пардохт' },
    checkoutHint: {
      ru: 'Переведите сумму на выбранный кошелёк. Затем нажмите кнопку ниже — заказ уйдёт в бот, мини-приложение закроется, и нужно будет прислать скриншот чека прямо в чат с ботом.',
      tj: 'Маблағро ба ҳамёни интихобшуда интиқол диҳед. Пас тугмаро пахш кунед — фармоиш ба бот меравад, барнома пӯшида мешавад; скриншоти расидро ба чати бот фиристед.',
    },
  },
  errors: {
    submit: {
      ru: 'Не удалось отправить данные. Откройте магазин из Telegram.',
      tj: 'Маълумот фиристода нашуд. Аз Telegram кушоед.',
    },
    needTelegram: {
      ru: 'Оформление доступно только внутри Telegram Mini App.',
      tj: 'Фармоиш танҳо дар Telegram Mini App дастрас аст.',
    },
    payloadTooLarge: {
      ru: 'Слишком много данных для Telegram. Обратитесь в поддержку.',
      tj: 'Маълумот барои Telegram зиёд аст.',
    },
  },
  currency: { ru: 'сомони', tj: 'сомонӣ' },
} as const;

/** Resolve a localized string by locale */
export function t(value: { ru: string; tj: string }, locale: Locale): string {
  return value[locale] ?? value.ru;
}

/** Detect best initial locale: Telegram → browser → default */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'ru';
  try {
    const tg = (window as any).Telegram?.WebApp;
    const code: string | undefined =
      tg?.initDataUnsafe?.user?.language_code || navigator.language;
    if (code?.toLowerCase().startsWith('tg')) return 'tj';
    if (code?.toLowerCase().startsWith('tj')) return 'tj';
    return 'ru';
  } catch {
    return 'ru';
  }
}
