export type ContactKind = 'whatsapp' | 'phone' | 'email';

/** Accept only a contact address, then encode optional product context separately. */
export function contactUrl(kind: ContactKind, value?: string | null, message?: string): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (kind === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? 'mailto:' + encodeURIComponent(text) : null;
  }
  if (!/^[+\d() .-]+$/.test(text)) return null;
  let digits = text.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length < 7 || digits.length > 15) return null;
  if (kind === 'phone') return 'tel:' + (text.startsWith('+') || text.startsWith('00') ? '+' : '') + digits;
  if (digits.length === 10 && digits.startsWith('0')) digits = '994' + digits.slice(1);
  return 'https://wa.me/' + digits + (message ? '?text=' + encodeURIComponent(message) : '');
}
