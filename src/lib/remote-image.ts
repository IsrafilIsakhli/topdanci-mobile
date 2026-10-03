import {
  describePayload, isImageFormat, isTextualFormat, previewBytes, printableSnippet,
  sniffImageFormat, type BytePreview, type ImageFormat,
} from './image-bytes';

const DEV = typeof __DEV__ !== 'undefined' && __DEV__;
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 64 * 1024;
const SNIFF_BYTES = 512;
const REPORT_LIMIT = 200;

const reportedUrls = new Set<string>();

export type RemoteImageInspection = {
  url: string;
  /** true = HTTP 2xx və baytlar şəkil formatına uyğundur. */
  ok: boolean;
  reason: string;
  httpStatus: number | null;
  contentType: string | null;
  contentLength: number | null;
  format: ImageFormat;
  preview: BytePreview;
  /** JSON/HTML/XML cavablarında gövdənin ilk hissəsi (debug üçün). */
  bodySnippet: string | null;
  bodySkipped: boolean;
  timedOut: boolean;
  networkError: string | null;
};

export type InspectImageOptions = {
  timeoutMs?: number;
  maxBytes?: number;
};

type BlobFileReader = {
  result: string | ArrayBuffer | null;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  readAsArrayBuffer(blob: Blob): void;
};

/**
 * Blob-un yalnız ilk baytlarını oxuyur.
 * Web/Node mühitində Blob.arrayBuffer(), React Native-də FileReader istifadə olunur
 * (RN Blob-da arrayBuffer() yoxdur, ArrayBuffer-dən Blob yaratmaq isə qadağandır).
 */
export async function readBlobHead(blob: Blob, limit = SNIFF_BYTES): Promise<Uint8Array> {
  if (!blob || typeof blob.size !== 'number' || blob.size <= 0) return new Uint8Array(0);
  const part = typeof blob.slice === 'function' ? blob.slice(0, limit) : blob;

  const direct = part as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof direct.arrayBuffer === 'function') {
    return new Uint8Array(await direct.arrayBuffer()).slice(0, limit);
  }

  const FileReaderConstructor = (globalThis as { FileReader?: new () => BlobFileReader }).FileReader;
  if (FileReaderConstructor) {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReaderConstructor();
      reader.onload = () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) resolve(new Uint8Array(result).slice(0, limit));
        else reject(new Error('Blob oxunmadı.'));
      };
      reader.onerror = () => reject(new Error('Blob oxunmadı.'));
      reader.readAsArrayBuffer(part);
    });
  }

  throw new Error('Bu mühitdə Blob baytlarını oxumaq mümkün deyil.');
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'naməlum xəta';
}

/**
 * Şəkil ünvanını tətbiqi dayandırmadan yoxlayır: HTTP status, Content-Type, ilk baytlar.
 * Heç vaxt throw etmir — nəticəni təsvir edən obyekt qaytarır.
 */
export async function inspectImageUrl(url: string, options: InspectImageOptions = {}): Promise<RemoteImageInspection> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let httpStatus: number | null = null;
  let contentType: string | null = null;
  let contentLength: number | null = null;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'image/*, */*;q=0.5', range: `bytes=0-${Math.max(maxBytes - 1, 0)}` },
      signal: controller.signal,
    });

    httpStatus = response.status;
    contentType = response.headers.get('content-type');
    contentLength = parseContentLength(response.headers.get('content-length'));

    // Server Range sorğusunu saymaya bilər: böyük cavabı yükləməkdənsə yoxlamadan baxırıq.
    const bodyExpected = response.status === 206 || contentLength === null || contentLength <= maxBytes;
    if (!bodyExpected) {
      return {
        url, ok: response.ok, httpStatus, contentType, contentLength,
        format: 'unknown', preview: { hex: '', ascii: '' }, bodySnippet: null,
        bodySkipped: true, timedOut: false, networkError: null,
        reason: response.ok
          ? `Cavab gövdəsi yoxlanmadı (Content-Length ${contentLength} bayt limitdən böyükdür).`
          : `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }

    const blob = await response.blob();
    const head = await readBlobHead(blob);
    const format = sniffImageFormat(head);
    const preview = previewBytes(head, 16);
    const bodySnippet = isTextualFormat(format) ? printableSnippet(head, 400) : null;
    const detail = bodySnippet ? ` · ${bodySnippet}` : '';

    if (!response.ok) {
      return {
        url, ok: false, httpStatus, contentType, contentLength, format, preview, bodySnippet,
        bodySkipped: false, timedOut: false, networkError: null,
        reason: `HTTP ${response.status} ${response.statusText}`.trim() + detail,
      };
    }

    if (!isImageFormat(format)) {
      return {
        url, ok: false, httpStatus, contentType, contentLength, format, preview, bodySnippet,
        bodySkipped: false, timedOut: false, networkError: null,
        reason: describePayload(format, preview) + detail,
      };
    }

    return {
      url, ok: true, httpStatus, contentType, contentLength, format, preview, bodySnippet,
      bodySkipped: false, timedOut: false, networkError: null,
      reason: `${format} · Content-Type: ${contentType ?? 'yoxdur'} · ${blob.size} bayt`,
    };
  } catch (error) {
    const aborted = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
    return {
      url, ok: false, httpStatus, contentType, contentLength,
      format: 'unknown', preview: { hex: '', ascii: '' }, bodySnippet: null, bodySkipped: false,
      timedOut: aborted,
      networkError: aborted ? null : messageOf(error),
      reason: aborted
        ? `Ünvan ${timeoutMs} ms ərzində cavab vermədi (timeout).`
        : `Şəkil ünvanına qoşulmaq mümkün olmadı: ${messageOf(error)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * expo-image/native dekoder xəta verdikdə səbəbi araşdırır və ilk baytları log-a yazır.
 * Xəta verən URL bir dəfə log olunur ki, siyahı sürüşdürməsi log-u doldurmasın.
 */
export async function reportImageLoadFailure(
  url: string, error: unknown, context = 'image',
): Promise<RemoteImageInspection> {
  const inspection = await inspectImageUrl(url);
  if (!DEV || reportedUrls.has(url)) return inspection;

  reportedUrls.add(url);
  if (reportedUrls.size > REPORT_LIMIT) reportedUrls.clear();

  console.warn('[şəkil] yüklənmədi', {
    url,
    context,
    error: messageOf(error),
    ok: inspection.ok,
    reason: inspection.reason,
    httpStatus: inspection.httpStatus,
    contentType: inspection.contentType,
    contentLength: inspection.contentLength,
    format: inspection.format,
    firstBytesHex: inspection.preview.hex,
    firstBytesAscii: inspection.preview.ascii,
    bodySnippet: inspection.bodySnippet,
  });

  return inspection;
}
