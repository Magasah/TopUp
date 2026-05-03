/**
 * donater-bot — entry point (Grammy + sql.js SQLite)
 */
import 'dotenv/config';
import { Bot } from 'grammy';
import cron from 'node-cron';
import { config } from './config.js';
import { initDatabase, userGetLanguage } from './database/db.js';
import { createI18nMiddleware } from './middlewares/i18n.js';
import { cronCleanupMaps } from './middlewares/antiSpam.js';

import { startComposer } from './handlers/start.js';
import { gamesComposer } from './handlers/games.js';
import { orderComposer } from './handlers/order.js';
import { paymentComposer } from './handlers/payment.js';
import { settingsComposer } from './handlers/settings.js';
import { reviewComposer } from './handlers/review.js';
import { adminComposer } from './handlers/admin/index.js';

const sessions = new Map();

function sessionMiddleware() {
  return async (ctx, next) => {
    const id = ctx.chat?.id;
    if (id) {
      if (!sessions.has(id)) sessions.set(id, {});
      ctx.session = sessions.get(id);
    } else {
      ctx.session = {};
    }
    await next();
  };
}

if (!config.botToken) {
  console.error('BOT_TOKEN is required (.env)');
  process.exit(1);
}

const bot = new Bot(config.botToken);

bot.use(sessionMiddleware());
bot.use(
  createI18nMiddleware((ctx) => {
    if (ctx.session?.lang === 'tj' || ctx.session?.lang === 'ru') {
      return ctx.session.lang;
    }
    const uid = ctx.from?.id;
    if (uid) {
      const l = userGetLanguage(uid);
      return l === 'tj' ? 'tj' : 'ru';
    }
    return 'ru';
  })
);

bot.use(startComposer);
bot.use(gamesComposer);
bot.use(orderComposer);
bot.use(paymentComposer);
bot.use(settingsComposer);
bot.use(reviewComposer);
bot.use(adminComposer);

bot.catch((err) => {
  console.error('Bot error:', err);
});

cron.schedule('*/5 * * * *', () => {
  cronCleanupMaps();
});

async function setupCommands() {
  const userCommands = [
    { command: 'start', description: 'Главное меню / менюи асосӣ' },
    { command: 'otziv', description: 'Оставить отзыв / фикр' },
  ];
  const adminCommands = [
    ...userCommands,
    { command: 'admin', description: 'Админ-панель' },
  ];
  try {
    await bot.api.setMyCommands(userCommands, {
      scope: { type: 'all_private_chats' },
    });
    for (const id of config.adminIds) {
      await bot.api.setMyCommands(adminCommands, {
        scope: { type: 'chat', chat_id: id },
      });
    }
  } catch (e) {
    console.warn('setMyCommands:', e.message);
  }
}

async function main() {
  await initDatabase();
  console.log('SQLite (sql.js) ready');

  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
    console.log('Webhook cleared (safe for long polling)');
  } catch (e) {
    console.warn('deleteWebhook:', e.message);
  }

  await setupCommands();
  console.log('Starting bot…');
  await bot.start();
  console.log('Bot stopped.');
}

main().catch((e) => {
  if (e?.error_code === 409) {
    console.error(`
[409 Conflict] Уже идёт long polling с этим BOT_TOKEN в другом месте.

Что сделать:
  • Остановите все другие процессы этого бота (сервер/VPS, Python main.py, второй «node index.js»).
  • В диспетчере задач Windows завершите лишние процессы «node.exe», если это ваши старые запуски.
  • Не запускайте две копии бота с одним токеном одновременно.

Webhook при старте снимается автоматически; если конфликт остаётся — подождите ~1 минуту и запустите снова.
`);
  }
  console.error(e);
  process.exit(1);
});
