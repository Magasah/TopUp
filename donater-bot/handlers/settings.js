import { Composer, InputFile } from 'grammy';
import { userSetLanguage, userGetLanguage } from '../database/db.js';
import { settingsKeyboard } from '../utils/keyboards.js';
import { resolveFirstExisting } from '../utils/paths.js';

function storePhotoPath() {
  return resolveFirstExisting([
    process.env.STORE_PHOTO_PATH,
    'public/store.jpg',
    'assets/store.jpg',
  ]);
}

export const settingsComposer = new Composer();

settingsComposer.callbackQuery('menu:settings', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const lang = ctx.session?.lang || userGetLanguage(ctx.from.id);
    const langLabel =
      lang === 'tj' ? ctx.i18n('lang_tj').replace(/ ✓$/, '') : ctx.i18n('lang_ru').replace(/ ✓$/, '');
    const cap = ctx.i18n('settings_title', {
      lang: lang === 'tj' ? 'Тоҷикӣ' : 'Русский',
    });
    const kb = settingsKeyboard(lang === 'tj' ? 'tj' : 'ru', ctx.i18n);

    const storePath = storePhotoPath();
    if (storePath) {
      await ctx.replyWithPhoto(new InputFile(storePath), {
        caption: cap,
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    } else {
      await ctx.reply(cap, { parse_mode: 'HTML', reply_markup: kb });
    }
  } catch (e) {
    console.error(e);
    await ctx.reply(ctx.i18n('error_generic'));
  }
});

settingsComposer.callbackQuery(/^setlang:(ru|tj)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    const lang = ctx.match[1];
    ctx.session.lang = lang;
    userSetLanguage(ctx.from.id, lang);
    await ctx.reply(ctx.i18n('language_changed'), { parse_mode: 'HTML' });

    const kb = settingsKeyboard(lang, ctx.i18n);
    const cap = ctx.i18n('settings_title', {
      lang: lang === 'tj' ? 'Тоҷикӣ' : 'Русский',
    });
    const storePath = storePhotoPath();
    if (storePath) {
      await ctx.replyWithPhoto(new InputFile(storePath), {
        caption: cap,
        parse_mode: 'HTML',
        reply_markup: kb,
      });
    } else {
      await ctx.reply(cap, { parse_mode: 'HTML', reply_markup: kb });
    }
  } catch (e) {
    console.error(e);
  }
});
