import { Composer } from 'grammy';
import { allUserTgIds, broadcastInsert } from '../../database/db.js';
import { adminPanelKeyboard } from '../../utils/keyboards.js';
import { InlineKeyboard } from 'grammy';

export const adminBroadcastComposer = new Composer();

adminBroadcastComposer.callbackQuery('adm:broadcast', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    ctx.session.adminBroadcastText = null;
    ctx.session.step = 'admin_broadcast_text';
    await ctx.reply(ctx.i18n('broadcast_prompt'));
  } catch (e) {
    console.error(e);
  }
});

adminBroadcastComposer.on('message:text', async (ctx, next) => {
  try {
    if (ctx.session.step !== 'admin_broadcast_text') return next();
    const text = (ctx.message.text || '').trim();
    if (!text) return;
    ctx.session.adminBroadcastText = text;
    ctx.session.step = 'admin_broadcast_confirm';
    const kb = new InlineKeyboard()
      .text(ctx.i18n('confirm_yes'), 'bc:go')
      .text(ctx.i18n('cancel'), 'bc:cancel');
    await ctx.reply(ctx.i18n('broadcast_preview', { text }), {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  } catch (e) {
    console.error(e);
  }
});

adminBroadcastComposer.callbackQuery('bc:cancel', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    ctx.session.step = null;
    ctx.session.adminBroadcastText = null;
    await ctx.reply(ctx.i18n('broadcast_cancel'));
  } catch (e) {
    console.error(e);
  }
});

adminBroadcastComposer.callbackQuery('bc:go', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const text = ctx.session.adminBroadcastText;
    ctx.session.step = null;
    ctx.session.adminBroadcastText = null;
    if (!text) return;

    const ids = allUserTgIds();
    let ok = 0;
    let fail = 0;
    for (const uid of ids) {
      try {
        await ctx.api.sendMessage(uid, text, { parse_mode: 'HTML' });
        ok++;
      } catch {
        fail++;
      }
    }
    broadcastInsert(text, ok);
    await ctx.reply(ctx.i18n('broadcast_sent', { ok, fail }), {
      parse_mode: 'HTML',
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});
