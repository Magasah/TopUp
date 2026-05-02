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
- **Multi-step flow:** Game → Pack → Player ID → Payment → Receipt → Done.
- **Hardened input validation** — numeric-only Player ID, regex enforced both
  client- and server-side; HTML escaping for Telegram messages; image MIME and
  size checks; whitelisted enums; in-memory rate limiting.
- **Telegram Bot integration** — sends a single message with the receipt photo
  and an HTML caption containing Game · Pack · Amount · Player ID · Wallet ·
  Telegram handle.
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
| Backend      | Next.js Route Handler `/api/submit` (Node runtime)  |
| Bot dispatch | Telegram **`sendPhoto`** via FormData                |

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Fill TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID
# Optionally override NEXT_PUBLIC_WALLET_*

# 3. Run dev server (http://localhost:3000)
npm run dev

# 4. Production build
npm run build && npm start
```

### Required environment variables

| Var                        | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`       | Token from [@BotFather](https://t.me/BotFather)               |
| `TELEGRAM_ADMIN_CHAT_ID`   | Numeric chat id that will receive new orders                  |
| `NEXT_PUBLIC_WALLET_DC`          | DC City phone shown to the buyer                         |
| `NEXT_PUBLIC_WALLET_ALIF`      | Alif Mobi phone                                           |
| `NEXT_PUBLIC_WALLET_MASTERCARD`| Mastercard number                                         |
| `NEXT_PUBLIC_WALLET_MILLI`     | Корти милли number                                        |

Get your chat id by messaging your bot once and visiting:
`https://api.telegram.org/bot<TOKEN>/getUpdates`

---

## 📲 Telegram Mini App setup

1. Create a bot via **@BotFather** → `/newbot`.
2. Run `/newapp`, attach your bot, set the **Web App URL** to your deployment
   (production: `https://top-up-opal.vercel.app`).
3. Add a menu button: `/setmenubutton` → set the same URL.
4. The app calls `Telegram.WebApp.ready()`, `expand()`, sets header/background
   color to `#0a0a0b`, and reads the user from `initDataUnsafe.user`. The
   user's handle is forwarded with every order.

---

## 🔐 Security model

- **Player ID** must match `^[0-9]{6,14}$`. Pasting strips non-digits before
  validation. Validated again server-side.
- **Whitelisted enums** for `game`, `wallet`, `locale` — anything else returns
  `400`.
- **Server re-derives** `itemLabel` and `amountTjs` from the catalog so the
  client cannot inflate or change pricing.
- **Receipt** must be a `data:image/(png|jpe?g|webp);base64,...` URL; the
  decoded payload size is capped at **5 MB**.
- **HTML escaping** of every user-supplied string before injecting into the
  Telegram caption (which uses `parse_mode=HTML`). XSS into the bot is
  impossible.
- **No SQL** in this repo. If you add a database, parameterize all queries —
  do not concatenate strings.
- **Rate limiting** — 6 requests / minute / IP via in-memory bucket. For
  serverless production, swap `RATE_BUCKET` for **Upstash Redis** or
  **Vercel KV**.
- **Headers** — `X-Frame-Options: ALLOWALL` (required for Telegram Mini Apps),
  `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`.

---

## 🗂 Project structure

```
app/
  api/submit/route.ts   ← Order endpoint (validation + Telegram dispatch)
  globals.css           ← Liquid Glass + neon design system
  layout.tsx            ← Loads Telegram WebApp SDK, viewport
  page.tsx              ← Main multi-step checkout flow
components/
  GlassPanel.tsx        ← Liquid Glass surface primitive
  NeonButton.tsx        ← Premium button with sheen + glow
  GameCard.tsx          ← Big glowing game cards
  PriceCard.tsx         ← Price tile with shimmer
  PlayerIdInput.tsx     ← Hardened numeric input
  WalletCard.tsx        ← Payment method + Copy row
  ReceiptUpload.tsx     ← Drag/drop screenshot uploader
  StepIndicator.tsx     ← Animated progress pills
  LanguageToggle.tsx    ← RU / TJ toggle (layout-animated)
  OrderSummary.tsx      ← Sticky-ish order recap
lib/
  i18n.ts               ← Russian + Tajik strings, detection
  games.ts              ← Free Fire / PUBG catalog & prices
  wallets.ts            ← DC / Alif / Mastercard / Milli config
  validation.ts         ← Regex, sanitizers, escapers
  telegram.ts           ← sendPhoto with HTML caption
  cn.ts                 ← classnames helper
types/
  index.ts              ← Shared TS types
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
3. Add the 5 environment variables in **Project → Settings → Environment Variables**.
4. Deploy. The route `/api/submit` runs on the **Node.js** runtime.

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

`itemLabel` and `amountTjs` are re-read from this file server-side, so prices
can never be tampered with from the client.

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
