import type { OrderPayload } from '@/types';
import { escapeHtml, sanitizeHandle, bytesFromDataUrl } from './validation';

const TG_API = 'https://api.telegram.org';

interface TgConfig {
  token: string;
  chatId: string;
}

function getConfig(): TgConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

function fmtAmount(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n);
}

function buildCaption(order: OrderPayload, orderId: string): string {
  const handle = sanitizeHandle(order.telegram?.username);
  const name = [order.telegram?.firstName, order.telegram?.lastName]
    .filter(Boolean)
    .map((s) => escapeHtml(String(s)))
    .join(' ');

  const handleLine = handle ? `@${handle}` : 'нет';
  const nameLine = name ? `\n👤 <b>Имя:</b> ${name}` : '';
  const tgIdLine = order.telegram?.id ? `\n🆔 <b>TG ID:</b> <code>${order.telegram.id}</code>` : '';

  const game = order.game === 'freefire' ? 'Free Fire' : 'PUBG Mobile';
  const wallet =
    order.wallet === 'dc' ? 'DC City' :
    order.wallet === 'alif' ? 'Alif Mobi' :
    order.wallet === 'mastercard' ? 'Mastercard' :
    'Корти милли';

  return [
    `🛒 <b>Новый заказ</b> <code>#${escapeHtml(orderId)}</code>`,
    ``,
    `🎮 <b>Игра:</b> ${escapeHtml(game)}`,
    `📦 <b>Пакет:</b> ${escapeHtml(order.itemLabel)}`,
    `💰 <b>Сумма:</b> ${fmtAmount(order.amountTjs)} TJS`,
    `🆔 <b>Player ID:</b> <code>${escapeHtml(order.playerId)}</code>`,
    `💳 <b>Кошелёк:</b> ${escapeHtml(wallet)}`,
    ``,
    `👥 <b>Telegram:</b> ${escapeHtml(handleLine)}${nameLine}${tgIdLine}`,
    `🌐 <b>Локаль:</b> ${escapeHtml(order.locale)}`,
  ].join('\n');
}

/** Send the order with the receipt photo to the admin chat. */
export async function sendOrderToTelegram(
  order: OrderPayload,
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getConfig();
  if (!cfg) {
    return { ok: false, error: 'Telegram bot is not configured on the server' };
  }

  const caption = buildCaption(order, orderId);
  const photo = bytesFromDataUrl(order.receiptDataUrl);
  if (!photo) {
    return { ok: false, error: 'Invalid receipt image' };
  }

  // Use multipart/form-data via Web FormData/Blob (works in Node 18+ / Edge)
  const form = new FormData();
  form.set('chat_id', cfg.chatId);
  form.set('caption', caption);
  form.set('parse_mode', 'HTML');

  const blob = new Blob([new Uint8Array(photo.buffer)], { type: photo.mime });
  form.set('photo', blob, `receipt-${orderId}.${photo.mime.split('/')[1] || 'jpg'}`);

  const res = await fetch(`${TG_API}/bot${cfg.token}/sendPhoto`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Telegram error ${res.status}: ${text.slice(0, 200)}` };
  }
  return { ok: true };
}

/** Generate a short, human-friendly order id like "TJ-7K3M9X" */
export function newOrderId(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TJ-${id}`;
}
