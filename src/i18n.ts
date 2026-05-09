export type Lang = "ru" | "tj";

export const STRINGS: Record<
  Lang,
  {
    brandLine: string;
    subtitle: string;
    loading: string;
    searchPh: string;
    priceFrom: string;
    oldPrice: string;
    buy: string;
    openChatHint: string;
    langRu: string;
    langTj: string;
    empty: string;
    footerNote: string;
  }
> = {
  ru: {
    brandLine: "TopUp TJ",
    subtitle: "NFT Подарки",
    loading: "Загрузка TopUp TJ - NFT Подарки",
    searchPh: "Поиск по названию…",
    priceFrom: "от",
    oldPrice: "было",
    buy: "Купить",
    openChatHint: "Откроется чат с продавцом и готовым текстом заказа.",
    langRu: "RU",
    langTj: "TJ",
    empty: "Ничего не найдено.",
    footerNote: "Цены в сомони · доставка и детали — в переписке",
  },
  tj: {
    brandLine: "TopUp TJ",
    subtitle: "NFT Тӯҳфаҳо",
    loading: "Загрузка TopUp TJ - NFT Подарки",
    searchPh: "Ҷустуҷӯ аз рӯи ном…",
    priceFrom: "аз",
    oldPrice: "қаблан",
    buy: "Харидан",
    openChatHint: "Чат бо фурӯшанда бо матни омодаи фармоиш кушода мешавад.",
    langRu: "RU",
    langTj: "TJ",
    empty: "Чизе ёфт нашуд.",
    footerNote: "Нархҳо бо сомонӣ · тафсилот дар чат",
  },
};
