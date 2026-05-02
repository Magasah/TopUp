/**
 * Hardened input validation.
 *
 * Rules:
 *  - Player IDs are NUMERIC only, 6–14 digits (covers FF / PUBG ranges).
 *  - We strip everything that is not [0-9] before checking length.
 *  - All strings used in rendering or forwarded to Telegram are HTML-escaped
 *    to prevent XSS / injection into Telegram HTML parse mode.
 *  - We never use string concatenation to build SQL — there is no DB here,
 *    but the same principle applies if you add one later: parameterize.
 */

export const PLAYER_ID_REGEX = /^[0-9]{6,14}$/;

export function sanitizePlayerId(input: string): string {
  return (input || '').replace(/[^0-9]/g, '').slice(0, 14);
}

export function isValidPlayerId(input: string): boolean {
  return PLAYER_ID_REGEX.test(input);
}

/** Escape for Telegram HTML parse mode (also safe for HTML rendering) */
export function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allow only safe charset for telegram usernames / display names */
export function sanitizeHandle(input: string | undefined | null): string {
  if (!input) return '';
  return String(input).replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
}

/** Whitelisted enums to avoid arbitrary strings flowing into our pipeline */
export const ALLOWED_GAMES = ['freefire', 'pubg'] as const;
export const ALLOWED_WALLETS = ['dc', 'alif', 'mastercard', 'milli'] as const;
export const ALLOWED_LOCALES = ['ru', 'tj'] as const;
