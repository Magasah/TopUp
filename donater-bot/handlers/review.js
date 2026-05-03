import { Composer } from 'grammy';
import { reviewCreate, orderById, ordersRecentForUser } from '../database/db.js';
import { notifyAdminsReview } from '../utils/notify.js';

export const reviewComposer = new Composer();

reviewComposer.command('otziv', async (ctx) => {
  try {
    const uid = ctx.from?.id;
    if (!uid) return;

    const recent = ordersRecentForUser(uid, 1);
    ctx.session.reviewOrderId = recent[0]?.id || null;

    ctx.session.step = 'await_review_text';
    await ctx.reply(ctx.i18n('write_review'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.i18n('cancel'), callback_data: 'rev:cancel' }],
        ],
      },
    });
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});

reviewComposer.callbackQuery('rev:cancel', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    ctx.session.step = null;
    await ctx.reply(ctx.i18n('review_cancel'));
  } catch (e) {
    console.error(e);
  }
});

reviewComposer.on('message:text', async (ctx, next) => {
  try {
    if (ctx.session.step !== 'await_review_text') return next();
    const text = (ctx.message.text || '').trim();
    if (!text || text.startsWith('/')) return next();

    const uid = ctx.from.id;
    const rid = reviewCreate({
      orderId: ctx.session.reviewOrderId,
      userTgId: uid,
      text,
    });

    ctx.session.step = null;
    await ctx.reply(ctx.i18n('review_sent'), { parse_mode: 'HTML' });

    const order = ctx.session.reviewOrderId
      ? orderById(ctx.session.reviewOrderId)
      : null;
    const fakeOrder =
      order ||
      ({
        id: '—',
        username: ctx.from.username,
        product_label: '—',
        game_name: '—',
      });
    await notifyAdminsReview(
      ctx.api,
      { id: rid, text },
      fakeOrder,
      ctx.i18n
    );
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});
