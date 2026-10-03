import { describe, expect, it } from 'vitest';
import type { Category } from '../src/api/types';
import { demoCategories } from '../src/features/catalog/demo-data';
import { GROUP_CHILD_LIMIT, categoryDescendants, categoryGroupsOf, categoryHits, categoryMeta,
  categoryRoot, defaultCollapsedGroups, defaultExpandedNodes, groupsToOpen } from '../src/features/home/category-browser';

const bigChildren: Category[] = Array.from({ length: GROUP_CHILD_LIMIT + 1 }, (_, index) => ({
  id: 'big-' + index, slug: 'big-' + index, name: 'Uşaq ' + index, parentId: 'big',
}));
const tree: Category[] = [
  { id: 'root', slug: 'root', name: 'Kök sahə' },
  { id: 'small', slug: 'small', name: 'Kiçik qrup', parentId: 'root' },
  { id: 'small-1', slug: 'small-1', name: 'Kiçik alt bölmə', parentId: 'small' },
  { id: 'big', slug: 'big', name: 'Böyük qrup', parentId: 'root' },
  ...bigChildren,
];

describe('kateqoriya brauzeri məntiqi', () => {
  it('alt kateqoriyadan kök sahəni tapır', () => {
    expect(categoryRoot(demoCategories, 'demo-category-adapter-ve-kabeller')?.slug).toBe('elektronika-ve-aksesuarlar');
    expect(categoryRoot(demoCategories, 'demo-category-erzaq-mehsullari')?.slug).toBe('qida-ve-icki');
    expect(categoryRoot(demoCategories, 'yoxdur')).toBeUndefined();
    expect(categoryRoot(demoCategories, undefined)).toBeUndefined();
  });

  it('sahənin bütün alt ağacını sayır və dövrlərdə ilişmir', () => {
    const food = demoCategories.find((item) => item.slug === 'qida-ve-icki')!;
    expect(categoryDescendants(demoCategories, food.id)).toHaveLength(19);
    expect(categoryDescendants(demoCategories, 'demo-category-erzaq-mehsullari')).toHaveLength(4);
    const cycle: Category[] = [{ id: 'a', slug: 'a', name: 'A', parentId: 'b' },
      { id: 'b', slug: 'b', name: 'B', parentId: 'a' }];
    expect(categoryDescendants(cycle, 'a')).toHaveLength(1);
  });

  it('panel üçün 2-ci səviyyə qruplarını və uşaqlarını verir', () => {
    const food = demoCategories.find((item) => item.slug === 'qida-ve-icki')!;
    expect(categoryGroupsOf(demoCategories, food.id).map((group) => [group.parent.slug, group.children.length]))
      .toEqual([['erzaq-mehsullari', 4], ['ickiler', 4], ['sirniyyat-ve-qelyanaltilar', 3], ['dondurulmus-mehsullar', 4]]);
    expect(categoryGroupsOf(demoCategories, 'demo-category-un-seker-ve-duz')).toEqual([]);
  });

  it('çox uşaqlı qrupu yığır, seçilmiş kateqoriyanın üst qruplarını açır', () => {
    expect(defaultCollapsedGroups(tree, 'root')).toEqual(['big']);
    expect(defaultCollapsedGroups(tree, undefined)).toEqual([]);
    expect(groupsToOpen(tree, 'big-3')).toEqual(['root', 'big']);
    expect(groupsToOpen(tree, 'small')).toEqual(['root']);
    expect(groupsToOpen(tree, 'yoxdur')).toEqual([]);
    expect(defaultExpandedNodes(tree, 'root')).toEqual(['small']);
    expect(defaultExpandedNodes(tree, 'root', 'big-3')).toEqual(['small', 'root', 'big']);
    expect(defaultExpandedNodes(tree, undefined, 'big-3')).toEqual([]);
  });

  it('hər səviyyə üçün düzgün alt yazı yaradır', () => {
    const food = demoCategories.find((item) => item.slug === 'qida-ve-icki')!;
    const leaf = demoCategories.find((item) => item.slug === 'un-seker-ve-duz')!;
    expect(categoryMeta(demoCategories, food)).toBe('4 alt bölmə');
    expect(categoryMeta(demoCategories, leaf)).toBe('Məhsullara bax');
    expect(categoryMeta(demoCategories, { ...leaf, productCount: 12 })).toBe('12 məhsul');
    expect(categoryMeta(demoCategories, { ...leaf, productCount: 0 })).toBe('Məhsul yoxdur');
  });

  it('axtarışda yolu göstərir, Azərbaycan hərflərini nəzərə alır və limiti saxlayır', () => {
    const hits = categoryHits(demoCategories, '  un seker  ');
    const hit = hits.find((item) => item.category.slug === 'un-seker-ve-duz');
    expect(hit).toBeDefined();
    expect(hit!.trail.map((item) => item.slug)).toEqual(['qida-ve-icki', 'erzaq-mehsullari', 'un-seker-ve-duz']);
    expect(hit!.children).toBe(0);
    expect(categoryHits(demoCategories, 'erzaq')[0]?.children).toBe(4);
    expect(categoryHits(demoCategories, 'mövcudolmayan')).toEqual([]);
    expect(categoryHits(demoCategories, 'a', 3)).toHaveLength(3);
  });
});
