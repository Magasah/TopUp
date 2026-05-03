import { Composer, InlineKeyboard } from 'grammy';
import { gamesListActive, gameDelete, gameById } from '../../database/db.js';
import { adminPanelKeyboard } from '../../utils/keyboards.js';
import {
  finalizeGameSave,
  cancelAdminWizard,
} from './wizard_messages.js';

export const adminGamesComposer = new Composer();

function gamesManageKeyboard(ctx, games) {
  const kb = new InlineKeyboard();
  for (const g of games) {
    const title = `${g.emoji} ${g.name}`.slice(0, 28);
    kb.text(title, `admginfo:${g.id}`)
      .text('✏️', `admge:${g.id}`)
      .text('🗑', `admgd:${g.id}`)
      .row();
  }
  kb.text('➕ Добавить игру', 'admgn').row();
  kb.text(ctx.i18n('admin_back'), 'adm:home');
  return kb;
}

adminGamesComposer.callbackQuery('adm:games', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const games = gamesListActive();
    const header = '🎮 <b>УПРАВЛЕНИЕ ИГРАМИ</b>\n────────────────';
    const body = games.length
      ? ''
      : '\n<i>Список пуст — добавьте игру.</i>';
    await ctx.reply(header + body, {
      parse_mode: 'HTML',
      reply_markup: gamesManageKeyboard(ctx, games),
    });
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery(/^admginfo:(\d+)$/, async (ctx) => {
  try {
    const id = parseInt(ctx.match[1], 10);
    const g = gameById(id);
    await ctx.answerCallbackQuery({
      text: g ? `${g.emoji} ${g.name}` : '—',
      show_alert: false,
    });
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery('admgn', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    ctx.session.adminWizard = {
      active: true,
      kind: 'game_add',
      step: 'name',
      data: {},
    };
    await ctx.reply('Шаг 1/3: введи <b>название игры</b>:', { parse_mode: 'HTML' });
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery(/^admge:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery({ text: 'Скоро', show_alert: false });
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery(/^admgd:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const id = parseInt(ctx.match[1], 10);
    const g = gameById(id);
    if (!g) return;
    ctx.session.pendingGameDelete = { id, name: g.name };
    const kb = new InlineKeyboard()
      .text('✅ Да, удалить', `admgdc:${id}`)
      .text('❌ Отмена', 'admgdelx');
    await ctx.reply(
      `⚠️ Удалить игру «${g.name}»?\nВсе товары этой игры тоже удалятся!`,
      { reply_markup: kb }
    );
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery(/^admgdc:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    const id = parseInt(ctx.match[1], 10);
    const pend = ctx.session.pendingGameDelete;
    if (!pend || pend.id !== id) return;
    gameDelete(id);
    delete ctx.session.pendingGameDelete;
    await ctx.reply(`Игра «${pend.name}» удалена.`, {
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery('admgdelx', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    delete ctx.session.pendingGameDelete;
    await ctx.reply('Отменено.');
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery('admgsv', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    await finalizeGameSave(ctx);
  } catch (e) {
    console.error(e);
  }
});

adminGamesComposer.callbackQuery('admgcan', async (ctx) => {
  try {
    await ctx.answerCallbackQuery().catch(() => {});
    cancelAdminWizard(ctx);
    await ctx.reply('Добавление игры отменено.', {
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});
