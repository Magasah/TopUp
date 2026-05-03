import { Composer } from 'grammy';
import { config } from '../../config.js';
import { adminPanelKeyboard } from '../../utils/keyboards.js';
import { adminStatsComposer } from './stats.js';
import { adminOrdersComposer } from './orders.js';
import { adminProductsComposer } from './products.js';
import { adminGamesComposer } from './games_mgr.js';
import { adminBroadcastComposer } from './broadcast.js';
import { adminReviewsComposer } from './reviews_mod.js';
import {
  handleAdminWizardText,
  handleAdminWizardPhoto,
} from './wizard_messages.js';

export const adminComposer = new Composer();

adminComposer.use(async (ctx, next) => {
  const uid = ctx.from?.id;
  if (!uid || !config.adminIds.has(uid)) {
    return;
  }
  await next();
});

adminComposer.on('message:text', async (ctx, next) => {
  if (ctx.session.adminWizard?.active) {
    const handled = await handleAdminWizardText(ctx);
    if (handled) return;
  }
  return next();
});

adminComposer.on('message:photo', async (ctx, next) => {
  if (ctx.session.adminWizard?.active) {
    const handled = await handleAdminWizardPhoto(ctx);
    if (handled) return;
  }
  return next();
});

adminComposer.command('admin', async (ctx) => {
  try {
    await ctx.reply(ctx.i18n('admin_panel_title'), {
      parse_mode: 'HTML',
      reply_markup: adminPanelKeyboard(ctx.i18n),
    });
  } catch (e) {
    console.error(e);
  }
});

adminComposer.use(adminStatsComposer);
adminComposer.use(adminOrdersComposer);
adminComposer.use(adminProductsComposer);
adminComposer.use(adminGamesComposer);
adminComposer.use(adminBroadcastComposer);
adminComposer.use(adminReviewsComposer);
