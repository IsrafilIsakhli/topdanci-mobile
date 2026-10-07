import { describe,it,expect } from 'vitest';
import { catalogLinkRoute,sharedCatalogUrl } from '../src/features/catalog/share-links';
describe('Kataloq paylaşımı',()=>{
 it('saytın məhsul və mağaza səhifələrinə kodlanmış link yaradır',()=>{const link=sharedCatalogUrl('product','köynək');expect(link).toContain('/products/k%C3%B6yn%C9%99k');expect(catalogLinkRoute(link)).toBe('/product/k%C3%B6yn%C9%99k');expect(catalogLinkRoute(sharedCatalogUrl('store','baku'))).toBe('/store/baku');});
 it('xarici və səhv linkləri ana səhifəyə yönəldir',()=>{expect(catalogLinkRoute('https://evil.test/products/x')).toBe('/home');expect(catalogLinkRoute('javascript:alert(1)')).toBe('/home');});
});
