# Security

## Telegram bot token

- Store **`TELEGRAM_BOT_TOKEN`** only in **environment variables** (Vercel / Railway / `.env.local` on your machine).
- **Never** commit the token to git, paste it into frontend code, or share it in chat — anyone with the token controls your bot.

If a token was exposed:

1. Open [@BotFather](https://t.me/BotFather) → `/revoke` or regenerate the token for this bot.
2. Update the secret on every deployment target.

## Payment details

Card numbers and wallet IDs are **public for checkout UX** but treat **`TELEGRAM_ADMIN_CHAT_ID`** as sensitive — it determines where orders are delivered.
