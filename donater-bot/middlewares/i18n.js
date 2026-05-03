import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const locales = {
  ru: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/ru.json'), 'utf8')),
  tj: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/tj.json'), 'utf8')),
};

function interpolate(template, vars) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`
  );
}

export function createI18nMiddleware(getLangFromCtx) {
  return async (ctx, next) => {
    const lang = getLangFromCtx(ctx);
    const effective = lang === 'tj' ? 'tj' : 'ru';
    ctx.i18n = (key, vars = {}) => {
      const dict = locales[effective] || locales.ru;
      const tpl = dict[key] ?? locales.ru[key] ?? key;
      return interpolate(tpl, vars);
    };
    ctx.i18nLang = effective;
    await next();
  };
}
