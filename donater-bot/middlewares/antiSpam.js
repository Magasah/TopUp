const captchaFails = new Map();
const orderTimestamps = new Map();

const CAPTCHA_BLOCK_MS = 5 * 60 * 1000;
const MAX_CAPTCHA_FAILS = 3;
const MAX_ORDERS_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

export function antiSpamMiddleware() {
  return async (ctx, next) => {
    await next();
  };
}

export function isCaptchaBlocked(userId) {
  const until = captchaFails.get(userId);
  if (!until || typeof until !== 'object') return null;
  if (until.blockedUntil && Date.now() < until.blockedUntil) {
    return Math.ceil((until.blockedUntil - Date.now()) / 60000) || 1;
  }
  return null;
}

export function registerCaptchaFail(userId) {
  let rec = captchaFails.get(userId) || { fails: 0, blockedUntil: 0 };
  rec.fails += 1;
  if (rec.fails >= MAX_CAPTCHA_FAILS) {
    rec.blockedUntil = Date.now() + CAPTCHA_BLOCK_MS;
    rec.fails = 0;
  }
  captchaFails.set(userId, rec);
  return rec;
}

export function resetCaptchaFails(userId) {
  captchaFails.delete(userId);
}

export function orderRateLimitMinutes(userId) {
  const now = Date.now();
  let arr = orderTimestamps.get(userId);
  if (!arr) {
    arr = [];
    orderTimestamps.set(userId, arr);
  }
  const cutoff = now - HOUR_MS;
  const recent = arr.filter((t) => t > cutoff);
  orderTimestamps.set(userId, recent);
  if (recent.length >= MAX_ORDERS_PER_HOUR) {
    const oldest = recent[0];
    const waitMs = HOUR_MS - (now - oldest);
    return Math.ceil(waitMs / 60000) || 1;
  }
  return 0;
}

export function registerOrder(userId) {
  const arr = orderTimestamps.get(userId) || [];
  arr.push(Date.now());
  orderTimestamps.set(userId, arr);
}

export function cronCleanupMaps() {
  const now = Date.now();
  for (const [uid, rec] of captchaFails.entries()) {
    if (rec.blockedUntil && now > rec.blockedUntil + HOUR_MS) captchaFails.delete(uid);
  }
}
