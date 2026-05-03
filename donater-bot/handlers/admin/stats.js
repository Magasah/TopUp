import { Composer } from 'grammy';
import { formatStatsText } from '../../utils/notify.js';
import { adminPanelKeyboard } from '../../utils/keyboards.js';

export const adminStatsComposer = new Composer();

adminStatsComposer.callbackQuery('adm:stats', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(formatStatsText(ctx.i18n), {
      parse_mode: 'HTML',
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

adminStatsComposer.callbackQuery('adm:home', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.i18n('admin_panel_title'), {
      parse_mode: 'HTML',
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});
