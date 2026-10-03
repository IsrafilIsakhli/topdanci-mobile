import { describe, expect, it } from 'vitest';
import { categoryBranchIds, categoryChildren, categoryRoots, categoryTrail, homeCategoryRoots, searchCategories } from '../src/features/home/category-tree';
import { demoCatalogResponse } from '../src/features/catalog/demo-api';
import { demoCategories, demoProducts } from '../src/features/catalog/demo-data';
import type { Category, Product } from '../src/api/types';

describe('mobil kateqoriya ağacı', () => {
  it('saytdakı 13 əsas kateqoriyanı və çoxsəviyyəli seçimləri saxlayır', () => {
    expect(categoryRoots(demoCategories)).toHaveLength(13);
    const adapters = demoCategories.find((item) => item.slug === 'adapter-ve-kabeller')!;
    expect(categoryTrail(demoCategories, adapters).map((item) => item.slug))
      .toEqual(['elektronika-ve-aksesuarlar', 'telefon-ve-aksesuarlar', 'adapter-ve-kabeller']);
    const ids = new Set(demoCategories.map((item) => item.id));
    expect(ids.size).toBe(demoCategories.length);
    expect(demoCategories.every((item) => !item.parentId || ids.has(item.parentId))).toBe(true);
  });

  it('əsas, orta və alt kateqoriyanı seçəndə uyğun məhsulu göstərir', () => {
    for (const slug of ['elektronika-ve-aksesuarlar', 'telefon-ve-aksesuarlar', 'adapter-ve-kabeller']) {
      const products = demoCatalogResponse<Product[]>('/products', { category: slug })!.data;
      expect(products.some((item) => item.slug === 'usb-c-adapterler-topdan')).toBe(true);
      expect(products.every((item) => item.store?.slug === 'techwholesale-az')).toBe(true);
    }
    expect(demoCatalogResponse<Product[]>('/products', { category: 'adapter-ve-kabeller' })!.data).toHaveLength(1);
    expect(demoCatalogResponse<Product[]>('/products', { category: 'monitorlar' })!.data).toHaveLength(0);
  });

  it('ana kateqoriyanın sayını alt kateqoriyalardan hesablayır', () => {
    const categories = demoCatalogResponse<Category[]>('/categories')!.data;
    const tech = categories.find((item) => item.slug === 'elektronika-ve-aksesuarlar')!;
    expect(tech.productCount).toBe(3);
    expect(demoProducts.every((product) => product.category && categoryTrail(demoCategories, product.category).length === 3)).toBe(true);
    expect(categoryChildren(categories, tech.id).length).toBeGreaterThan(1);
  });

  it('Azərbaycan dilində axtarır və səhv dövrlərdə sonsuz gəzmə yaratmır', () => {
    expect(searchCategories(demoCategories, '  QABLA  ').some((item) => item.slug === 'telefon-qablari')).toBe(true);
    expect(searchCategories(demoCategories, 'mövcudolmayan')).toHaveLength(0);
    const cycle: Category[] = [{ id: 'a', slug: 'a', name: 'A', parentId: 'b' },
      { id: 'b', slug: 'b', name: 'B', parentId: 'a' }];
    expect([...categoryBranchIds(cycle, 'a')]).toEqual(['a', 'b']);
    expect(categoryTrail(cycle, cycle[0])).toHaveLength(2);
  });

  it('Azərbaycan hərflərini yazmadan və üst kateqoriya ilə birlikdə alt bölməni tapır', () => {
    expect(searchCategories(demoCategories, '  telefon qablari  ').map((item) => item.slug)).toContain('telefon-qablari');
    expect(searchCategories(demoCategories, 'ELEKTRONIKA adapter').map((item) => item.slug)).toEqual(['adapter-ve-kabeller']);
    expect(searchCategories(demoCategories, '   ')).toHaveLength(0);
  });

  it('seçilmiş sahədə axtarış digər sahələrin nəticələrini göstərmir', () => {
    const electronics = demoCategories.find((item) => item.slug === 'elektronika-ve-aksesuarlar')!;
    expect(searchCategories(demoCategories, 'adapter', electronics.id).map((item) => item.slug)).toEqual(['adapter-ve-kabeller']);
    expect(searchCategories(demoCategories, 'qida', electronics.id)).toHaveLength(0);
    const branch = categoryBranchIds(demoCategories, electronics.id);
    expect(searchCategories(demoCategories, 'elektronika', electronics.id).every((item) => branch.has(item.id) && item.id !== electronics.id)).toBe(true);
  });

  it('ana səhifədə yalnız mövcud əsas sahələri göstərir və natamam API-də boş seçim yaratmır', () => {
    expect(homeCategoryRoots(demoCategories).map((item) => item.slug)).toEqual([
      'geyim-ayaqqabi-ve-tekstil', 'elektronika-ve-aksesuarlar', 'qida-ve-icki', 'tikinti-ve-temir', 'ev-bag-ve-mebel',
    ]);
    const partial: Category[] = [{ id: 'food', name: 'Qida', slug: 'qida-ve-icki' },
      { id: 'other', name: 'Başqa sahə', slug: 'basqa' },
      { id: 'child', name: 'Alt bölmə', slug: 'alt', parentId: 'food' }];
    expect(homeCategoryRoots(partial).map((item) => item.id)).toEqual(['food', 'other']);
    expect(homeCategoryRoots([])).toEqual([]);
  });

  it('ana səhifədə sıfır məhsullu sahəni gizlədir, say məlum olmayanda sahəni saxlayır', () => {
    const categories: Category[] = [
      { id: 'clothes', name: 'Geyim', slug: 'geyim-ayaqqabi-ve-tekstil', productCount: 3 },
      { id: 'empty', name: 'Ev və bağ', slug: 'ev-bag-ve-mebel', productCount: 0 },
      { id: 'unknown', name: 'Biznes', slug: 'biznes-ve-magaza-avadanligi' },
      { id: 'leaf', name: 'Köynəklər', slug: 'koynekler', parentId: 'clothes', productCount: 1 },
    ];
    expect(homeCategoryRoots(categories).map((item) => item.id)).toEqual(['clothes', 'unknown']);
    expect(categoryRoots(categories).map((item) => item.id)).toContain('empty');
  });
});
