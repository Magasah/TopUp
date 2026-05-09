/** Базовый курс: сколько сомони за 1 ₽ (подстройте в Vercel / .env). */
function rubToTjsRate(): number {
  const raw = import.meta.env.VITE_RUB_TO_TJS;
  const n = raw ? Number.parseFloat(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 0.14;
}

function markupLowPct(): number {
  const n = Number.parseFloat(import.meta.env.VITE_MARKUP_LOW_PCT ?? "16");
  return Number.isFinite(n) && n >= 0 ? n : 16;
}

function markupMidPct(): number {
  const n = Number.parseFloat(import.meta.env.VITE_MARKUP_MID_PCT ?? "13");
  return Number.isFinite(n) && n >= 0 ? n : 13;
}

function markupHighPct(): number {
  const n = Number.parseFloat(import.meta.env.VITE_MARKUP_HIGH_PCT ?? "10");
  return Number.isFinite(n) && n >= 0 ? n : 10;
}

/** Фиксированная надбавка в сомони после % — «как в обычном магазине», плюс ваша маржа. */
function flatProfitTjs(baseBeforePct: number): number {
  const raw = import.meta.env.VITE_FLAT_PROFIT_TJS;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  if (baseBeforePct < 55) return 7;
  if (baseBeforePct < 95) return 9;
  if (baseBeforePct < 140) return 11;
  if (baseBeforePct < 200) return 13;
  return 16;
}

/**
 * Перевод цены из ₽ в сомони + «умная» наценка (ниже сумма — чуть выше %,
 * выше чек — мягче), чтобы визуально выглядело как обычный магазин.
 */
export function priceRubToTjsSelling(rub: number): number {
  const rate = rubToTjsRate();
  const base = rub * rate;
  let pct: number;
  if (base < 70) pct = markupLowPct();
  else if (base < 180) pct = markupMidPct();
  else pct = markupHighPct();
  const withMarkup = base * (1 + pct / 100);
  const total = withMarkup + flatProfitTjs(base);
  return Math.max(1, Math.ceil(total));
}

export function formatTjs(n: number): string {
  return `${n}\u00a0смн`;
}
