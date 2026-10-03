// Fayl baytlarının (magic bytes) növünü təyin edən köməkçilər.
// Bu modul React Native API-lərindən asılı deyil: həm tətbiqdə, həm də testlərdə eyni işləyir.

export type ImageFormat =
  | 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'heic' | 'bmp' | 'tiff' | 'svg'
  | 'json' | 'html' | 'xml' | 'text' | 'empty' | 'unknown';

/** API yalnız bu formatları qəbul edir (bax: apps/api media-policy). */
export const UPLOAD_IMAGE_FORMATS = ['jpeg', 'png', 'webp'] as const;
export type UploadImageFormat = (typeof UPLOAD_IMAGE_FORMATS)[number];
/** API limiti: 10 MB. */
export const MAX_UPLOAD_BYTES = 10_000_000;

export type BytePreview = { hex: string; ascii: string };

export type ImageValidation =
  | { ok: true; format: UploadImageFormat; mimeType: string; extension: string;
      declaredMismatch: boolean; preview: BytePreview }
  | { ok: false; format: ImageFormat; reason: string; preview: BytePreview };

export type ValidateImageOptions = {
  declaredMimeType?: string | null;
  sizeBytes?: number | null;
  allowedFormats?: readonly ImageFormat[];
  maxBytes?: number;
};

const MIME_BY_FORMAT: Partial<Record<ImageFormat, string>> = {
  jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  avif: 'image/avif', heic: 'image/heic', bmp: 'image/bmp', tiff: 'image/tiff', svg: 'image/svg+xml',
};

const EXTENSION_BY_FORMAT: Partial<Record<ImageFormat, string>> = {
  jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif',
  avif: 'avif', heic: 'heic', bmp: 'bmp', tiff: 'tiff', svg: 'svg',
};

const LABEL_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: 'JPEG', png: 'PNG', webp: 'WebP', gif: 'GIF', avif: 'AVIF', heic: 'HEIC',
  bmp: 'BMP', tiff: 'TIFF', svg: 'SVG', json: 'JSON cavabı', html: 'HTML səhifəsi',
  xml: 'XML cavabı', text: 'mətn', empty: 'boş cavab', unknown: 'naməlum baytlar',
};

const HEIF_BRANDS = [
  'heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1',
];

export function formatLabel(format: ImageFormat): string {
  return LABEL_BY_FORMAT[format];
}

export function mimeTypeForFormat(format: ImageFormat): string | null {
  return MIME_BY_FORMAT[format] ?? null;
}

export function extensionForFormat(format: ImageFormat): string | null {
  return EXTENSION_BY_FORMAT[format] ?? null;
}

export function isImageFormat(format: ImageFormat): boolean {
  return Boolean(MIME_BY_FORMAT[format]);
}

export function isUploadImageFormat(format: ImageFormat): format is UploadImageFormat {
  return (UPLOAD_IMAGE_FORMATS as readonly ImageFormat[]).includes(format);
}

export function isTextualFormat(format: ImageFormat): boolean {
  return format === 'json' || format === 'html' || format === 'xml' || format === 'text';
}

/** Content-Type başlığını 'image/jpeg; charset=...' formasından təmizləyir. */

/** Diaqnostika üçün ilk baytları hex + ASCII şəklində göstərir. */
export function previewBytes(bytes: Uint8Array, limit = 16): BytePreview {
  const end = Math.min(bytes.length, Math.max(0, limit));
  const hex: string[] = [];
  let ascii = '';
  for (let index = 0; index < end; index += 1) {
    const value = bytes[index] ?? 0;
    hex.push(value.toString(16).toUpperCase().padStart(2, '0'));
    ascii += value >= 32 && value < 127 ? String.fromCharCode(value) : '.';
  }
  if (bytes.length > end) { hex.push('…'); ascii += '…'; }
  return { hex: hex.join(' '), ascii };
}

/** Mətn cavablarını (JSON/HTML/XML) log üçün oxunaqlı sətrə çevirir. */
export function printableSnippet(bytes: Uint8Array, limit = 400): string {
  const end = Math.min(bytes.length, Math.max(0, limit));
  let text = '';
  for (let index = 0; index < end; index += 1) {
    const value = bytes[index] ?? 0;
    text += value === 9 || value === 10 || value === 13
      ? ' '
      : value >= 32 && value < 127 ? String.fromCharCode(value) : '·';
  }
  return text.replace(/\s+/g, ' ').trim();
}

function startsWithBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[offset + index] !== signature[index]) return false;
  }
  return true;
}

function matchesAscii(bytes: Uint8Array, text: string, offset = 0): boolean {
  if (bytes.length < offset + text.length) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (bytes[offset + index] !== text.charCodeAt(index)) return false;
  }
  return true;
}

function asciiWindow(bytes: Uint8Array, start: number, end: number): string {
  const limit = Math.min(Math.max(end, start), bytes.length);
  let text = '';
  for (let index = start; index < limit; index += 1) text += String.fromCharCode(bytes[index] ?? 0);
  return text;
}

function looksLikeText(bytes: Uint8Array): boolean {
  const end = Math.min(bytes.length, 256);
  if (!end) return false;
  let printable = 0;
  for (let index = 0; index < end; index += 1) {
    const value = bytes[index] ?? 0;
    if (value === 0) return false;
    if ((value >= 32 && value < 127) || value === 9 || value === 10 || value === 13) printable += 1;
  }
  return printable / end >= 0.85;
}

