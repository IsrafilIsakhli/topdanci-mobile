import { CDN_BASE_URL } from '../api/config';

// Şəkil kimi göstərilə bilməyən fayl uzantıları (server xəta səhifələri və s.).
const NON_IMAGE_EXTENSION = /\.(?:html?|json|txt|xml|php|asp|aspx|jsp|css|js|pdf)$/i;
const LOCAL_DEVICE_URI = /^(?:file|content|asset|ph):/i;
const DATA_URI_MAX_LENGTH = 4096;
const DEV = typeof __DEV__ !== 'undefined' && __DEV__;

const warnedValues = new Set<string>();

/**
 * API-dən gələn dəyəri etibarlı şəkil ünvanına çevirir.
 * - https://..., //host/..., data:image/..., file://... olduğu kimi qaytarılır.
 * - CDN açarı (məsələn stores/1/assets/logo/x.jpg) CDN_BASE_URL ilə birləşdirilir.
 * - Şəkil olmadığı bilinən dəyər (JSON/HTML qalığı, .html/.json uzantısı) və ya CDN bazası
 *   təyin edilmədiyi hal üçün null qaytarılır: native dekoderə heç vaxt yanlış bayt getməsin.
 */
export function mediaUrl(value?: string | null): string | null {
  const clean = normalizeMediaValue(value);
  if (!clean) return null;
  if (LOCAL_DEVICE_URI.test(clean)) return clean;
  if (/^data:/i.test(clean)) {
    return clean.length <= DATA_URI_MAX_LENGTH && /^data:image\//i.test(clean) ? clean : null;
  }
  if (/^https?:\/\//i.test(clean)) return clean;
  if (/^\/\//.test(clean)) return 'https:' + clean;

  const path = clean.split(/[?#]/)[0] ?? clean;
  if (NON_IMAGE_EXTENSION.test(path)) return null;
  if (!CDN_BASE_URL) return null;
  return CDN_BASE_URL + '/' + clean.replace(/^\/+/, '');
}

/** Şəkil ünvanı kimi istifadə oluna bilməyən dəyərləri təmizləyir. */
function normalizeMediaValue(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/^["'`]+|["'`]+$/g, '');
  if (!trimmed || trimmed.length > DATA_URI_MAX_LENGTH) return null;
  if (/[\s<>]/.test(trimmed)) return null;
  if (/^[\[{]/.test(trimmed)) return null;
  return trimmed;
}

/** mediaUrl null qaytardıqda səbəbi izah edir (log üçün); ünvan düzgündürsə null qaytarır. */
export function explainUnresolvedMedia(value?: string | null): string | null {
  if (value === undefined || value === null || value === '') return 'Şəkil dəyəri yoxdur.';
  const clean = normalizeMediaValue(value);
  if (!clean) return `Şəkil dəyəri etibarlı deyil: ${String(value).slice(0, 120)}`;
  if (/^data:/i.test(clean)) return 'data: ünvanı şəkil tipində deyil (data:image/... olmalıdır).';
  if (/^(?:https?:\/\/|\/\/|file:|content:|asset:|ph:)/i.test(clean)) return null;
  const path = clean.split(/[?#]/)[0] ?? clean;
  if (NON_IMAGE_EXTENSION.test(path)) return `Fayl uzantısı şəkil deyil: ${path}`;
  if (!CDN_BASE_URL) return `EXPO_PUBLIC_CDN_BASE_URL boşdur; "${clean}" açarı ünvana çevrilə bilmir.`;
  return null;
}

/** Development rejimində izahı bir dəfə log-a yazır ki, siyahı render-i log-u doldurmasın. */
export function warnUnresolvedMedia(value?: string | null): void {
  if (!DEV) return;
  const reason = explainUnresolvedMedia(value);
  if (!reason) return;
  if (warnedValues.has(reason)) return;
  if (warnedValues.size > 200) warnedValues.clear();
  warnedValues.add(reason);
  console.warn('[şəkil] ünvan yararsızdır', { value, reason });
}
