export const leadLabels: Record<string, string> = { PRODUCT_VIEW: 'Məhsula baxış', STORE_VIEW: 'Mağazaya baxış', WHATSAPP_CLICK: 'WhatsApp ilə əlaqə', PHONE_REVEAL: 'Telefon nömrəsinə baxış', EMAIL_CLICK: 'E-poçt ilə əlaqə' };
export function leadLabel(type: string) { return leadLabels[type] ?? 'Alıcı hadisəsi'; }
export function dateLabel(value: unknown) {
  const d = new Date(String(value)); if (Number.isNaN(d.valueOf())) return '—';
  const months = ['yan','fev','mar','apr','may','iyn','iyl','avq','sen','okt','noy','dek'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
export function numberValue(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? n : 0; }
