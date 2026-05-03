import { Composer, InlineKeyboard } from 'grammy';
import {
  gamesListActive,
  gameById,
  productsByGame,
  productDelete,
  productById,
} from '../../database/db.js';
import { adminPanelKeyboard } from '../../utils/keyboards.js';
import {
  sendProductPreview,
  finalizeProductSave,
  cancelAdminWizard,
} from './wizard_messages.js';

export const adminProductsComposer = new Composer();

adminProductsComposer.callbackQuery('adm:products', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const games = gamesListActive();
    const kb = new InlineKeyboard();
    for (const g of games) {
      kb.text(`${g.emoji} ${g.name}`.slice(0, 60), `admgp:${g.id}`).row();
    }
    kb.text(ctx.i18n('admin_back'), 'adm:home');
    await ctx.reply('Выберите игру для управления товарами:', {
      reply_markup: kb,
    });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admgp:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const gid = parseInt(ctx.match[1], 10);
    const game = gameById(gid);
    if (!game) {
      await ctx.reply('Игра не найдена.');
      return;
    }
    ctx.session.adminProductGameId = gid;
    const products = productsByGame(gid);
    const kb = new InlineKeyboard();
    for (const p of products) {
      const line = `${p.is_popular ? '🔥 ' : ''}${p.is_best_value ? '⭐ ' : ''}${p.label} — ${p.price_tjs}смн`.slice(
        0,
        40
      );
      kb.text(line, `admpinfo:${p.id}`)
        .text('✏️', `admpe:${p.id}`)
        .text('🗑', `admpd:${p.id}`)
        .row();
    }
    kb.text('➕ Добавить товар', `admpa:${gid}`).row();
    kb.text('◀️ Назад', 'adm:products');
    const header =
      `💎 <b>Товары</b> — ${game.emoji} ${game.name}\n` + '────────────────';
    const body = products.length ? '' : '\n<i>Пока нет товаров.</i>';
    await ctx.reply(header + body, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admpinfo:(\d+)$/, async (ctx) => {
  try {
    const id = parseInt(ctx.match[1], 10);
    const p = productById(id);
    await ctx.answerCallbackQuery({
      text: p ? `${p.label} — ${p.price_tjs} смн` : '—',
      show_alert: false,
    });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admpa:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const gid = parseInt(ctx.match[1], 10);
    if (!gameById(gid)) {
      await ctx.reply('Игра не найдена.');
      return;
    }
    ctx.session.adminWizard = {
      active: true,
      kind: 'product_add',
      step: 'label',
      data: { gameId: gid },
    };
    await ctx.reply(
      'Шаг 1: введи количество и тип (например: <code>310 алмазов</code> или <code>600 UC</code>):',
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admpd:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const id = parseInt(ctx.match[1], 10);
    const p = productById(id);
    if (!p) return;
    ctx.session.pendingProductDelete = { id, label: p.label };
    const kb = new InlineKeyboard()
      .text('✅ Да, удалить', `admpdc:${id}`)
      .text('❌ Отмена', 'admpdelx');
    await ctx.reply(`⚠️ Удалить товар «${p.label}»?`, { reply_markup: kb });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admpdc:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const id = parseInt(ctx.match[1], 10);
    const pend = ctx.session.pendingProductDelete;
    if (!pend || pend.id !== id) return;
    productDelete(id);
    delete ctx.session.pendingProductDelete;
    await ctx.reply('Товар удалён.', {
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery('admpdelx', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    delete ctx.session.pendingProductDelete;
    await ctx.reply('Отменено.');
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admpe:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery({ text: 'Редактирование скоро', show_alert: false });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admpop:([01])$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const w = ctx.session.adminWizard;
    if (!w?.active || w.kind !== 'product_add' || w.step !== 'popular_ask') return;
    w.data.popular = ctx.match[1] === '1';
    w.step = 'best_ask';
    const kb = new InlineKeyboard()
      .text('✅ Да', 'admbest:1')
      .text('❌ Нет', 'admbest:0');
    await ctx.reply('Это лучшая ценность? ⭐', { reply_markup: kb });
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery(/^admbest:([01])$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const w = ctx.session.adminWizard;
    if (!w?.active || w.kind !== 'product_add' || w.step !== 'best_ask') return;
    w.data.best = ctx.match[1] === '1';
    w.step = 'preview';
    await sendProductPreview(ctx);
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery('admpsave', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    await finalizeProductSave(ctx);
  } catch (e) {
    console.error(e);
  }
});

adminProductsComposer.callbackQuery('admpcan', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    cancelAdminWizard(ctx);
    await ctx.reply('Добавление товара отменено.', {
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});
