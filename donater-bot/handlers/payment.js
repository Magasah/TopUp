import { Composer } from 'grammy';
import { config } from '../config.js';
import { orderCreate } from '../database/db.js';
import { registerOrder as rateRegisterOrder } from '../middlewares/antiSpam.js';
import { paymentDetailKeyboard, paymentMethodsKeyboard } from '../utils/keyboards.js';
import { paymentTitle, paymentNumber } from '../utils/formatter.js';
import { notifyAdminsNewOrder } from '../utils/notify.js';
import { sendMessageRaw } from '../utils/tg_api.js';

export const paymentComposer = new Composer();

paymentComposer.callbackQuery(/^pay:(dc_city|alif|mastercard|milli)$/, async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    if (ctx.session.step !== 'choose_payment' || !ctx.session.draft) return;

    const method = ctx.match[1];
    ctx.session.draft.paymentMethod = method;
    ctx.session.step = 'await_receipt';

    const num = paymentNumber(method, config);
    const title = paymentTitle(method, ctx.i18n);
    const body = ctx.i18n('payment_details', {
      title,
      number: num,
      price: ctx.session.draft.priceTjs,
    });

    await sendMessageRaw(chatId, body, {
      parse_mode: 'HTML',
      reply_markup: paymentDetailKeyboard(num, ctx.i18n),
    });

    await ctx.reply(ctx.i18n('send_receipt'), { parse_mode: 'HTML' });
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});

paymentComposer.callbackQuery('flow:back_payment', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    if (ctx.session.step !== 'await_receipt') return;
    ctx.session.step = 'choose_payment';
    await sendMessageRaw(chatId, ctx.i18n('choose_payment'), {
      parse_mode: 'HTML',
      reply_markup: paymentMethodsKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

paymentComposer.on('message:photo', async (ctx, next) => {
  try {
    if (ctx.session.step !== 'await_receipt' || !ctx.session.draft) {
      return next();
    }

    const uid = ctx.from?.id;
    if (!uid) return next();

    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1].file_id;
    const d = ctx.session.draft;

    const orderId = orderCreate({
      userTgId: uid,
      username: ctx.from?.username || null,
      gameName: d.gameName,
      productLabel: d.productLabel,
      priceTjs: d.priceTjs,
      gameAccountId: d.accountId,
      paymentMethod: d.paymentMethod,
      receiptFileId: fileId,
    });

    rateRegisterOrder(uid);

    ctx.session.step = null;
    ctx.session.draft = null;

    await ctx.reply(ctx.i18n('order_accepted_user'), { parse_mode: 'HTML' });

    const orderRow = {
      id: orderId,
      user_tg_id: uid,
      username: ctx.from?.username || null,
      game_name: d.gameName,
      product_label: d.productLabel,
      price_tjs: d.priceTjs,
      game_account_id: d.accountId,
      payment_method: d.paymentMethod,
    };

    await notifyAdminsNewOrder(ctx.api, { ...orderRow, user_tg_id: uid }, fileId, ctx.i18n);
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});

paymentComposer.on('message:text', async (ctx, next) => {
  try {
    if (ctx.session.step !== 'await_receipt') return next();
    await ctx.reply(ctx.i18n('need_photo'), { parse_mode: 'HTML' });
  } catch (e) {
    console.error(e);
  }
});
