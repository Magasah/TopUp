# Security

## This repository (Mini App)

- **No Telegram bot token** is required for the Next.js app. Checkout uses
  **`Telegram.WebApp.sendData`** only; secrets stay on your **Python bot** host
  ([TopUp-Bot](https://github.com/Magasah/TopUp-Bot)).
- **Never** commit real `.env.local` values if you add any private keys later.

## Bot token (on the bot server only)

- Store **`BOT_TOKEN`** only in the bot’s environment (VPS, PaaS, `.env` on the
  bot machine — gitignored).
- If a token was exposed: [@BotFather](https://t.me/BotFather) → revoke / new token.

## Payment details

Wallet numbers shown in the UI are **public** for copy/paste checkout UX.
Users send payment proof as **photos in Telegram**, not through this web app.
