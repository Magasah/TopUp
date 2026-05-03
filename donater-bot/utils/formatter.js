/**
 * Format raw admin input into display label for products.
 * @param {string} raw
 * @param {'freefire'|'pubg'} gameKind
 */
/**
 * Admin «добавить товар» — автоформат по ключевым словам и игре.
 * @param {string} raw
 * @param {{ name?: string }} [game]
 */
export function formatAdminWizardProductLabel(raw, game) {
  const s = String(raw || '').trim();
  if (!s) return '💎 Товар';
  const lower = s.toLowerCase();
  const digits = (s.match(/\d+/g) || []).join('') || '';
  const isPubg = game && String(game.name || '').toLowerCase().includes('pubg');

  if (lower.includes('vp') && digits) return `🎯 ${digits} VP`;
  if (lower.includes('uc') || (isPubg && /\d/.test(s))) {
    if (digits) return `🎮 ${digits} UC`;
    return `🎮 ${s}`;
  }
  if (lower.includes('алм') && digits) return `💎 ${digits} алмазов`;
  if (digits && isPubg) return `🎮 ${digits} UC`;
  if (digits) return `💎 ${digits} алмазов`;
  return `💎 ${s}`;
}

export function formatProductLabel(raw, gameKind) {
  const s = String(raw || '').trim();
  if (!s) return '💎 Товар';

  const upper = s.toUpperCase();
  if (/^VP\s*\d+/i.test(s) || /^VP\d+/i.test(s)) {
    return `🎮 ${s.replace(/\s+/g, ' ')}`;
  }

  const digits = s.replace(/\D/g, '');
  if (digits.length >= 1 && /^\d+$/.test(s.replace(/\s/g, ''))) {
    if (gameKind === 'pubg') {
      return `🎮 ${digits} UC`;
    }
    return `💎 ${digits} алмазов`;
  }

  if (gameKind === 'pubg' && /\d/.test(s)) {
    return `🎮 ${s}`;
  }
  return `💎 ${s}`;
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function paymentTitle(key, t) {
  if (key === 'dc_city') return t('payment_dc');
  if (key === 'alif') return t('payment_alif');
  if (key === 'mastercard') return t('payment_mc');
  if (key === 'milli') return t('payment_milli');
  return key;
}

export function paymentNumber(key, cfg) {
  if (key === 'dc_city') return cfg.dcCityNumber;
  if (key === 'alif') return cfg.alifNumber;
  if (key === 'mastercard') return cfg.mastercardNumber;
  if (key === 'milli') return cfg.milliNumber;
  return '';
}