/** Baytların ilk hissəsinə görə formatı təyin edir (Pillow-dakı 'identify' addımının ekvivalenti). */
export function sniffImageFormat(bytes: Uint8Array): ImageFormat {
  if (!bytes.length) return 'empty';

  // Şəkil imzaları (magic bytes).
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (matchesAscii(bytes, 'GIF87a') || matchesAscii(bytes, 'GIF89a')) return 'gif';
  if (matchesAscii(bytes, 'RIFF') && matchesAscii(bytes, 'WEBP', 8)) return 'webp';
  if (matchesAscii(bytes, 'ftyp', 4)) {
    const brand = asciiWindow(bytes, 8, 12).toLowerCase();
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (HEIF_BRANDS.includes(brand)) return 'heic';
  }
  if (matchesAscii(bytes, 'BM') && bytes.length > 14) return 'bmp';
  if (startsWithBytes(bytes, [0x49, 0x49, 0x2a, 0x00])
    || startsWithBytes(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';

  // Şəkil olmayan cavablar: API/servers xəta gövdələri.
  const head = asciiWindow(bytes, 0, Math.min(bytes.length, 512)).trim().toLowerCase();
  if (!head) return 'text';
  if (head.startsWith('{') || head.startsWith('[')) return 'json';
  if (head.startsWith('<!doctype html') || head.startsWith('<html') || head.startsWith('<head')
    || head.startsWith('<body') || head.startsWith('<script') || head.startsWith('<!--')) return 'html';
  if (head.includes('<?xml')) return head.includes('<svg') ? 'svg' : 'xml';
  if (head.includes('<svg')) return 'svg';
  if (looksLikeText(bytes)) return 'text';
  return 'unknown';
}

/** Şəkil olmayan gövdəni istifadəçiyə/log-a izah edən mətn qaytarır. */
export function describePayload(format: ImageFormat, preview: BytePreview): string {
  switch (format) {
    case 'empty': return 'Cavab boşdur (0 bayt gəldi).';
    case 'html': return 'Şəkil yerinə HTML səhifəsi gəldi (adətən 403/404 xəta səhifəsi).';
    case 'json': return 'Şəkil yerinə JSON cavabı gəldi (API xətası və ya yanlış ünvan).';
    case 'xml': return 'Şəkil yerinə XML cavabı gəldi (saxlama xidmətinin xətası, məsələn S3 NoSuchKey).';
    case 'text': return `Şəkil yerinə mətn gəldi (ilk baytlar: ${preview.hex}).`;
    case 'svg': return 'Fayl SVG-dir; tətbiq yalnız JPEG, PNG və WebP formatlarını qəbul edir.';
    case 'heic': return 'HEIC formatı dəstəklənmir; JPEG, PNG və ya WebP seçin.';
    case 'avif': return 'AVIF formatı dəstəklənmir; JPEG, PNG və ya WebP seçin.';
    case 'gif': return 'GIF formatı dəstəklənmir; JPEG, PNG və ya WebP seçin.';
    case 'bmp': return 'BMP formatı dəstəklənmir; JPEG, PNG və ya WebP seçin.';
    case 'tiff': return 'TIFF formatı dəstəklənmir; JPEG, PNG və ya WebP seçin.';
    default: return `Fayl şəkil kimi tanınmadı (ilk baytlar: ${preview.hex}).`;
  }
}

/** Baytları native dekoderə/Pillow-a verməzdən əvvəl yoxlayır: boş, böyük, HTML/JSON, yanlış format. */
export function validateImageBytes(bytes: Uint8Array, options: ValidateImageOptions = {}): ImageValidation {
  const preview = previewBytes(bytes, 16);
  const format = sniffImageFormat(bytes);
  const sizeBytes = options.sizeBytes ?? bytes.length;
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  const allowed = options.allowedFormats ?? UPLOAD_IMAGE_FORMATS;

  if (format === 'empty' || sizeBytes <= 0) {
    return { ok: false, format: 'empty', reason: 'Seçilmiş fayl boşdur, şəkil deyil.', preview };
  }
  if (sizeBytes > maxBytes) {
    return { ok: false, format, reason: `Şəkil ${Math.round(maxBytes / 1_000_000)} MB-dan kiçik olmalıdır.`, preview };
  }
  if (!isImageFormat(format) || !(allowed as readonly ImageFormat[]).includes(format)) {
    return { ok: false, format, reason: describePayload(format, preview), preview };
  }

  const mimeType = mimeTypeForFormat(format);
  const extension = extensionForFormat(format);
  if (!mimeType || !extension) {
    return { ok: false, format, reason: describePayload(format, preview), preview };
  }

  const declared = normalizeMimeType(options.declaredMimeType);
  return {
    ok: true, format: format as UploadImageFormat, mimeType, extension, preview,
    declaredMismatch: declared !== null && declared !== mimeType,
  };
}

export function normalizeMimeType(value?: string | null): string | null {
  if (!value) return null;
  const normalized = (value.split(';')[0] ?? '').trim().toLowerCase();
  return normalized || null;
}
