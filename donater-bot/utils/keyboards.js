import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';

/**
 * Telegram Bot API inline `style` (raw send only).
 * API uses `destructive` (not `danger`) for red actions.
 */
const TG_STYLE = {
  danger: 'destructive',
  destructive: 'destructive',
  success: 'success',
  primary: 'primary',
};

export function btn(text, callbackData, style) {
  const b = { text, callback_data: callbackData };
  if (style) b.style = TG_STYLE[style] || style;
  return b;
}

/** Plain JSON main menu (games + settings + support callback). */
export function mainMenuKeyboardJson(games, t) {
  const list = games.length
    ? games
    : [
        { id: 1, emoji: '🔥', name: 'Free Fire' },
        { id: 2, emoji: '🎮', name: 'PUBG Mobile' },
      ];
  const rows = [];
  for (let i = 0; i < list.length; i += 2) {
    const a = list[i];
    const b = list[i + 1];
    const row = [];
    const styleA = gameRowStyle(a);
    row.push(
      btn(`${a.emoji} ${a.name}`.slice(0, 64), `nav:game:${a.id}`, styleA)
    );
    if (b) {
      row.push(
        btn(`${b.emoji} ${b.name}`.slice(0, 64), `nav:game:${b.id}`, gameRowStyle(b))
      );
    }
    rows.push(row);
  }
  rows.push([
    { text: t('settingsBtn'), callback_data: 'menu:settings' },
    { text: t('supportBtn'), callback_data: 'menu:support' },
  ]);
  return { inline_keyboard: rows };
}

function gameRowStyle(g) {
  const n = (g.name || '').toLowerCase();
  if (n.includes('free fire') || n.includes('freefire') || n === 'ff')
    return 'danger';
  if (n.includes('pubg')) return 'primary';
  return 'primary';
}

export function subscriptionInline(channelUrl, t) {
  return new InlineKeyboard()
    .url(t('btn_subscribe'), channelUrl)
    .row()
    .text(t('btn_i_subscribed'), 'sub:check');
}

export function cancelInline(t) {
  return new InlineKeyboard().text(t('cancel'), 'flow:cancel');
}

export function captchaKeyboard(salt, options) {
  const rows = [];
  for (const opt of options) {
    rows.push([
      btn(
        String(opt.label),
        `cap:${salt}:${opt.value}`,
        opt.correct ? 'success' : 'danger'
      ),
    ]);
  }
  return { inline_keyboard: rows };
}

export function productKeyboard(products, t) {
  const rows = [];
  for (const p of products) {
    let style = 'primary';
    if (p.is_popular) style = 'danger';
    else if (p.is_best_value) style = 'success';
    const line = `${p.is_popular ? '🔥 ' : ''}${p.is_best_value ? '⭐ ' : ''}${p.label} — ${p.price_tjs} смн`;
    rows.push([btn(line.slice(0, 64), `prod:${p.id}`, style)]);
  }
  rows.push([btn(t('back'), 'nav:games', undefined)]);
  return { inline_keyboard: rows };
}

export function paymentMethodsKeyboard(t) {
  return {
    inline_keyboard: [
      [btn(t('payment_dc'), 'pay:dc_city', 'primary')],
      [btn(t('payment_alif'), 'pay:alif', 'success')],
      [btn(t('payment_mc'), 'pay:mastercard', 'danger')],
      [btn(t('payment_milli'), 'pay:milli', 'primary')],
      [btn(t('back'), 'flow:back_summary', undefined)],
    ],
  };
}

export function confirmOrderKeyboard(t) {
  return {
    inline_keyboard: [
      [
        btn(t('confirm_yes'), 'order:confirm_yes', 'success'),
        btn(t('confirm_no'), 'order:confirm_no', 'danger'),
      ],
    ],
  };
}

export function settingsKeyboard(lang, t) {
  const ruMark = lang === 'ru' ? ' ✓' : '';
  const tjMark = lang === 'tj' ? ' ✓' : '';
  return new InlineKeyboard()
    .text(t('lang_ru') + ruMark, 'setlang:ru')
    .text(t('lang_tj') + tjMark, 'setlang:tj')
    .row()
    .text(t('main_menu'), 'menu:home');
}

export function adminPanelKeyboard(t) {
  return new InlineKeyboard()
    .text(t('admin_stats'), 'adm:stats')
    .row()
    .text(t('admin_orders'), 'adm:orders')
    .row()
    .text(t('admin_products'), 'adm:products')
    .row()
    .text(t('games_manage'), 'adm:games')
    .row()
    .text(t('admin_broadcast'), 'adm:broadcast');
}

export function orderFilterKeyboard(t) {
  return new InlineKeyboard()
    .text(t('orders_filter_new'), 'ordf:pending')
    .text(t('orders_filter_done'), 'ordf:accepted')
    .row()
    .text(t('orders_filter_rejected'), 'ordf:rejected')
    .row()
    .text(t('admin_back'), 'adm:home');
}

export function reviewAdminKb(reviewId, t) {
  return new InlineKeyboard()
    .text(t('review_btn_add'), `revok:${reviewId}`)
    .text(t('review_btn_edit'), `reved:${reviewId}`)
    .row()
    .text(t('review_btn_reject'), `revno:${reviewId}`);
}

export function broadcastPreviewKeyboard(t) {
  return new InlineKeyboard()
    .text(t('confirm_yes'), 'bc:send')
    .text(t('cancel'), 'bc:cancel');
}

export function paymentDetailKeyboard(number, t) {
  return {
    inline_keyboard: [
      [
        {
          text: t('copy_number'),
          copy_text: { text: String(number).replace(/\s/g, ' ') },
        },
      ],
    ],
  };
}

export function channelLink() {
  const ch = String(config.channelId || '').trim();
  if (!ch) return 'https://t.me/';
  if (ch.startsWith('@')) return `https://t.me/${ch.slice(1)}`;
  if (/^https?:\/\//i.test(ch)) return ch;
  if (ch.startsWith('-100')) return `https://t.me/c/${ch.replace('-100', '')}/1`;
  if (/^[A-Za-z][A-Za-z0-9_]{2,}$/.test(ch)) return `https://t.me/${ch}`;
  return 'https://t.me/';
}
