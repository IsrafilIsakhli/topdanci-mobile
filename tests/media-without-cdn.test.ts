import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/api/config', () => ({ CDN_BASE_URL: '' }));
import { explainUnresolvedMedia, mediaUrl } from '../src/lib/media';

describe('CDN bazası təyin edilmədikdə', () => {
  it('CDN açarını uydurma ünvana çevirmir', () => {
    const key = 'stores/1/assets/banner/1712-logo.jpg';
    expect(mediaUrl(key)).toBeNull();
    expect(explainUnresolvedMedia(key)).toContain('EXPO_PUBLIC_CDN_BASE_URL');
  });

  it('tam ünvanları olduğu kimi saxlayır', () => {
    expect(mediaUrl('https://cdn.test/absolute.jpg')).toBe('https://cdn.test/absolute.jpg');
    expect(explainUnresolvedMedia('https://cdn.test/absolute.jpg')).toBeNull();
  });
});
