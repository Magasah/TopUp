# TopUp.TJ — Premium Game Top-Up for Tajikistan

A high-end, mobile-first web app for topping up **Free Fire** and **PUBG Mobile** in
Tajikistan. The visual language is a fusion of **iOS 26/27 "Liquid Glass"** with
**cyberpunk neon** — designed to feel expensive, fast, and trustworthy. Optimized
for embedding as a **Telegram Mini App (Web App)** and deployable to **Vercel**
or **Railway** as a single Next.js project.

> Languages: **Русский** and **Тоҷикӣ** · Currency: **TJS (сомонӣ)**

---

## ✨ Highlights

- **iOS Liquid Glass surfaces** — backdrop blur + saturate, hairline borders,
  specular highlights, soft shadows.
- **Cyberpunk neon accents** — Electric Blue, Magenta, Acid Green; animated
  conic-gradient borders, glow pulses, shimmer text.
- **Smooth, springy transitions** powered by Framer Motion.
- **Multi-step flow:** Game → Pack → Player ID → Payment → **checkout in bot**
  (Mini App sends JSON via `Telegram.WebApp.sendData`, then closes; the user
  sends the payment screenshot in the Telegram chat).
- **Hardened input validation** — numeric-only Player ID (6–14 digits) in the UI;
  catalog and prices ship with the app (your Python bot should re-validate).
- **No Vercel API for orders** — no `/api/submit`, no server-side Telegram calls
  from this repo; avoids 502s and keeps secrets on the bot host only.
- **Locale auto-detect** from Telegram WebApp `language_code` with manual toggle.
- **Mobile-first**, safe-area aware, no horizontal scroll, uses `100dvh`.

---

## 🧱 Tech Stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | **Next.js 14** (App Router, RSC + Client islands)   |
| Language     | **TypeScript** strict                                |
| Styling      | **Tailwind CSS 3** + custom CSS layer for glassmorphism |
| Animation    | **Framer Motion 11**                                 |
| Checkout     | **`Telegram.WebApp.sendData`** + **`close()`** → your aiogram bot |
| Backend API  | _None for orders_ (static UI + client-side catalog)              |

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure env (optional wallet overrides)
cp .env.example .env.local

# 3. Run dev server (http://localhost:3000)
npm run dev

# 4. Production build
npm run build && npm start
```

### Environment variables

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_WALLET_*` | Optional overrides for displayed wallet numbers |
| `NEXT_PUBLIC_WEB_APP_URL` | Documentation / parity with BotFather URL |

Bot token, admin IDs, and ingest live in **[TopUp-Bot](https://github.com/Magasah/TopUp-Bot)** (Python), not in this frontend repo.

---

## 📲 Telegram Mini App setup

1. Create a bot via **@BotFather** → `/newbot`.
2. Run `/newapp`, attach your bot, set the **Web App URL** to your deployment
   (production: `https://top-up-opal.vercel.app`).
3. Add a menu button: `/setmenubutton` → set the same URL.
4. The app calls `Telegram.WebApp.ready()`, `expand()`, sets header/background
   color to `#0a0a0b`, reads `initDataUnsafe.user`, and on checkout calls
   `sendData(JSON.stringify(order))` then `close()` so the bot can ask for the receipt in chat.

---

## 🔐 Security model

- **Player ID** in the UI: `^[0-9]{6,14}$`. The bot should validate again.
- **Payload** to the bot is JSON from the client (max **4096** bytes per Telegram).
  Treat amounts and catalog as untrusted until the bot checks them.
- **Receipt images** are **not** uploaded from this web app; users send photos in Telegram.
- **No bot token** in this repository — only in your bot deployment.
- **Headers** — `X-Frame-Options: ALLOWALL` (Telegram Mini App), `X-Content-Type-Options: nosniff`, etc. (`next.config.js`).

---

## 🗂 Project structure

```
app/
  globals.css           ← Liquid Glass + neon design system
  layout.tsx            ← Loads Telegram WebApp SDK, viewport
  page.tsx              ← Catalog + checkout via sendData / close
components/
  GlassPanel.tsx        ← Liquid Glass surface primitive
  NeonButton.tsx        ← Premium button with sheen + glow
  GameCard.tsx          ← Big glowing game cards
  ProductCard.tsx       ← Pack tiles
  PlayerIdInput.tsx     ← Hardened numeric input
  WalletCard.tsx        ← Payment method + Copy row
  StepIndicator.tsx     ← Progress pills
  LanguageToggle.tsx    ← RU / TJ toggle
  OrderSummary.tsx      ← Order recap
lib/
  i18n.ts               ← Russian + Tajik strings, detection
  games.ts              ← Free Fire / PUBG catalog & prices
  wallets.ts            ← DC / Alif / Mastercard / Milli config
  validation.ts         ← Player ID validation helpers
  cn.ts                 ← classnames helper
types/
  index.ts              ← Shared TS types (incl. WebAppOrderData)
public/
  games/        ← `freefire.png` / `pubg.png` (+ SVG fallback)
  cards/        ← `dc.png`, `alif.png`, `mastercard.png`, `milli.png`
  Gemini_Generated_Image_*.png  ← site logo (favicon + header)
  favicon.svg
```

---

## 🚢 Deployment

### Vercel (recommended)

1. Push the repo to GitHub.
2. Import into Vercel — framework is auto-detected.
3. Add any `NEXT_PUBLIC_*` overrides in **Project → Settings → Environment Variables**.
4. Deploy — static/UI only; no order API route on Vercel.

### Railway

1. New project from this repo.
2. Build command: `npm ci && npm run build`
3. Start command: `npm start`
4. Add env vars. Done.

No custom domain is required to test — both platforms give a working HTTPS URL
that you can paste straight into BotFather as the Web App URL.

---

## 🧩 Adding more games or packs

Edit `lib/games.ts`. Each item is:

```ts
{ id: 'pubg-660', label: '660 UC', priceTjs: 105, popular: true }
```

Publish price changes by redeploying the Mini App; the bot should still verify
amounts against its own catalog when processing `web_app_data`.

---

## 🧠 Design notes (the "expensive" feel)

- Backgrounds layer a slow-shifting **aurora** (radial gradients) under a fine
  **SVG noise** texture — this is what makes the dark UI feel premium instead
  of flat.
- Every surface uses a **specular highlight** (`::before` linear gradient with
  `mix-blend-mode: screen`) — the trademark iOS 26/27 glass look.
- Hairline neon borders are an **animated conic-gradient** masked into a
  1px ring (`@property --angle` for buttery rotation).
- Buttons have a **swept sheen** that travels across on hover, plus a tactile
  **spring tap**. Inputs glow green when valid, red when invalid.
- Fonts default to **SF Pro Display / Text** with `letter-spacing: -0.012em`
  and OpenType stylistic sets — exactly how iOS renders.

---

## 📜 License

MIT — do whatever you want, but please don't ship it as-is to ripoff users.
Keep wallets up to date and respond to orders within minutes.
