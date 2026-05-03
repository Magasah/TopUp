import { Composer } from 'grammy';
import { reviewById, reviewSetStatus, reviewUpdateText, orderById } from '../../database/db.js';
import { config } from '../../config.js';
import { escapeHtml } from '../../utils/formatter.js';

export const adminReviewsComposer = new Composer();

adminReviewsComposer.callbackQuery(/^revok:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const id = parseInt(ctx.match[1], 10);
    const r = reviewById(id);
    if (!r || r.status !== 'pending') return;
    const o = r.order_id ? orderById(r.order_id) : null;
    const un = o?.username || 'user';
    const game = o?.game_name || '—';
    const product = o?.product_label || '—';
    const body =
      `⭐ <b>Отзыв покупателя</b>\n` +
      `👤 @${escapeHtml(un)}\n` +
      `🎮 ${escapeHtml(game)} — ${escapeHtml(product)}\n\n` +
      `<i>${escapeHtml(r.text)}</i>\n\n` +
      `#Выполнено #Review`;
    const ch = config.reviewsChannel;
    if (!ch) {
      await ctx.reply('REVIEWS_CHANNEL not set');
      return;
    }
    const sent = await ctx.api.sendMessage(ch, body, { parse_mode: 'HTML' });
    reviewSetStatus(id, 'approved', sent.message_id);
    await ctx.reply(ctx.i18n('review_publish_prompt'));
  } catch (e) {
    console.error(e);
  }
});

adminReviewsComposer.callbackQuery(/^revno:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const id = parseInt(ctx.match[1], 10);
    reviewSetStatus(id, 'rejected', null);
    await ctx.reply(ctx.i18n('review_rejected'));
  } catch (e) {
    console.error(e);
  }
});

adminReviewsComposer.callbackQuery(/^reved:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const id = parseInt(ctx.match[1], 10);
    ctx.session.step = 'admin_review_edit';
    ctx.session.adminReviewEditId = id;
    await ctx.reply(ctx.i18n('review_edited_prompt'));
  } catch (e) {
    console.error(e);
  }
});

adminReviewsComposer.on('message:text', async (ctx, next) => {
  try {
    if (ctx.session.step !== 'admin_review_edit') return next();
    const id = ctx.session.adminReviewEditId;
    const text = (ctx.message.text || '').trim();
    ctx.session.step = null;
    ctx.session.adminReviewEditId = null;
    reviewUpdateText(id, text);
    await ctx.reply(`Review #${id} updated.\nUse approve button again if needed.`);
  } catch (e) {
    console.error(e);
  }
});
