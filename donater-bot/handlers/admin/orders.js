import { Composer } from 'grammy';
import {
  orderById,
  orderAccept,
  orderReject,
  ordersListFiltered,
  orderCountByStatus,
} from '../../database/db.js';
import {
  notifyUserOrderDone,
  notifyUserOrderRejected,
} from '../../utils/notify.js';
import { orderFilterKeyboard } from '../../utils/keyboards.js';
import {
  sendMessageRaw,
  sendPhotoRaw,
  adminOrderActionKeyboard,
} from '../../utils/tg_api.js';

export const adminOrdersComposer = new Composer();

const PAGE = 8;

function shortPay(m) {
  if (m === 'dc_city') return 'DC';
  if (m === 'alif') return 'Alif';
  if (m === 'mastercard') return 'MC';
  if (m === 'milli') return 'Milli';
  return m;
}

function buildOrderListMarkup(ctx, st, safePage, totalPages, rows2) {
  const fk = orderFilterKeyboard(ctx.i18n).inline_keyboard;
  const rows = [];
  for (const r of rows2) {
    const line = ctx
      .i18n('order_row', {
        id: r.id,
        username: r.username || '—',
        product: (r.product_label || '').slice(0, 18),
        price: r.price_tjs,
        pay: shortPay(r.payment_method),
      })
      .slice(0, 60);
    rows.push([{ text: line, callback_data: `ordo:${r.id}` }]);
  }
  const prevCb = safePage <= 0 ? 'ordpg:nop' : `ordpg:${safePage - 1}`;
  const nextCb =
    safePage >= totalPages - 1 ? 'ordpg:nop' : `ordpg:${safePage + 1}`;
  rows.push([
    { text: '◀️', callback_data: prevCb },
    {
      text: `${safePage + 1}/${totalPages}`,
      callback_data: 'ordpg:nop',
    },
    { text: '▶️', callback_data: nextCb },
  ]);
  rows.push([{ text: ctx.i18n('admin_back'), callback_data: 'adm:home' }]);
  return { inline_keyboard: [...fk, ...rows] };
}

async function showOrderList(ctx) {
  const st = ctx.session.adminOrderFilter || 'pending';
  let page = Math.max(0, ctx.session.adminOrderPage || 0);
  const total = orderCountByStatus(st);
  const totalPages = Math.max(1, Math.ceil(total / PAGE) || 1);
  if (page > totalPages - 1) page = totalPages - 1;
  ctx.session.adminOrderPage = page;

  const offset = page * PAGE;
  const rows2 = ordersListFiltered(st, PAGE, offset);

  const header = `${ctx.i18n('admin_orders')} — <b>${st}</b> (${total})\n`;
  const body = rows2.length ? '' : `\n${ctx.i18n('orders_empty')}`;
  const markup = buildOrderListMarkup(ctx, st, page, totalPages, rows2);

  await ctx.reply(header + body, {
    parse_mode: 'HTML',
    reply_markup: markup,
  });
}

adminOrdersComposer.callbackQuery('adm:orders', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    ctx.session.adminOrderFilter = 'pending';
    ctx.session.adminOrderPage = 0;
    await showOrderList(ctx);
  } catch (e) {
    console.error(e);
  }
});

adminOrdersComposer.callbackQuery(/^ordf:(pending|accepted|rejected)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    ctx.session.adminOrderFilter = ctx.match[1];
    ctx.session.adminOrderPage = 0;
    await showOrderList(ctx);
  } catch (e) {
    console.error(e);
  }
});

adminOrdersComposer.callbackQuery(/^ordpg:(nop|-?\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    if (ctx.match[1] === 'nop') return;
    const p = parseInt(ctx.match[1], 10);
    if (p < 0) return;
    ctx.session.adminOrderPage = p;
    await showOrderList(ctx);
  } catch (e) {
    console.error(e);
  }
});

adminOrdersComposer.callbackQuery(/^ordo:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const id = parseInt(ctx.match[1], 10);
    const o = orderById(id);
    if (!o) return;
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const kb = adminOrderActionKeyboard(ctx.i18n, o.id, o.user_tg_id);
    const cap = ctx.i18n('order_card_admin', {
      id: o.id,
      username: o.username || '—',
      game: o.game_name,
      product: o.product_label,
      price: o.price_tjs,
      accountId: o.game_account_id,
      payment: o.payment_method,
    });
    if (o.receipt_file_id) {
      await sendPhotoRaw(chatId, o.receipt_file_id, cap, {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    } else {
      await sendMessageRaw(chatId, cap, {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    }
  } catch (e) {
    console.error(e);
  }
});

adminOrdersComposer.callbackQuery(/^adm:acc:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const id = parseInt(ctx.match[1], 10);
    const o = orderById(id);
    if (!o || o.status !== 'pending') return;
    orderAccept(id);
    await notifyUserOrderDone(ctx.api, o.user_tg_id, id, ctx.i18n);
    await ctx.reply(ctx.i18n('order_accepted_notify'));
  } catch (e) {
    console.error(e);
  }
});

adminOrdersComposer.callbackQuery(/^adm:rej:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const id = parseInt(ctx.match[1], 10);
    ctx.session.adminRejectOrderId = id;
    ctx.session.step = 'admin_reject_reason';
    await ctx.reply(ctx.i18n('reject_reason_prompt'));
  } catch (e) {
    console.error(e);
  }
});

adminOrdersComposer.on('message:text', async (ctx, next) => {
  try {
    if (ctx.session.step !== 'admin_reject_reason') return next();
    const id = ctx.session.adminRejectOrderId;
    const reason = (ctx.message.text || '').trim().slice(0, 500);
    ctx.session.step = null;
    ctx.session.adminRejectOrderId = null;
    const o = orderById(id);
    if (!o) return;
    orderReject(id, reason);
    await notifyUserOrderRejected(ctx.api, o.user_tg_id, id, reason, ctx.i18n);
    await ctx.reply(ctx.i18n('order_rejected_notify'));
  } catch (e) {
    console.error(e);
  }
});
