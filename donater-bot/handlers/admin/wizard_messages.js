import { InlineKeyboard } from 'grammy';
import {
  gameInsert,
  gameById,
  productInsert,
  getDb,
} from '../../database/db.js';
import { adminPanelKeyboard } from '../../utils/keyboards.js';

function nextProductSortOrder(gameId) {
  const row = getDb()
    .prepare(
      'SELECT COALESCE(MAX(sort_order), 0) AS m FROM products WHERE game_id = ?'
    )
    .get(gameId);
  return Number(row?.m || 0) + 10;
}

async function sendGamePreview(ctx) {
  const w = ctx.session.adminWizard;
  const d = w.data || {};
  const cover = d.cover_file_id ? '✅ Фото обложки' : '⏭ Без обложки';
  const text =
    `🎮 <b>Предпросмотр игры</b>\n\n` +
    `Название: ${d.name}\n` +
    `Эмодзи: ${d.emoji}\n` +
    `Обложка: ${cover}`;
  const kb = new InlineKeyboard()
    .text('✅ Сохранить', 'admgsv')
    .text('❌ Отмена', 'admgcan');
  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
}

/**
 * @returns {Promise<boolean>} true if message consumed
 */
export async function handleAdminWizardText(ctx) {
  const w = ctx.session.adminWizard;
  if (!w?.active) return false;

  const raw = (ctx.message?.text || '').trim();
  if (raw.startsWith('/') && raw !== '/skip') return false;

  try {
    if (w.kind === 'game_add') {
      if (w.step === 'name') {
        if (!raw) {
          await ctx.reply('Введите название игры текстом.');
          return true;
        }
        w.data = w.data || {};
        w.data.name = raw.slice(0, 120);
        w.step = 'emoji';
        await ctx.reply('Введи эмодзи игры (например 🔥):');
        return true;
      }
      if (w.step === 'emoji') {
        if (!raw) {
          await ctx.reply('Введите эмодзи.');
          return true;
        }
        w.data.emoji = raw.slice(0, 8);
        w.step = 'cover';
        await ctx.reply(
          'Отправь фото обложки игры или напиши <code>/skip</code>.',
          { parse_mode: 'HTML' }
        );
        return true;
      }
      if (w.step === 'cover') {
        if (raw === '/skip') {
          w.data.cover_file_id = null;
          w.step = 'preview';
          await sendGamePreview(ctx);
          return true;
        }
        await ctx.reply('Ожидается фото обложки или <code>/skip</code>.', {
          parse_mode: 'HTML',
        });
        return true;
      }
    }

    if (w.kind === 'product_add') {
      if (w.step === 'popular_ask' || w.step === 'best_ask') {
        await ctx.reply('Нажми кнопку «Да» или «Нет» выше.');
        return true;
      }
      if (w.step === 'label') {
        if (!raw) {
          await ctx.reply('Введите название / количество товара.');
          return true;
        }
        const { formatAdminWizardProductLabel } = await import(
          '../../utils/formatter.js'
        );
        const game = gameById(w.data.gameId);
        w.data.label = formatAdminWizardProductLabel(raw, game);
        w.step = 'price';
        await ctx.reply('Введи цену в сомони (только целое число):');
        return true;
      }
      if (w.step === 'price') {
        const n = parseInt(raw.replace(/\D/g, ''), 10);
        if (!Number.isFinite(n) || n < 1) {
          await ctx.reply('Некорректная цена. Введите число в сомони:');
          return true;
        }
        w.data.priceTjs = n;
        w.step = 'popular_ask';
        const kb = new InlineKeyboard()
          .text('✅ Да', 'admpop:1')
          .text('❌ Нет', 'admpop:0');
        await ctx.reply('Это популярный товар? 🔥', { reply_markup: kb });
        return true;
      }
    }
  } catch (e) {
    console.error('wizard_messages text', e);
    await ctx.reply('Ошибка мастера. Попробуйте снова.').catch(() => {});
  }
  return false;
}

/**
 * @returns {Promise<boolean>}
 */
export async function handleAdminWizardPhoto(ctx) {
  const w = ctx.session.adminWizard;
  if (!w?.active || w.kind !== 'game_add' || w.step !== 'cover') return false;

  try {
    const photos = ctx.message?.photo;
    if (!photos?.length) return false;
    const fid = photos[photos.length - 1].file_id;
    w.data = w.data || {};
    w.data.cover_file_id = fid;
    w.step = 'preview';
    await sendGamePreview(ctx);
    return true;
  } catch (e) {
    console.error('wizard_messages photo', e);
    return false;
  }
}

/** Callback: сохранить игру из preview */
export async function finalizeGameSave(ctx) {
  const w = ctx.session.adminWizard;
  if (!w?.active || w.kind !== 'game_add' || w.step !== 'preview') return false;
  const d = w.data;
  if (!d?.name || !d?.emoji) return false;
  gameInsert(d.name, d.emoji, d.cover_file_id || null);
  delete ctx.session.adminWizard;
  await ctx.reply('✅ Игра сохранена.', {
    reply_markup: adminPanelKeyboard(ctx.i18n),
  });
  return true;
}

export function cancelAdminWizard(ctx) {
  delete ctx.session.adminWizard;
}

export async function sendProductPreview(ctx) {
  const w = ctx.session.adminWizard;
  const d = w?.data;
  if (!d) return;
  const text =
    `<b>Новый товар</b>\n\n` +
    `${d.label}\n` +
    `💰 ${d.priceTjs} смн\n` +
    `🔥 Популярный: ${d.popular ? 'Да' : 'Нет'}\n` +
    `⭐ Лучшая ценность: ${d.best ? 'Да' : 'Нет'}`;
  const kb = new InlineKeyboard()
    .text('✅ Сохранить', 'admpsave')
    .text('❌ Отмена', 'admpcan');
  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
}

/** Callback: сохранить товар после preview */
export async function finalizeProductSave(ctx) {
  const w = ctx.session.adminWizard;
  if (!w?.active || w.kind !== 'product_add' || w.step !== 'preview') return false;
  const d = w.data;
  if (!d?.gameId || !d?.label || d?.priceTjs == null) return false;
  productInsert({
    gameId: d.gameId,
    label: d.label,
    priceTjs: d.priceTjs,
    isPopular: !!d.popular,
    isBestValue: !!d.best,
    sortOrder: nextProductSortOrder(d.gameId),
  });
  delete ctx.session.adminWizard;
  await ctx.reply(ctx.i18n('product_saved'), {
    reply_markup: adminPanelKeyboard(ctx.i18n),
  });
  return true;
}
