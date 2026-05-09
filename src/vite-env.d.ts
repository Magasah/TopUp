/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SELLER_USERNAME: string;
  readonly VITE_RUB_TO_TJS: string;
  readonly VITE_MARKUP_LOW_PCT: string;
  readonly VITE_MARKUP_MID_PCT: string;
  readonly VITE_MARKUP_HIGH_PCT: string;
  readonly VITE_FLAT_PROFIT_TJS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
