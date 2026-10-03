import { describe, expect, it } from 'vitest';
import { demoCatalogResponse } from '../src/features/catalog/demo-api';
import type { Product, Store } from '../src/api/types';

describe('nümunə kataloq', () => {
  it('kateqoriya, şəhər və mağaza üzrə məhsulları süzür', () => {
    const result = demoCatalogResponse<Product[]>('/products', {
      category: 'geyim-ayaqqabi-ve-tekstil', city: 'Bakı', store: 'baku-tekstil-mmc',
    });
    expect(result?.data.length).toBeGreaterThan(0);
    expect(result?.data.every((product) => product.store?.slug === 'baku-tekstil-mmc')).toBe(true);
  });

  it('siyahıdakı məhsul və mağaza detallarını açır', () => {
    const first = demoCatalogResponse<Product[]>('/products', { limit: 1 })?.data[0];
    expect(first).toBeDefined();
    expect(demoCatalogResponse<Product>('/products/' + first?.slug)?.data.id).toBe(first?.id);
    expect(demoCatalogResponse<Store>('/stores/' + first?.store?.slug)?.data.id).toBe(first?.store?.id);
  });

  it('davam səhifəsində təkrarlanan məhsul göstərmir', () => {
    const first = demoCatalogResponse<Product[]>('/products', { limit: 4 });
    const next = demoCatalogResponse<Product[]>('/products', { limit: 4, cursor: first?.meta?.nextCursor });
    expect(first?.meta?.total).toBeGreaterThan(4);
    expect(next?.data.every((product) => !first?.data.some((previous) => previous.id === product.id))).toBe(true);
  });

  it('mağaza axtarışını şəhər və əsas kateqoriya ilə birlikdə tətbiq edir', () => {
    const first = demoCatalogResponse<Store[]>('/stores', {})!.data[0];
    const result = demoCatalogResponse<Store[]>('/stores', { q: first.name, city: first.city, category: first.category?.slug });
    expect(result?.data.map((store) => store.id)).toEqual([first.id]);
    expect(demoCatalogResponse<Store[]>('/stores', { city: 'Bak' })?.data).toEqual([]);
  });

  it('mağazaları məhsul sayına görə sıralayır və davamda təkrar göstərmir', () => {
    const sorted = demoCatalogResponse<Store[]>('/stores', { sort: 'products' })!.data;
    expect(sorted.map((store) => store.productCount)).toEqual(sorted.map((store) => store.productCount).sort((a, b) => (b ?? 0) - (a ?? 0)));
    const first = demoCatalogResponse<Store[]>('/stores', { sort: 'products', limit: 2 })!;
    const next = demoCatalogResponse<Store[]>('/stores', { sort: 'products', limit: 2, cursor: first.meta?.nextCursor })!;
    expect(first.meta?.nextCursor).toBeTruthy();
    expect(new Set([...first.data, ...next.data].map((store) => store.id)).size).toBe(sorted.length);
  });
});
