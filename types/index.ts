export type Locale = 'ru' | 'tj';

export type GameId = 'freefire' | 'pubg';

export interface LocalizedString {
  ru: string;
  tj: string;
}

export interface PriceItem {
  id: string;
  /** What the player gets, e.g. "100+5 Diamonds" or "60 UC". Can be localized. */
  label: string | LocalizedString;
  /** Optional icon to display (e.g. /diamonds.png) */
  icon?: string;
  /** Optional small subtitle like a bonus tag */
  badge?: LocalizedString;
  /** Price in TJS (сомонӣ) */
  priceTjs: number;
  /** Mark a popular bundle */
  popular?: boolean;
  /** Mark best value */
  bestValue?: boolean;
}

export interface Game {
  id: GameId;
  name: string;            // brand name (kept latin)
  /** Path under /public, e.g. /games/freefire.png */
  icon: string;
  tagline: LocalizedString;
  /** Tailwind gradient class for accents */
  gradient: string;
  /** Glow color token */
  glow: 'blue' | 'magenta' | 'green';
  items: PriceItem[];
}

export type WalletId = 'dc' | 'alif' | 'mastercard' | 'milli';

export interface Wallet {
  id: WalletId;
  name: string;
  /** Path under /public, e.g. /cards/alif.png */
  icon: string;
  /** Holder name to display next to the number */
  holder: LocalizedString;
  /** Canonical value for clipboard / API (digits or full phone as stored) */
  number: string;
  /** Tailwind gradient fallback when icon fails to load */
  gradient: string;
  hint: LocalizedString;
}

export interface TelegramUserContext {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export interface OrderPayload {
  game: GameId;
  itemId: string;
  itemLabel: string;
  amountTjs: number;
  playerId: string;
  wallet: WalletId;
  receiptDataUrl: string; // base64 data URL
  telegram?: TelegramUserContext;
  locale: Locale;
}
