import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import { MAX_UPLOAD_BYTES, validateImageBytes } from '../../lib/image-bytes';
import { readBlobHead } from '../../lib/remote-image';

type UploadTicket = { imageId?: string; storageKey?: string; uploadUrl: string; headers: Record<string, string> };
type PreparedImage = { blob: Blob; fileName: string; contentType: string; sizeBytes: number };

const REQUEST_TIMEOUT_MS = 15_000;
const DEV = typeof __DEV__ !== 'undefined' && __DEV__;

type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;

async function fetchWithTimeout(url: string, init: FetchOptions = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally { clearTimeout(timer); }
}

/**
 * Seçilmiş faylı serverə göndərməzdən əvvəl baytlarını yoxlayır.
 * Əvvəl bu addım yox idi: HEIC/PNG/WebP və ya şəkil olmayan fayl olduğu kimi 'image/jpeg' kimi
 * göndərilirdi və server tərəfdəki şəkil emalı (sharp, yaxud Python/Pillow) baytları deşifrə
 * edə bilmirdi — nəticədə 'cannot identify image file <_io.BytesIO object>' tipli xətalar yaranırdı.
 */
async function selectImage(): Promise<PreparedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_UPLOAD_BYTES) throw new Error('Şəkil 10 MB-dan kiçik olmalıdır.');

  let response: Response;
  try { response = await fetchWithTimeout(asset.uri); }
  catch { throw new Error('Seçilmiş şəkil oxunmadı. Faylı yenidən seçin.'); }
  if (!response.ok && response.status !== 0) throw new Error('Seçilmiş şəkil oxunmadı (HTTP ' + response.status + ').');

  const blob = await response.blob();
  const head = await readBlobHead(blob, 64);
  const verdict = validateImageBytes(head, { declaredMimeType: asset.mimeType, sizeBytes: blob.size });
  if (!verdict.ok) {
    if (DEV) {
      console.warn('[şəkil] seçilmiş fayl qəbul edilmədi', {
        fileName: asset.fileName, declaredMimeType: asset.mimeType, sizeBytes: blob.size,
        format: verdict.format, firstBytesHex: verdict.preview.hex, reason: verdict.reason,
      });
    }
    throw new Error(verdict.reason);
  }
  if (DEV && verdict.declaredMismatch) {
    console.warn('[şəkil] MIME uyğunsuzluğu', { declaredMimeType: asset.mimeType, detectedMimeType: verdict.mimeType });
  }

  // Fayl adı və Content-Type baytlardan götürülür: API uzantı/MIME uyğunsuzluğunu rədd edir.
  const uploadBlob = typeof blob.slice === 'function' ? blob.slice(0, blob.size, verdict.mimeType) : blob;
  return { blob: uploadBlob, fileName: 'image.' + verdict.extension, contentType: verdict.mimeType, sizeBytes: blob.size };
}
async function put(ticket: UploadTicket, blob: Blob) {
  let response: Response;
  try {
    response = await fetchWithTimeout(ticket.uploadUrl, { method: 'PUT', headers: ticket.headers, body: blob });
  } catch { throw new Error('Şəkil yüklənə bilmədi (şəbəkə xətası və ya vaxt bitdi).'); }
  if (!response.ok) throw new Error('Şəkil yüklənmədi (HTTP ' + response.status + ').');
}
export async function uploadProductImage(productId: string) {
  const file = await selectImage(); if (!file) return false;
  const ticket = (await api.post<UploadTicket>('/media/upload-url', {
    productId, fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes,
  })).data;
  await put(ticket, file.blob);
  await api.post('/media/product-images/' + encodeURIComponent(ticket.imageId!) + '/complete', {});
  return true;
}
export async function uploadStoreImage(storeId: string, kind: 'logo' | 'banner') {
  const file = await selectImage(); if (!file) return false;
  const ticket = (await api.post<UploadTicket>('/media/store-assets/upload-url', {
    storeId, kind, fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes,
  })).data;
  await put(ticket, file.blob);
  await api.post('/media/store-assets/' + encodeURIComponent(storeId) + '/complete', {
    kind, storageKey: ticket.storageKey, contentType: file.contentType, sizeBytes: file.sizeBytes,
  });
  return true;
}
