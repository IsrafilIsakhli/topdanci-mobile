import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/api/config', () => ({ CDN_BASE_URL: 'https://cdn.test' }));
import { explainUnresolvedMedia, mediaUrl } from '../src/lib/media';

describe('media URL', () => {
  it('keeps complete URLs and resolves storage keys', () => {
    expect(mediaUrl('https://images.test/a.jpg')).toBe('https://images.test/a.jpg');
    expect(mediaUrl('/stores/logo.jpg')).toBe('https://cdn.test/stores/logo.jpg');
    expect(mediaUrl(null)).toBeNull();
  });

  it('protokol nisbi və data ünvanlarını düzgün emal edir', () => {
    expect(mediaUrl('//cdn.test/a.webp')).toBe('https://cdn.test/a.webp');
    expect(mediaUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(mediaUrl('data:text/html;base64,PGh0bWw+')).toBeNull();
    expect(mediaUrl('file:///data/user/0/cache/photo.jpg')).toBe('file:///data/user/0/cache/photo.jpg');
  });

  it('şəkil olmayan dəyərləri dekoderə ötürmür', () => {
    expect(mediaUrl('/media/error.html')).toBeNull();
    expect(mediaUrl('stores/1/logo.json')).toBeNull();
    expect(mediaUrl('{"error":"Not Found"}')).toBeNull();
    expect(mediaUrl('   ')).toBeNull();
    expect(mediaUrl('<html><body>404</body></html>')).toBeNull();
  });

  it('yararsız ünvanın səbəbini izah edir', () => {
    expect(explainUnresolvedMedia('')).toContain('yoxdur');
    expect(explainUnresolvedMedia('stores/1/logo.json')).toContain('uzantısı');
    expect(explainUnresolvedMedia('https://cdn.test/a.jpg')).toBeNull();
  });
});

