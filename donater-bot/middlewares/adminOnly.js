import { config } from '../config.js';

export function adminOnly() {
  return async (ctx, next) => {
    const id = ctx.from?.id;
    if (!id || !config.adminIds.has(id)) {
      return;
    }
    await next();
  };
}
