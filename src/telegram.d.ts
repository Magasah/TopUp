export {};

declare global {
  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: Record<string, unknown>;
    version: string;
    platform: string;
    colorScheme: "light" | "dark";
    themeParams: Record<string, string | undefined>;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    ready: () => void;
    expand: () => void;
    close: () => void;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
    openTelegramLink: (url: string) => void;
  }

  interface Telegram {
    WebApp: TelegramWebApp;
  }

  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
