import 'dotenv/config';

function parseAdminIds() {
  const raw = process.env.ADMIN_IDS || '';
  const ids = new Set();
  for (const part of raw.split(',')) {
    const n = parseInt(part.trim(), 10);
    if (Number.isFinite(n)) ids.add(n);
  }
  return ids;
}

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  adminIds: parseAdminIds(),
  channelId:
    process.env.CHANNEL_ID ||
    process.env.CHANNEL_CHAT_ID ||
    process.env.CHANNEL_USERNAME ||
    '',
  reviewsChannel:
    process.env.REVIEWS_CHANNEL || process.env.PUBLIC_CHANNEL || '',
  adminTg: process.env.ADMIN_TG || process.env.ADMIN_CHAT_ID || '@support',
  dcCityNumber: process.env.DC_CITY_NUMBER || '',
  alifNumber: process.env.ALIF_NUMBER || '+992888788181',
  mastercardNumber: process.env.MASTERCARD_NUMBER || '',
  milliNumber: process.env.MILLI_NUMBER || '',
  supportUrl: process.env.SUPPORT_URL || 'https://t.me/vvewrix',
  supportManagerId: process.env.SUPPORT_MANAGER_ID || '7679557111',
};

export function isAdmin(userId) {
  return config.adminIds.has(userId);
}
