/**
 * Forwards validated orders to the Python TopUpTJ_Bot HTTP ingest.
 * Set ORDER_INGEST_URL and INTERNAL_API_SECRET in Next.js / Vercel env (same secret as the bot).
 *
 * CORS: the browser only calls same-origin `/api/submit`; this fetch runs on the Node server,
 * so the bot does not need CORS headers for this integration.
 */

import type { OrderPayload } from '@/types';

/** Full ingest URL or bot base URL (https://host — trailing slash optional). */
export function resolveOrderIngestUrl(): string | undefined {
  const raw = process.env.ORDER_INGEST_URL?.trim();
  if (!raw) return undefined;
  const base = raw.replace(/\/+$/, '');
  if (base.endsWith('/internal/orders')) return base;
  return `${base}/internal/orders`;
}

export async function submitOrderToBotIngest(
  orderId: string,
  order: OrderPayload
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = resolveOrderIngestUrl();
  const key = process.env.INTERNAL_API_SECRET?.trim();
  if (!url || !key) {
    return { ok: false, status: 0, body: { error: 'ingest not configured' } };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': key,
    },
    signal: AbortSignal.timeout(25_000),
    body: JSON.stringify({
      orderId,
      game: order.game,
      itemLabel: order.itemLabel,
      amountTjs: order.amountTjs,
      playerId: order.playerId,
      wallet: order.wallet,
      locale: order.locale,
      receiptDataUrl: order.receiptDataUrl,
      telegram: order.telegram
        ? {
            id: order.telegram.id,
            username: order.telegram.username,
            firstName: order.telegram.firstName,
            lastName: order.telegram.lastName,
            languageCode: order.telegram.languageCode,
          }
        : undefined,
    }),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { ok: res.ok, status: res.status, body };
}
