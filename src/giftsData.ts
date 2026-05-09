export type GiftRow = {
  id: string;
  /** Цена в рублях (как на витрине-источнике). */
  priceRub: number;
  oldPriceRub?: number;
  discountPct?: number;
  /** Основной заголовок (RU). */
  titleRu: string;
  /** Кратко для Tajik (часто те же брендовые имена). */
  titleTj: string;
  tag?: string;
};

/**
 * Каталог по мотивам витрин вроде playerok.com/telegram/nft.
 * Курс ₽→смн и наценка настраиваются в Vercel (см. pricing.ts).
 */
export const GIFTS: GiftRow[] = [
  {
    id: "chill-flame-649",
    priceRub: 649,
    oldPriceRub: 999,
    discountPct: 35,
    titleRu: "⭐️ CHILL FLAME ЦЕННОСТЬ БОЛЬШЕ 11.000₽ | ⏰ АВТОВЫДАЧА | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ CHILL FLAME | ⏰ АВТОВЫДАЧА | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Хит",
  },
  {
    id: "chill-flame-599",
    priceRub: 599,
    oldPriceRub: 999,
    discountPct: 40,
    titleRu: "⭐️ CHILL FLAME ЦЕННОСТЬ БОЛЬШЕ 11.000₽ | ⏰ АВТОВЫДАЧА | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ CHILL FLAME | ⏰ АВТОВЫДАЧА | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Скидка",
  },
  {
    id: "vice-cream-699",
    priceRub: 699,
    oldPriceRub: 999,
    discountPct: 30,
    titleRu: "⭐️ VICE CREAM ЦЕННОСТЬ БОЛЬШЕ 11.000₽ | ⏰ АВТОВЫДАЧА | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ VICE CREAM | ⏰ АВТОВЫДАЧА | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Топ",
  },
  {
    id: "chill-flame-499",
    priceRub: 499,
    oldPriceRub: 999,
    discountPct: 50,
    titleRu: "⭐️ CHILL FLAME ЦЕННОСТЬ БОЛЬШЕ 11.000₽ | ⏰ АВТОВЫДАЧА | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ CHILL FLAME | ⏰ АВТОВЫДАЧА | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Выгодно",
  },
  {
    id: "victory-medal-lifesaver",
    priceRub: 899,
    oldPriceRub: 999,
    discountPct: 10,
    titleRu: "⭐️ VICTORY MEDAL LIFESAVER | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ОЧЕНЬ РЕДКИЙ",
    titleTj: "⭐️ VICTORY MEDAL LIFESAVER | ⏰ 24/7 | ⚡️ ХЕЛЕ НОДИР",
    tag: "Редкий",
  },
  {
    id: "chill-flame-899",
    priceRub: 899,
    oldPriceRub: 999,
    discountPct: 10,
    titleRu: "⭐️ CHILL FLAME ЦЕННОСТЬ БОЛЬШЕ 11.000₽ | ⏰ АВТОВЫДАЧА | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ CHILL FLAME | ⏰ АВТОВЫДАЧА | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "24/7",
  },
  {
    id: "chill-flame-699",
    priceRub: 699,
    oldPriceRub: 999,
    discountPct: 30,
    titleRu: "⭐️ CHILL FLAME ЦЕННОСТЬ БОЛЬШЕ 11.000₽ | ⏰ АВТОВЫДАЧА | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ CHILL FLAME | ⏰ АВТОВЫДАЧА | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Топ",
  },
  {
    id: "lol-pop",
    priceRub: 999,
    titleRu: "⭐️ МИЛЫЙ LOL POP ДЛЯ ДЕВУШКИ | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ОЧЕНЬ РЕДКИЙ",
    titleTj: "⭐️ LOL POP БАРОИ ДУХТАР | ⏰ 24/7 | ⚡️ ХЕЛЕ НОДИР",
    tag: "Редкий",
  },
  {
    id: "morgen-xmas-stocking",
    priceRub: 2499,
    titleRu: "⭐️ МОРГЕНШТЕРН XMAS STOCKING | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ MORGEN XMAS STOCKING | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Премиум",
  },
  {
    id: "black-jester-hat",
    priceRub: 1990,
    oldPriceRub: 2490,
    discountPct: 20,
    titleRu: "⭐️ ЧЕРНЫЙ JESTER HAT | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ СИЁҲ JESTER HAT | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Стиль",
  },
  {
    id: "black-pool-float",
    priceRub: 899,
    oldPriceRub: 999,
    discountPct: 10,
    titleRu: "⭐️ ЧЕРНЫЙ POOL FLOAT | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ САМАЯ НИЗКАЯ ЦЕНА",
    titleTj: "⭐️ СИЁҲ POOL FLOAT | ⏰ 24/7 | ⚡️ НАРХИ ПАСТ",
    tag: "Низкая цена",
  },
  {
    id: "black-ice-cream",
    priceRub: 849,
    oldPriceRub: 999,
    discountPct: 15,
    titleRu: "⭐️ ЧЕРНЫЙ ICE CREAM | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ СИЁҲ ICE CREAM | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "24/7",
  },
  {
    id: "spring-basket",
    priceRub: 1790,
    oldPriceRub: 2490,
    discountPct: 28,
    titleRu: "⭐️ SPRING BASKET | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ SPRING BASKET | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Сезон",
  },
  {
    id: "gothic-mood-pack",
    priceRub: 899,
    oldPriceRub: 999,
    discountPct: 10,
    titleRu: "⭐️ ГОТИЧЕСКИЙ MOOD PACK | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ GOTIC MOOD PACK | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Mood",
  },
  {
    id: "ufc-chimaev",
    priceRub: 4990,
    titleRu: "⭐️ UFC БОЕЦ K. CHIMAEV | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ОЧЕНЬ РЕДКИЙ",
    titleTj: "⭐️ UFC K. CHIMAEV | ⏰ 24/7 | ⚡️ ХЕЛЕ НОДИР",
    tag: "Ultra Rare",
  },
  {
    id: "faith-amulet",
    priceRub: 1190,
    oldPriceRub: 2499,
    discountPct: 52,
    titleRu: "🌙 FAITH AMULET | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "🌙 FAITH AMULET | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Скидка",
  },
  {
    id: "swag-bag-platinum",
    priceRub: 999,
    titleRu: "⭐️ SWAG BAG ПЛАТИНА | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ SWAG BAG ПЛАТИНА | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Платина",
  },
  {
    id: "swag-snoop-dogg",
    priceRub: 999,
    titleRu: "⭐️ СВЭГ SNOOP DOGG | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ SNOOP DOGG | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Celebrity",
  },
  {
    id: "swag-bag",
    priceRub: 1990,
    oldPriceRub: 2490,
    discountPct: 20,
    titleRu: "⭐️ SWAG BAG | ⏰ АВТОВЫДАЧА 24/7 | ⚡️ ЛУЧШАЯ ЦЕНА",
    titleTj: "⭐️ SWAG BAG | ⏰ 24/7 | ⚡️ НАРХИ БЕҲТАРИН",
    tag: "Топ",
  },
];
