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
    done: { ru: 'Готово', tj: 'Тайёр' },
  },
  buttons: {
    next: { ru: 'Далее', tj: 'Минбаъд' },
    back: { ru: 'Назад', tj: 'Бозгашт' },
    copy: { ru: 'Копировать', tj: 'Нусха гирифтан' },
    copied: { ru: 'Скопировано', tj: 'Нусха гирифта шуд' },
    upload: { ru: 'Загрузить чек', tj: 'Расиди пардохтро бор кунед' },
    submit: { ru: 'Отправить заказ', tj: 'Фармоишро фиристед' },
    again: { ru: 'Новый заказ', tj: 'Фармоиши нав' },
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
    receiptTitle: { ru: 'Загрузите чек', tj: 'Расидро бор кунед' },
    receiptHint: {
      ru: 'Скриншот платежа в формате JPG или PNG, до 5 МБ',
      tj: 'Скриншоти пардохт дар формати JPG ё PNG, то 5 МБ',
    },
    receiptInvalid: {
      ru: 'Файл должен быть изображением до 5 МБ.',
      tj: 'Файл бояд расм то 5 МБ бошад.',
    },
    sendToBot: {
      ru: 'Передать заказ в бота',
      tj: 'Фармоишро ба бот фиристед',
    },
    sendToBotHint: {
      ru: 'Мини-приложение закроется. Оплатите и отправьте скриншот чека в чат с ботом.',
      tj: 'Барномаи хурд пӯшида мешавад. Пардохт кунед ва скриншоти расидро ба бот фиристед.',
    },
  },
  done: {
    title: { ru: 'Заказ принят', tj: 'Фармоиш қабул шуд' },
    subtitle: {
      ru: 'Мы проверим оплату и зачислим валюту в течение 5–15 минут.',
      tj: 'Мо пардохтро тафтиш мекунем ва маблағро дар 5–15 дақиқа интиқол медиҳем.',
    },
    orderId: { ru: 'Номер заказа', tj: 'Рақами фармоиш' },
    contact: {
      ru: 'Если возникнут вопросы — мы напишем в Telegram.',
      tj: 'Агар савол пайдо шавад — мо ба Telegram менависем.',
    },
  },
  errors: {
    submit: {
      ru: 'Не удалось отправить заказ. Попробуйте снова.',
      tj: 'Фиристодани фармоиш нашуд. Бори дигар санҷед.',
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
