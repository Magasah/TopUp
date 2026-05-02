/**
 * Forwards validated orders to the Python TopUpTJ_Bot HTTP ingest (photo + admin buttons).
 * Set ORDER_INGEST_URL and INTERNAL_API_SECRET in Next.js env (same secret as the bot).
 */

import type { OrderPayload } from '@/types';

export async function submitOrderToBotIngest(
  orderId: string,
  order: OrderPayload
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = process.env.ORDER_INGEST_URL?.trim();
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
