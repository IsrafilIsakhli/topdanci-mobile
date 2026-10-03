import { describe, expect, it } from 'vitest';
import { demoCatalogResponse } from '../src/features/catalog/demo-api';
import { demoProducts } from '../src/features/catalog/demo-data';
import { emptyFilters, filterCount, productParams, routeText, uniqueProducts, validateFilters } from '../src/features/catalog/product-filters';
import type { Product } from '../src/api/types';

describe('məhsul axtarışı və filtrlər', () => {
  it('vergüllə daxil edilən qiyməti API rəqəminə çevirir və boş limit göndərmir', () => {
    const params = productParams('  adapter  ', { ...emptyFilters, city: ' Bakı ', priceMin: '4,9', priceMax: '10', verified: true }, 'price_asc');
    expect(params).toMatchObject({ q: 'adapter', city: 'Bakı', priceMin: 4.9, priceMax: 10, verified: true });
    expect(params.minOrderMax).toBeUndefined();
    expect(productParams('', emptyFilters, 'newest').verified).toBeUndefined();
  });
  it('səhv qiyməti və tərs aralığı tətbiq etməyə icazə vermir', () => {
    for (const value of ['-1', 'abc', 'Infinity', '0x10', '1e3', '1,2,3']) {
      expect(validateFilters({ ...emptyFilters, priceMax: value })).toBeDefined();
    }
    expect(validateFilters({ ...emptyFilters, priceMin: '20', priceMax: '10' })).toBeDefined();
    expect(validateFilters({ ...emptyFilters, minOrderMax: '-2' })).toBeDefined();
    expect(validateFilters({ ...emptyFilters, priceMin: '0', priceMax: '0' })).toBeUndefined();
    expect(validateFilters({ ...emptyFilters, priceMin: '7,5', priceMax: '28' })).toBeUndefined();
  });
  it('birləşmiş filtrlər yalnız uyğun elanları qaytarır', () => {
    const params = productParams('', { ...emptyFilters, category: 'elektronika-ve-aksesuarlar', city: 'Bakı',
      stock: 'IN_STOCK', priceMin: '4', priceMax: '5', minOrderMax: '100', verified: true }, 'price_asc');
    const result = demoCatalogResponse<Product[]>('/products', params)!;
    expect(result.data.map((product) => product.title)).toEqual(['USB-C adapterlər, 100 ədədlik partiya']);
    expect(result.meta?.total).toBe(1);
    expect(filterCount({ ...emptyFilters, ...params, priceMin: '4', priceMax: '5', minOrderMax: '100', verified: true })).toBe(6);
  });
  it('şəhər adı qismən uyğunluqla səhv nəticə çıxarmır', () => {
    expect(demoCatalogResponse<Product[]>('/products', { city: 'Bak' })?.data).toHaveLength(0);
    expect(demoCatalogResponse<Product[]>('/products', { city: '  Bakı  ' })?.data.length).toBeGreaterThan(0);
  });
  it('hər iki qiymət sıralamasında razılaşma elanlarını axırda saxlayır', () => {
    for (const sort of ['price_asc', 'price_desc']) {
      const items = demoCatalogResponse<Product[]>('/products', { sort })!.data;
      const firstNull = items.findIndex((product) => product.price == null);
      expect(firstNull).toBeGreaterThan(0);
      expect(items.slice(firstNull).every((product) => product.price == null)).toBe(true);
      const prices = items.slice(0, firstNull).map((product) => Number(product.price));
      expect(prices).toEqual([...prices].sort((a, b) => sort === 'price_asc' ? a - b : b - a));
    }
  });
  it('filtrlənmiş siyahının bütün səhifələrində təkrar və itki yoxdur', () => {
    const params = { priceMin: 7, minOrderMax: 100, sort: 'price_desc', limit: 2 };
    const expected = demoCatalogResponse<Product[]>('/products', { ...params, limit: 50 })!.data;
    const received: Product[] = []; let cursor: string | undefined;
    do {
      const result = demoCatalogResponse<Product[]>('/products', { ...params, cursor })!;
      received.push(...result.data); cursor = result.meta?.nextCursor ?? undefined;
    } while (cursor);
    expect(received.map((product) => product.id)).toEqual(expected.map((product) => product.id));
    expect(new Set(received.map((product) => product.id)).size).toBe(received.length);
  });
  it('üst-üstə düşən server səhifələri kartları təkrarlamır', () => {
    expect(uniqueProducts([{ data: demoProducts.slice(0, 3) }, { data: demoProducts.slice(2, 5) }])).toHaveLength(5);
  });
  it('ana səhifədən və mağazadan gələn route seçimlərini oxuyur', () => {
    expect(routeText(['powerbank', 'ignored'])).toBe('powerbank');
    expect(routeText(undefined)).toBe('');
    const filters = { ...emptyFilters, store: demoProducts[0].store!.slug };
    expect(demoCatalogResponse<Product[]>('/products', productParams('', filters, 'newest'))?.data.length).toBe(3);
    expect(demoCatalogResponse<Product[]>('/products', productParams('', emptyFilters, 'newest'))?.meta?.total).toBe(10);
  });
});
