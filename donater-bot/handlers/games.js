import { Composer } from 'grammy';
import { existsSync } from 'fs';
import {
  gamesListActive,
  gameById,
  productsByGame,
} from '../database/db.js';
import { mainMenuKeyboardJson, productKeyboard } from '../utils/keyboards.js';
import { resolveFirstExisting } from '../utils/paths.js';
import { sendMessageRaw, sendPhotoRaw } from '../utils/tg_api.js';

export const gamesComposer = new Composer();

function localCoverPath(game) {
  const n = (game.name || '').toLowerCase();
  if (n.includes('pubg')) {
    return resolveFirstExisting([
      process.env.GAME_COVER_PUBG,
      'public/PUBG Mobile товарь.jpg',
    ]);
  }
  if (n.includes('free fire') || n.includes('freefire') || n.includes('fire')) {
    return resolveFirstExisting([
      process.env.GAME_COVER_FF,
      'public/товарь Free Fire.jpg',
    ]);
  }
  return null;
}

function resolveCoverForSend(game) {
  const local = localCoverPath(game);
  if (local && existsSync(local)) return { type: 'path', value: local };
  const fid = game.cover_file_id;
  if (fid && typeof fid === 'string' && fid.length > 2) {
    const looksLikePath =
      fid.includes('/') || fid.includes('\\') || fid.startsWith('file:');
    if (looksLikePath && existsSync(fid)) return { type: 'path', value: fid };
    if (!looksLikePath) return { type: 'file_id', value: fid };
  }
  return null;
}

gamesComposer.callbackQuery(/^nav:games$/, async (ctx) => {
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
    await ctx.reply(ctx.i18n('error_generic')).catch(() => {});
  }
});

gamesComposer.callbackQuery(/^nav:game:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const gid = parseInt(ctx.match[1], 10);
  try {
    const game = gameById(gid);
    if (!game) {
      await sendMessageRaw(chatId, 'Игра не найдена.', { parse_mode: 'HTML' });
      return;
    }

    ctx.session.selectedGameId = gid;
    ctx.session.selectedGameName = game.name;
    ctx.session.selectedEmoji = game.emoji;

    const products = productsByGame(gid);
    if (!products || products.length === 0) {
      await sendMessageRaw(
        chatId,
        'Товары для этой игры пока не добавлены.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    const caption = ctx.i18n('choose_product', {
      game: `${game.emoji} ${game.name}`,
    });
    const markup = productKeyboard(products, ctx.i18n);
    const cover = resolveCoverForSend(game);

    if (cover?.type === 'path') {
      await sendPhotoRaw(chatId, cover.value, caption, {
        parse_mode: 'HTML',
        reply_markup: markup,
      });
    } else if (cover?.type === 'file_id') {
      await sendPhotoRaw(chatId, cover.value, caption, {
        parse_mode: 'HTML',
        reply_markup: markup,
      });
    } else {
      await sendMessageRaw(chatId, caption, {
        parse_mode: 'HTML',
        reply_markup: markup,
      });
    }

    await ctx.deleteMessage().catch(() => {});
  } catch (err) {
    console.error('games handler error:', err);
    await ctx.reply('❌ Ошибка загрузки товаров. Попробуйте позже.').catch(() => {});
  }
});
