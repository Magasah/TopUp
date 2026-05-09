import { useEffect, useMemo, useState } from "react";
import { GIFTS, type GiftRow } from "./giftsData";
import { STRINGS, type Lang } from "./i18n";
import { formatTjs, priceRubToTjsSelling } from "./pricing";

const IMAGE_CANDIDATES = (giftId: string): string[] => [
  `/webapp-public/${giftId}.jpg`,
  `/webapp-public/${giftId}.jpeg`,
  `/webapp-public/${giftId}.png`,
  `/webapp-public/${giftId}.webp`,
  `/${giftId}.jpg`,
  `/${giftId}.jpeg`,
  `/${giftId}.png`,
  `/${giftId}.webp`,
];

function sellerUsername(): string {
  try {
    const q = new URLSearchParams(window.location.search).get("seller");
    if (q) {
      const clean = q.replace(/^@/, "").trim();
      if (clean && !/^-?\d+$/.test(clean)) return clean;
    }
  } catch {
    /* ignore */
  }
  const u = (import.meta.env.VITE_SELLER_USERNAME ?? "vvewrix").replace(/^@/, "").trim();
  return u || "vvewrix";
}

function orderMessage(title: string, priceTjs: number): string {
  return `Здравствуйте, хочу купить этот товар: ${title}\nЦена: ${priceTjs} сомони.`;
}

function openBuyInTelegram(title: string, priceTjs: number): void {
  const user = sellerUsername();
  const text = encodeURIComponent(orderMessage(title, priceTjs));
  const tg = window.Telegram?.WebApp;
  const httpsUrl = `https://t.me/${user}?text=${text}`;
  const tgUrl = `tg://resolve?domain=${user}&text=${text}`;

  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(httpsUrl);
      return;
    } catch {
      try {
        tg.openTelegramLink(tgUrl);
        return;
      } catch {
        /* ignore */
      }
    }
  }
  if (tg?.openLink) {
    try {
      tg.openLink(httpsUrl);
      return;
    } catch {
      /* ignore */
    }
  }
  window.location.href = httpsUrl;
}

function GiftImage({ giftId, alt }: { giftId: string; alt: string }) {
  const [idx, setIdx] = useState(0);
  const candidates = IMAGE_CANDIDATES(giftId);
  const src = candidates[idx];
  if (!src) return null;

  return (
    <img
      className="card-image"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setIdx((v) => v + 1)}
    />
  );
}

function GiftCard({
  g,
  lang,
  priceTjs,
}: {
  g: GiftRow;
  lang: Lang;
  priceTjs: number;
}) {
  const t = STRINGS[lang];
  const title = lang === "tj" ? g.titleTj : g.titleRu;
  const oldTjs = g.oldPriceRub != null ? priceRubToTjsSelling(g.oldPriceRub) : null;

  return (
    <article className="card">
      <GiftImage giftId={g.id} alt={title} />
      <div className="card-top">
        {g.tag && <span className="pill">{g.tag}</span>}
        {g.discountPct != null && <span className="pill pill-sale">−{g.discountPct}%</span>}
      </div>
      <h3 className="card-title">{title}</h3>
      <div className="card-prices">
        <span className="price-main">
          {t.priceFrom} {formatTjs(priceTjs)}
        </span>
        {oldTjs != null && oldTjs > priceTjs && (
          <span className="price-old">
            {t.oldPrice}: {formatTjs(oldTjs)}
          </span>
        )}
        <span className="price-rub">{g.priceRub.toLocaleString("ru-RU")} ₽</span>
      </div>
      <button type="button" className="btn-buy" onClick={() => openBuyInTelegram(title, priceTjs)}>
        {t.buy}
      </button>
    </article>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>("ru");
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const t = STRINGS[lang];

  useEffect(() => {
    const w = window.Telegram?.WebApp;
    if (w) {
      w.ready();
      w.expand();
      try {
        w.setHeaderColor("#0f1117");
        w.setBackgroundColor("#0f1117");
      } catch {
        /* ignore */
      }
    }
    const id = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const priced = useMemo(
    () =>
      GIFTS.map((g) => ({
        g,
        priceTjs: priceRubToTjsSelling(g.priceRub),
        search: `${g.titleRu} ${g.titleTj}`.toLowerCase(),
      })),
    []
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return priced;
    return priced.filter((x) => x.search.includes(qq));
  }, [priced, q]);

  if (!ready) {
    return (
      <div className="shell loading-screen">
        <div className="loader" />
        <div className="loading-text">{t.loading}</div>
        <div className="loading-brand">{t.brandLine}</div>
        <div className="loading-sub">TopUp TJ — {t.subtitle}</div>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="header">
        <div>
          <div className="brand">{t.brandLine}</div>
          <div className="sub">TopUp TJ — {t.subtitle}</div>
        </div>
        <div className="lang-toggle" role="group" aria-label="language">
          <button type="button" className={lang === "ru" ? "active" : ""} onClick={() => setLang("ru")}>
            {t.langRu}
          </button>
          <button type="button" className={lang === "tj" ? "active" : ""} onClick={() => setLang("tj")}>
            {t.langTj}
          </button>
        </div>
      </header>

      <p className="hint">{t.openChatHint}</p>

      <input
        className="search"
        type="search"
        placeholder={t.searchPh}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />

      <main className="grid">
        {filtered.length === 0 ? (
          <div className="empty">{t.empty}</div>
        ) : (
          filtered.map(({ g, priceTjs }) => <GiftCard key={g.id} g={g} lang={lang} priceTjs={priceTjs} />)
        )}
      </main>

      <footer className="footer">{t.footerNote}</footer>
    </div>
  );
}
