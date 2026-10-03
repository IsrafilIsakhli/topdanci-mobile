import type { Category } from '../../api/types';

export const normalizeCategory = (value: string) => value.trim().toLocaleLowerCase('az')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/ə/g, 'e');

export function categoryRoots(categories: Category[]): Category[] {
  const ids = new Set(categories.map((item) => item.id));
  return categories.filter((item) => !item.parentId || !ids.has(item.parentId));
}

export function categoryChildren(categories: Category[], id: string): Category[] {
  return categories.filter((item) => item.parentId === id && item.id !== id);
}

export function categoryBranchIds(categories: Category[], id: string): Set<string> {
  const found = new Set<string>();
  function visit(current: string) {
    if (found.has(current)) return;
    found.add(current);
    categoryChildren(categories, current).forEach((child) => visit(child.id));
  }
  visit(id);
  return found;
}

export function categoryTrail(categories: Category[], item: Category): Category[] {
  const trail: Category[] = [];
  const visited = new Set<string>();
  let current: Category | undefined = item;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    trail.unshift(current);
    current = categories.find((parent) => parent.id === current?.parentId);
  }
  return trail;
}

export function searchCategories(categories: Category[], value: string, withinId?: string): Category[] {
  const words = normalizeCategory(value).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const branch = withinId ? categoryBranchIds(categories, withinId) : undefined;
  return categories.filter((item) => {
    if (branch && (!branch.has(item.id) || item.id === withinId)) return false;
    const path = normalizeCategory(categoryTrail(categories, item).map((parent) => parent.name).join(' '));
    return words.every((word) => path.includes(word));
  });
}

export function homeCategoryRoots(categories: Category[]): Category[] {
  const preferred = ['geyim-ayaqqabi-ve-tekstil', 'elektronika-ve-aksesuarlar', 'qida-ve-icki',
    'tikinti-ve-temir', 'ev-bag-ve-mebel'];
  const rank = (slug: string) => {
    const index = preferred.indexOf(slug);
    return index < 0 ? preferred.length : index;
  };
  return categoryRoots(categories).filter((category) => category.productCount !== 0)
    .sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, 5);
}
