/** Pretty-print phone / card numbers for UI (copy still uses canonical `number`). */

export function formatPaymentDisplay(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';

  const digits = s.replace(/\D/g, '');

  // Tajik mobile (+992 …)
  if (s.startsWith('+') && digits.length >= 9) {
    if (digits.startsWith('992') && digits.length === 12) {
      const rest = digits.slice(3);
      return `+992 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
    }
  }

  // Long digit strings → groups of 4 (cards / Milli)
  if (/^\d{12,19}$/.test(digits)) {
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  return s;
}
