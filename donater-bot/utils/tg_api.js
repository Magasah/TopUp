/**
 * Raw Telegram Bot API calls (JSON + multipart) so inline button `style`
 * is sent without Grammy stripping/validating unknown fields.
 */
import { createReadStream } from 'fs';
import { existsSync } from 'fs';
import { basename } from 'path';
import FormData from 'form-data';
import { config } from '../config.js';

function baseUrl() {
  return `https://api.telegram.org/bot${config.botToken}`;
}

async function parseResponse(res) {
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { ok: false, description: text };
  }
  if (!res.ok || json.ok === false) {
    console.error('tg_api error', res.status, json.description || json);
  }
  return json;
}

/**
 * @param {number|string} chatId
 * @param {string} text
 * @param {{ parse_mode?: string, reply_markup?: object, disable_web_page_preview?: boolean }} [opts]
 */
export async function sendMessageRaw(chatId, text, opts = {}) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode ?? 'HTML',
  };
  if (opts.reply_markup) body.reply_markup = opts.reply_markup;
  if (opts.disable_web_page_preview != null) {
    body.disable_web_page_preview = opts.disable_web_page_preview;
  }
  const res = await fetch(`${baseUrl()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

/**
 * @param {number|string} chatId
 * @param {string} photo file_id or local filesystem path
 * @param {string} caption
 * @param {{ parse_mode?: string, reply_markup?: object }} [opts]
 */
export async function sendPhotoRaw(chatId, photo, caption, opts = {}) {
  const parseMode = opts.parse_mode ?? 'HTML';
  const replyMarkup = opts.reply_markup;

  const isLocalPath =
    typeof photo === 'string' &&
    photo.length > 0 &&
    (photo.includes('/') || photo.includes('\\') || photo.startsWith('file:'));

  if (!isLocalPath) {
    const body = {
      chat_id: chatId,
      photo,
      caption,
      parse_mode: parseMode,
    };
    if (replyMarkup) body.reply_markup = replyMarkup;
    const res = await fetch(`${baseUrl()}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  }

  if (!existsSync(photo)) {
    console.error('tg_api sendPhotoRaw: file missing', photo);
    return sendMessageRaw(chatId, caption || '', { ...opts, parse_mode: parseMode });
  }

  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('photo', createReadStream(photo), { filename: basename(photo) });
  form.append('caption', caption ?? '');
  form.append('parse_mode', parseMode);
  if (replyMarkup) {
    form.append('reply_markup', JSON.stringify(replyMarkup));
  }
  const res = await fetch(`${baseUrl()}/sendPhoto`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
  return parseResponse(res);
}

/**
 * @param {number|string} chatId
 * @param {number} messageId
 * @param {string} text
 * @param {{ parse_mode?: string, reply_markup?: object }} [opts]
 */
export async function editMessageTextRaw(chatId, messageId, text, opts = {}) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: opts.parse_mode ?? 'HTML',
  };
  if (opts.reply_markup) body.reply_markup = opts.reply_markup;
  const res = await fetch(`${baseUrl()}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

/**
 * Admin order / review inline keyboard with styled buttons (raw JSON).
 */
export function adminOrderActionKeyboard(i18n, orderId, userTgId) {
  return {
    inline_keyboard: [
      [
        { text: i18n('btn_accept'), callback_data: `adm:acc:${orderId}`, style: 'success' },
        { text: i18n('btn_reject'), callback_data: `adm:rej:${orderId}`, style: 'destructive' },
      ],
      [{ text: i18n('btn_write_user'), url: `tg://user?id=${userTgId}` }],
    ],
  };
}

export function reviewAdminKeyboardRaw(reviewId, t) {
  return {
    inline_keyboard: [
      [
        { text: t('review_btn_add'), callback_data: `revok:${reviewId}`, style: 'success' },
        { text: t('review_btn_edit'), callback_data: `reved:${reviewId}`, style: 'primary' },
      ],
      [{ text: t('review_btn_reject'), callback_data: `revno:${reviewId}`, style: 'destructive' }],
    ],
  };
}
