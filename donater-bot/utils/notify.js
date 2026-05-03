import { config } from '../config.js';
import { statsSummary } from '../database/db.js';
import { escapeHtml } from './formatter.js';
import {
  sendMessageRaw,
  sendPhotoRaw,
  adminOrderActionKeyboard,
  reviewAdminKeyboardRaw,
} from './tg_api.js';

/**
 * @param {import('grammy').Api} _api unused — отправка через raw tg_api
 */
export async function notifyAdminsNewOrder(_api, order, receiptFileId, i18n) {
  const o = order;
  const username = (o.username || 'no_username').replace(/[<>&]/g, '');
  const text = i18n('order_card_admin', {
    id: o.id,
    username,
    game: o.game_name,
    product: o.product_label,
    price: o.price_tjs,
    accountId: o.game_account_id,
    payment: o.payment_method,
  });

  const kb = adminOrderActionKeyboard(i18n, o.id, o.user_tg_id);

  for (const adminId of config.adminIds) {
    try {
      if (receiptFileId) {
        await sendPhotoRaw(adminId, receiptFileId, text, {
          parse_mode: 'HTML',
          reply_markup: kb,
        });
      } else {
        await sendMessageRaw(adminId, text, {
          parse_mode: 'HTML',
          reply_markup: kb,
        });
      }
    } catch (e) {
      console.error('notify admin', adminId, e?.message || e);
    }
  }
}

export async function notifyUserOrderDone(api, tgId, orderId, i18n) {
  try {
    await api.sendMessage(tgId, i18n('order_done', { id: orderId }), {
      parse_mode: 'HTML',
    });
  } catch (e) {
    console.error('notify user done', e.message);
  }
}

export async function notifyUserOrderRejected(api, tgId, orderId, reason, i18n) {
  try {
    await api.sendMessage(
      tgId,
      i18n('order_rejected', { id: orderId, reason: reason || '—' }),
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    console.error('notify user reject', e.message);
  }
}

export function formatStatsText(i18n) {
  const s = statsSummary();
  const fmt = (n) => Number(n).toLocaleString('ru-RU');
  return (
    `${i18n('stats_title')}\n────────────────\n` +
    `👥 ${i18n('stats_users_total')}: ${fmt(s.usersTotal)}\n` +
    `📅 ${i18n('stats_today')}: +${fmt(s.usersToday)}\n` +
    `📅 ${i18n('stats_month')}: +${fmt(s.usersMonth)}\n` +
    `📅 ${i18n('stats_year')}: +${fmt(s.usersYear)}\n` +
    `────────────────\n` +
    `📦 ${i18n('stats_orders_total')}: ${fmt(s.ordersTotal)}\n` +
    `✅ ${i18n('stats_done')}: ${fmt(s.accepted)}\n` +
    `⏳ ${i18n('stats_pending')}: ${fmt(s.pending)}\n` +
    `❌ ${i18n('stats_rejected')}: ${fmt(s.rejected)}\n` +
    `────────────────\n` +
    `💰 ${i18n('stats_rev_month')}: ${fmt(s.revenueMonth)} смн\n` +
    `💰 ${i18n('stats_rev_all')}: ${fmt(s.revenueAll)} смн`
  );
}

/**
 * @param {import('grammy').Api} _api unused
 */
export async function notifyAdminsReview(_api, review, order, i18n) {
  const text = i18n('review_admin_card', {
    username: (order.username || '—').replace(/[<>&]/g, ''),
    orderId: order.id,
    product: order.product_label,
    game: order.game_name,
    text: escapeHtml(review.text.slice(0, 500)),
  });
  const kb = reviewAdminKeyboardRaw(review.id, i18n);

  for (const adminId of config.adminIds) {
    try {
      await sendMessageRaw(adminId, text, {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    } catch (e) {
      console.error('notify review admin', e?.message || e);
    }
  }
}
