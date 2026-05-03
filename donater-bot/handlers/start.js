import { Composer, InputFile } from 'grammy';
import { config } from '../config.js';
import { userUpsert, userGetLanguage, gamesListActive } from '../database/db.js';
import { ensureSubscribed, invalidateSubscriptionCache } from '../middlewares/subscription.js';
import {
  mainMenuKeyboardJson,
  subscriptionInline,
  channelLink,
} from '../utils/keyboards.js';
import { resolveFirstExisting } from '../utils/paths.js';
import { sendMessageRaw, sendPhotoRaw } from '../utils/tg_api.js';

export const startComposer = new Composer();

function welcomePhotoPath() {
  return resolveFirstExisting([
    process.env.START_PHOTO_PATH,
    'public/старт.jpg',
    'public/start.jpg',
    'assets/welcome.jpg',
  ]);
}

async function sendWelcome(ctx, withMenu = false) {
  const name = ctx.from?.first_name || 'friend';
  const text = ctx.i18n('welcome_subscribed', { name });
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const kb = withMenu
    ? mainMenuKeyboardJson(gamesListActive(), ctx.i18n)
    : undefined;
  const photo = welcomePhotoPath();

  try {
    if (photo) {
      await sendPhotoRaw(chatId, photo, text, {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    } else {
      await sendMessageRaw(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    }
  } catch (e) {
    console.error('sendWelcome', e);
    await sendMessageRaw(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  }
}

startComposer.command('start', async (ctx, next) => {
  try {
    const uid = ctx.from?.id;
    if (!uid) return;

    const langDb = userGetLanguage(uid);
    ctx.session.lang = langDb === 'tj' ? 'tj' : 'ru';

    userUpsert(uid, {
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      language: ctx.session.lang,
    });

    if (config.channelId) {
      const ok = await ensureSubscribed(ctx, ctx.api);
      if (!ok) {
        const cap = ctx.i18n('subscribe_required');
        const url = channelLink();
        const kb = subscriptionInline(url, ctx.i18n);
        const photo = welcomePhotoPath();
        if (photo) {
          await ctx.replyWithPhoto(new InputFile(photo), {
            caption: cap,
            parse_mode: 'HTML',
            reply_markup: kb,
          });
        } else {
          await ctx.reply(cap, { parse_mode: 'HTML', reply_markup: kb });
        }
        return;
      }
    }

    await sendWelcome(ctx, true);
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});

startComposer.callbackQuery('sub:check', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    invalidateSubscriptionCache(ctx.from.id);
    const ok = await ensureSubscribed(ctx, ctx.api);
    if (!ok) {
      await ctx.reply(ctx.i18n('not_subscribed'));
      return;
    }
    await ctx.reply(ctx.i18n('subscribed_ok'), { parse_mode: 'HTML' });
    await sendWelcome(ctx, true);
  } catch (e) {
    console.error(e);
  }
});

startComposer.callbackQuery('menu:home', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  try {
    ctx.session.flow = null;
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await sendMessageRaw(chatId, ctx.i18n('choose_game'), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboardJson(gamesListActive(), ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

startComposer.callbackQuery('menu:support', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const text =
    '📞 <b>Поддержка</b>\n\n' +
    'Если у вас вопросы или проблемы — напишите нам.\n\n' +
    '🕐 Время ответа: обычно до 30 минут\n' +
    '👤 Менеджер: @vvewrix\n' +
    `🆔 ID: <code>${config.supportManagerId}</code>`;
  const kb = {
    inline_keyboard: [
      [
        {
          text: '💬 Написать в поддержку',
          url: config.supportUrl,
        },
      ],
      [{ text: ctx.i18n('main_menu'), callback_data: 'menu:home' }],
    ],
  };
  await sendMessageRaw(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: kb,
  });
});
