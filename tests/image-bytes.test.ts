import { describe, expect, it } from 'vitest';
import {
  MAX_UPLOAD_BYTES, describePayload, extensionForFormat, mimeTypeForFormat, previewBytes,
  printableSnippet, sniffImageFormat, validateImageBytes,
} from '../src/lib/image-bytes';

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => new Uint8Array([...text].map((char) => char.charCodeAt(0)));

describe('şəkil baytlarının tanınması', () => {
  it('JPEG, PNG, WebP, GIF və HEIC imzalarını tanıyır', () => {
    expect(sniffImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe('jpeg');
    expect(sniffImageFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
    expect(sniffImageFormat(new Uint8Array([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')]))).toBe('webp');
    expect(sniffImageFormat(ascii('GIF89a......'))).toBe('gif');
    expect(sniffImageFormat(new Uint8Array([0, 0, 0, 0, ...ascii('ftypheic')]))).toBe('heic');
  });

  it('HTML, JSON və XML xəta cavablarını şəkil kimi qəbul etmir', () => {
    expect(sniffImageFormat(ascii('<!DOCTYPE html><html><body>404</body></html>'))).toBe('html');
    expect(sniffImageFormat(ascii('{"statusCode":404,"message":"Not Found"}'))).toBe('json');
    expect(sniffImageFormat(ascii('<?xml version="1.0"?><Error><Code>NoSuchKey</Code></Error>'))).toBe('xml');
  });

  it('boş və naməlum baytları ayırır', () => {
    expect(sniffImageFormat(new Uint8Array(0))).toBe('empty');
    expect(sniffImageFormat(bytes(0x00, 0x01, 0x02, 0x03))).toBe('unknown');
  });

  it('ilk baytları hex və ASCII kimi göstərir', () => {
    const preview = previewBytes(bytes(0xff, 0xd8, 0xff, 0x41), 4);
    expect(preview.hex).toBe('FF D8 FF 41');
    expect(preview.ascii).toBe('...A');
  });

  it('mətn gövdəsini log üçün oxunaqlı edir', () => {
    expect(printableSnippet(ascii('{"error":\n"Not Found"}'))).toBe('{"error": "Not Found"}');
  });
});

describe('yükləmə üçün bayt yoxlaması', () => {
  it('düzgün JPEG baytlarını qəbul edir və MIME/uzantını baytlardan götürür', () => {
    const verdict = validateImageBytes(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10), {
      declaredMimeType: 'image/jpeg', sizeBytes: 1024,
    });
    expect(verdict.ok).toBe(true);
    if (!verdict.ok) return;
    expect(verdict.mimeType).toBe('image/jpeg');
    expect(verdict.extension).toBe('jpg');
    expect(verdict.declaredMismatch).toBe(false);
  });

  it('baytlar PNG olsa da MIME JPEG elan olunubsa uyğunsuzluğu bildirir', () => {
    const verdict = validateImageBytes(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), {
      declaredMimeType: 'image/jpeg; charset=binary',
    });
    expect(verdict.ok).toBe(true);
    if (!verdict.ok) return;
    expect(verdict.mimeType).toBe('image/png');
    expect(verdict.extension).toBe('png');
    expect(verdict.declaredMismatch).toBe(true);
  });

  it('şəkil olmayan faylı səbəbi ilə birlikdə rədd edir', () => {
    const verdict = validateImageBytes(ascii('<!DOCTYPE html><html><body>403 Forbidden</body></html>'));
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.format).toBe('html');
    expect(verdict.reason).toContain('HTML');
  });

  it('HEIC və GIF kimi dəstəklənməyən formatları rədd edir', () => {
    const heic = validateImageBytes(new Uint8Array([0, 0, 0, 0, ...ascii('ftypheic')]));
    expect(heic.ok).toBe(false);
    if (!heic.ok) expect(heic.reason).toContain('HEIC');
    expect(validateImageBytes(ascii('GIF89a......')).ok).toBe(false);
  });

  it('limitdən böyük və boş faylı rədd edir', () => {
    const tooLarge = validateImageBytes(bytes(0xff, 0xd8, 0xff), { sizeBytes: MAX_UPLOAD_BYTES + 1 });
    expect(tooLarge.ok).toBe(false);
    if (!tooLarge.ok) expect(tooLarge.reason).toContain('10 MB');
    const empty = validateImageBytes(new Uint8Array(0));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.format).toBe('empty');
  });

  it('format köməkçiləri MIME və uzantı qaytarır', () => {
    expect(mimeTypeForFormat('webp')).toBe('image/webp');
    expect(extensionForFormat('jpeg')).toBe('jpg');
    expect(describePayload('json', { hex: '7B', ascii: '{' })).toContain('JSON');
  });
});
