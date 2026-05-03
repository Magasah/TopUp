import { config } from '../config.js';

const verifiedUntil = new Map();

export function subscriptionMiddleware(bot) {
  return async (ctx, next) => {
    if (!config.channelId) {
      await next();
      return;
    }
    const uid = ctx.from?.id;
    if (!uid || ctx.chat?.type !== 'private') {
      await next();
      return;
    }

    const until = verifiedUntil.get(uid);
    if (until && Date.now() < until) {
      ctx.session.channelOk = true;
      await next();
      return;
    }

    await next();
  };
}

export async function ensureSubscribed(ctx, api) {
  const uid = ctx.from?.id;
  if (!uid || !config.channelId) return true;
  try {
    const m = await api.getChatMember(config.channelId, uid);
    const st = m.status;
    const ok =
      st === 'creator' ||
      st === 'administrator' ||
      st === 'member' ||
      (st === 'restricted' && m.is_member);
    if (ok) {
      verifiedUntil.set(uid, Date.now() + 5 * 60 * 1000);
      ctx.session.channelOk = true;
    }
    return ok;
  } catch {
    return false;
  }
}

export function invalidateSubscriptionCache(userId) {
  verifiedUntil.delete(userId);
}
