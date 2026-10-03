import { describe, expect, it } from 'vitest';
import { categoryProductsPath, productSearchPath } from '../src/features/catalog/navigation';

describe('home navigation', () => {
  it('opens every product for an empty search', () => {
    expect(productSearchPath('  ')).toBe('/products');
  });

  it('passes an encoded search phrase to the products page', () => {
    expect(productSearchPath('  yağ & un  ')).toBe('/products?q=ya%C4%9F%20%26%20un');
  });

  it('opens products filtered to the selected category', () => {
    expect(categoryProductsPath('qida-və-içki')).toBe('/products?category=qida-v%C9%99-i%C3%A7ki');
  });
});
