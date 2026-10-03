import { describe, expect, it } from 'vitest';
import { productPresentation } from '../src/features/catalog/product-presentation';

const product = { id: 'p', slug: 'p', title: 'Məhsul' };
describe('compact catalog terms', () => {
  it('keeps negotiable terms even if an old amount remains', () => {
    expect(productPresentation({ ...product, price: 15, priceType: 'NEGOTIABLE' }).price).toBe('Razılaşma yolu ilə');
  });
  it('does not turn missing or invalid prices into zero or NaN', () => {
    for (const price of [null, undefined, '', 'bad', Infinity, -5]) {
      expect(productPresentation({ ...product, price }).negotiated).toBe(true);
    }
    expect(productPresentation({ ...product, price: 0 }).negotiated).toBe(false);
  });
  it('localizes API units and keeps the existing local demo labels', () => {
    expect(productPresentation({ ...product, minOrderQuantity: 50, unit: 'PIECE' }).minimum).toBe('Min. 50 ədəd');
    expect(productPresentation({ ...product, minOrderQuantity: 20, unit: 'kisə' }).minimum).toBe('Min. 20 kisə');
    expect(productPresentation(product).minimum).toBe('Minimum sifariş soruşun');
    expect(productPresentation({ ...product, stockStatus: 'OUT_OF_STOCK' }).stock).toBe('Bitib');
  });
});
