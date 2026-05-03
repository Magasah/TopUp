import { Composer } from 'grammy';
import { randomInt } from 'crypto';
import { productById, gamesListActive } from '../database/db.js';
import {
  isCaptchaBlocked,
  registerCaptchaFail,
  resetCaptchaFails,
  orderRateLimitMinutes,
} from '../middlewares/antiSpam.js';
import {
  captchaKeyboard,
  confirmOrderKeyboard,
  cancelInline,
  paymentMethodsKeyboard,
  mainMenuKeyboardJson,
} from '../utils/keyboards.js';
import { sendMessageRaw } from '../utils/tg_api.js';

export const orderComposer = new Composer();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

orderComposer.callbackQuery(/^prod:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    const uid = ctx.from?.id;
    if (!uid) return;

    const blockMin = isCaptchaBlocked(uid);
    if (blockMin) {
      await ctx.reply(
        ctx.i18n('captcha_blocked', { minutes: blockMin }),
        { parse_mode: 'HTML' }
      );
      return;
    }

    const rateMin = orderRateLimitMinutes(uid);
    if (rateMin > 0) {
      await ctx.reply(
        ctx.i18n('rate_limit_orders', { minutes: rateMin }),
        { parse_mode: 'HTML' }
      );
      return;
    }

    const pid = parseInt(ctx.match[1], 10);
    const p = productById(pid);
    if (!p) {
      await ctx.reply(ctx.i18n('error_generic'));
      return;
    }

    const gameId = ctx.session.selectedGameId;
    const gameName = ctx.session.selectedGameName || '';
    if (!gameId || p.game_id !== gameId) {
      await ctx.reply(ctx.i18n('error_generic'));
      return;
    }

    ctx.session.draft = {
      gameId,
      gameName,
      productId: pid,
      productLabel: p.label,
      priceTjs: p.price_tjs,
    };

    const a = randomInt(1, 9);
    const b = randomInt(1, 9);
    const correct = a + b;
    const wrong = new Set();
    while (wrong.size < 3) {
      const x = randomInt(2, 18);
      if (x !== correct) wrong.add(x);
    }
    const opts = shuffle([
      { label: correct, value: correct, correct: true },
      ...[...wrong].map((v) => ({ label: v, value: v, correct: false })),
    ]);
    const salt = `${randomInt(1000, 9999)}`;
    ctx.session.captchaSalt = salt;
    ctx.session.captchaAnswer = correct;
    ctx.session.step = 'captcha';

    const q = `${a} + ${b}`;
    await sendMessageRaw(chatId, ctx.i18n('captcha_title', { question: q }), {
      parse_mode: 'HTML',
      reply_markup: captchaKeyboard(salt, opts),
    });
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});

orderComposer.callbackQuery(/^cap:(\w+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  try {
    const uid = ctx.from?.id;
    const salt = ctx.match[1];
    const val = parseInt(ctx.match[2], 10);
    if (ctx.session.step !== 'captcha' || salt !== ctx.session.captchaSalt) {
      return;
    }
    if (val === ctx.session.captchaAnswer) {
      resetCaptchaFails(uid);
      ctx.session.step = 'await_game_id';
      ctx.session.captchaSalt = null;
      ctx.session.captchaAnswer = null;
      await ctx.reply(ctx.i18n('enter_game_id'), {
        parse_mode: 'HTML',
        reply_markup: cancelInline(ctx.i18n),
      });
      return;
    }
    const rec = registerCaptchaFail(uid);
    const left = 3 - (rec.fails || 0);
    if (rec.blockedUntil && Date.now() < rec.blockedUntil) {
      await ctx.reply(
        ctx.i18n('captcha_blocked', {
          minutes: Math.ceil((rec.blockedUntil - Date.now()) / 60000) || 5,
        }),
        { parse_mode: 'HTML' }
      );
      return;
    }
    await ctx.reply(ctx.i18n('captcha_wrong', { n: Math.max(0, left) }), {
      parse_mode: 'HTML',
    });
  } catch (e) {
    console.error(e);
  }
});

orderComposer.callbackQuery('flow:cancel', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  try {
    ctx.session.flow = null;
    ctx.session.step = null;
    ctx.session.draft = null;
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await sendMessageRaw(chatId, ctx.i18n('order_cancelled'), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboardJson(gamesListActive(), ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

orderComposer.callbackQuery('order:confirm_no', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  try {
    ctx.session.step = null;
    ctx.session.draft = null;
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await sendMessageRaw(chatId, ctx.i18n('order_cancelled'), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboardJson(gamesListActive(), ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

orderComposer.callbackQuery('order:confirm_yes', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  try {
    if (ctx.session.step !== 'confirm') return;
    ctx.session.step = 'choose_payment';
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await sendMessageRaw(chatId, ctx.i18n('choose_payment'), {
      parse_mode: 'HTML',
      reply_markup: paymentMethodsKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

orderComposer.callbackQuery('flow:back_summary', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  try {
    const d = ctx.session.draft;
    if (!d || !d.accountId) return;
    ctx.session.step = 'confirm';
    const un = ctx.from?.username ? `@${ctx.from.username}` : '—';
    const summary = ctx.i18n('order_summary', {
      firstName: ctx.from?.first_name || '—',
      username: un,
      game: d.gameName,
      product: d.productLabel,
      price: d.priceTjs,
      accountId: d.accountId,
    });
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await sendMessageRaw(chatId, summary, {
      parse_mode: 'HTML',
      reply_markup: confirmOrderKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

orderComposer.on('message:text', async (ctx, next) => {
  try {
    const text = ctx.message?.text?.trim() || '';
    if (text.startsWith('/')) return next();

    if (ctx.session.step !== 'await_game_id' || !ctx.session.draft) {
      return next();
    }

    if (!/^\d{8,12}$/.test(text)) {
      await ctx.reply(ctx.i18n('invalid_id'), { parse_mode: 'HTML' });
      return;
    }

    ctx.session.draft.accountId = text;
    ctx.session.step = 'confirm';

    const d = ctx.session.draft;
    const un = ctx.from?.username ? `@${ctx.from.username}` : '—';
    const summary = ctx.i18n('order_summary', {
      firstName: ctx.from?.first_name || '—',
      username: un,
      game: d.gameName,
      product: d.productLabel,
      price: d.priceTjs,
      accountId: d.accountId,
    });
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await sendMessageRaw(chatId, summary, {
      parse_mode: 'HTML',
      reply_markup: confirmOrderKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});
