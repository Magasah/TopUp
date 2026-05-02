import { NextResponse } from 'next/server';
import {
  ALLOWED_GAMES,
  ALLOWED_LOCALES,
  ALLOWED_WALLETS,
  isValidImageDataUrl,
  isValidPlayerId,
  sanitizeHandle,
} from '@/lib/validation';
import { submitOrderToBotIngest } from '@/lib/order-ingest';
import { newOrderId, sendOrderToTelegram } from '@/lib/telegram';
import { getGame } from '@/lib/games';
import type { OrderPayload } from '@/types';

// Use the Node.js runtime so we can stream FormData with Buffers reliably.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Body limit safeguard (~7 MB to fit a 5 MB base64 image)
const MAX_BODY = 7 * 1024 * 1024;

// ----- Tiny in-memory rate limit (per IP, per minute) -----
// In production, swap for Upstash Redis or Vercel KV.
const RATE_BUCKET = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 6;     // requests
const RATE_WINDOW = 60_000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_BUCKET.get(ip);
  if (!entry || entry.reset < now) {
    RATE_BUCKET.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  // Reject anything not JSON early
  const ctype = req.headers.get('content-type') || '';
  if (!ctype.includes('application/json')) {
    return NextResponse.json(
      { ok: false, error: 'Unsupported content type' },
      { status: 415 }
    );
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  let body: Partial<OrderPayload>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed JSON' }, { status: 400 });
  }

  // ---------- Validate every field ----------
  if (!body.game || !ALLOWED_GAMES.includes(body.game as any)) {
    return bad('Invalid game');
  }
  if (!body.wallet || !ALLOWED_WALLETS.includes(body.wallet as any)) {
    return bad('Invalid wallet');
  }
  if (!body.locale || !ALLOWED_LOCALES.includes(body.locale as any)) {
    return bad('Invalid locale');
  }
  if (!body.playerId || typeof body.playerId !== 'string' || !isValidPlayerId(body.playerId)) {
    return bad('Invalid Player ID');
  }
  if (!body.itemId || typeof body.itemId !== 'string') {
    return bad('Invalid item id');
  }

  // Verify item belongs to the game (and re-derive trusted price/label server-side)
  const game = getGame(body.game);
  const item = game?.items.find((i) => i.id === body.itemId);
  if (!game || !item) return bad('Unknown item');

  if (!body.receiptDataUrl || !isValidImageDataUrl(body.receiptDataUrl)) {
    return bad('Invalid receipt image');
  }

  // Sanitise telegram context (untrusted client-supplied)
  const tg = body.telegram
    ? {
        id: typeof body.telegram.id === 'number' ? body.telegram.id : undefined,
        username: sanitizeHandle(body.telegram.username),
        firstName:
          typeof body.telegram.firstName === 'string'
            ? body.telegram.firstName.slice(0, 64)
            : undefined,
        lastName:
          typeof body.telegram.lastName === 'string'
            ? body.telegram.lastName.slice(0, 64)
            : undefined,
        languageCode:
          typeof body.telegram.languageCode === 'string'
            ? body.telegram.languageCode.slice(0, 8)
            : undefined,
      }
    : undefined;

  const order: OrderPayload = {
    game: body.game,
    itemId: item.id,
    itemLabel: typeof item.label === 'string' ? item.label : item.label[body.locale || 'ru'],
    amountTjs: item.priceTjs, // server-trusted
    playerId: body.playerId,
    wallet: body.wallet,
    receiptDataUrl: body.receiptDataUrl,
    telegram: tg,
    locale: body.locale,
  };

  const orderId = newOrderId();

  // ---------- Prefer Python bot ingest (DB + admin inline buttons) ----------
  const ingest = await submitOrderToBotIngest(orderId, order);
  if (process.env.ORDER_INGEST_URL && process.env.INTERNAL_API_SECRET) {
    if (!ingest.ok) {
      console.error('[submit] bot ingest error:', ingest.status, ingest.body);
      return NextResponse.json(
        { ok: false, error: 'Order could not be delivered to the bot. Try again later.' },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, orderId });
  }

  // ---------- Fallback: direct Telegram sendPhoto (legacy) ----------
  const result = await sendOrderToTelegram(order, orderId);
  if (!result.ok) {
    console.error('[submit] telegram error:', result.error);
    return NextResponse.json(
      { ok: false, error: 'Order accepted locally, but admin notification failed.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, orderId });
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
