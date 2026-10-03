import { afterEach, describe, expect, it, vi } from 'vitest';
import { inspectImageUrl, readBlobHead } from '../src/lib/remote-image';

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const ascii = (text: string) => new Uint8Array([...text].map((char) => char.charCodeAt(0)));

afterEach(() => { vi.unstubAllGlobals(); });

describe('şəkil ünvanının yoxlanması', () => {
  it('2xx + image/png cavabını uğurlu sayır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(pngBytes, {
      status: 200, headers: { 'content-type': 'image/png', 'content-length': String(pngBytes.length) },
    })));
    const result = await inspectImageUrl('https://cdn.test/a.png');
    expect(result.ok).toBe(true);
    expect(result.httpStatus).toBe(200);
    expect(result.contentType).toBe('image/png');
    expect(result.format).toBe('png');
    expect(result.preview.hex).toContain('89 50 4E 47');
  });

  it('404 HTML cavabını səbəbi ilə bildirir (tətbiq dayanmır)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      ascii('<!DOCTYPE html><html><body>404 Not Found</body></html>'),
      { status: 404, headers: { 'content-type': 'text/html' } },
    )));
    const result = await inspectImageUrl('https://cdn.test/eksik.jpg');
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(404);
    expect(result.contentType).toBe('text/html');
    expect(result.format).toBe('html');
    expect(result.reason).toContain('404');
    expect(result.bodySnippet).toContain('404 Not Found');
  });

  it('200 gələn JSON cavabını şəkil kimi qəbul etmir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      ascii('{"error":"yanlış ünvan"}'),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )));
    const result = await inspectImageUrl('https://api.test/media/x.jpg');
    expect(result.ok).toBe(false);
    expect(result.format).toBe('json');
    expect(result.reason).toContain('JSON');
  });

  it('200 gələn XML xətasını bildirir (məsələn S3 NoSuchKey)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      ascii('<?xml version="1.0"?><Error><Code>NoSuchKey</Code></Error>'),
      { status: 200, headers: { 'content-type': 'application/xml' } },
    )));
    const result = await inspectImageUrl('https://cdn.test/yox.jpg');
    expect(result.ok).toBe(false);
    expect(result.format).toBe('xml');
    expect(result.reason).toContain('XML');
  });

  it('şəbəkə xətasında throw etmir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network request failed'); }));
    const result = await inspectImageUrl('https://cdn.test/x.jpg');
    expect(result.ok).toBe(false);
    expect(result.networkError).toBe('Network request failed');
    expect(result.timedOut).toBe(false);
  });

  it('timeout olanda sorğunu dayandırır', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: { signal?: AbortSignal }) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
    })));
    const result = await inspectImageUrl('https://cdn.test/yavas.jpg', { timeoutMs: 10 });
    expect(result.ok).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.reason).toContain('timeout');
  });

  it('böyük cavabı yükləmədən yoxlamanı dayandırır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(pngBytes, {
      status: 200, headers: { 'content-length': '10485760', 'content-type': 'image/jpeg' },
    })));
    const result = await inspectImageUrl('https://cdn.test/boyuk.jpg', { maxBytes: 1024 });
    expect(result.bodySkipped).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('Blob-un yalnız ilk baytlarını oxuyur', async () => {
    const head = await readBlobHead(new Blob([pngBytes]), 4);
    expect([...head]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});
