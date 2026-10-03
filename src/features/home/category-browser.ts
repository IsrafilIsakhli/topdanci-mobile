import type { Category } from '../../api/types';
import { categoryBranchIds, categoryChildren, categoryTrail, searchCategories } from './category-tree';

/**
 * Kateqoriya seçim panelinin (sector rail + alt ağac panesı) məntiqi.
 * Komponentdən ayrı saxlanılır ki, davranışı testlərlə yoxlamaq mümkün olsun.
 */

/** Çox uşaqlı qruplar standart vəziyyətdə yığılır ki, panel həddən artıq uzun olmasın. */
export const GROUP_CHILD_LIMIT = 8;
/** Rekursiyanın təhlükəsizlik həddi — qəribə məlumatda sonsuz render olmasın. */
export const MAX_LEVEL = 5;

export type CategoryGroup = { parent: Category; children: Category[] };
export type CategoryHit = { category: Category; trail: Category[]; children: number };

/** Verilmiş kateqoriyanın ən yuxarı (kök) sahəsini tapır. */
export function categoryRoot(categories: Category[], id?: string): Category | undefined {
  if (!id) return undefined;
  const item = categories.find((category) => category.id === id);
  return item ? categoryTrail(categories, item)[0] : undefined;
}

/** Alt ağacın bütün nəsilləri (dövrlərdən qorunur). */
export function categoryDescendants(categories: Category[], id: string): Category[] {
  const branch = categoryBranchIds(categories, id);
  return categories.filter((category) => branch.has(category.id) && category.id !== id);
}

/** Panelin sağ hissəsi: 2-ci səviyyə qrupları və onların uşaqları. */
export function categoryGroupsOf(categories: Category[], rootId: string): CategoryGroup[] {
  return categoryChildren(categories, rootId)
    .map((parent) => ({ parent, children: categoryChildren(categories, parent.id) }));
}

/** Standart vəziyyətdə yığılmış (bağlı) qrupların açarları. */
export function defaultCollapsedGroups(categories: Category[], rootId?: string): string[] {
  if (!rootId) return [];
  return categoryGroupsOf(categories, rootId)
    .filter((group) => group.children.length > GROUP_CHILD_LIMIT)
    .map((group) => group.parent.id);
}

/** Seçilmiş kateqoriya görünən olsun deyə açılmalı olan bütün üst qruplar. */
export function groupsToOpen(categories: Category[], id?: string): string[] {
  if (!id) return [];
  const item = categories.find((category) => category.id === id);
  if (!item) return [];
  return categoryTrail(categories, item).slice(0, -1).map((ancestor) => ancestor.id);
}

/**
 * Yeni sahə açılanda açıq olacaq qruplar: bütün qruplar açıq olur, yalnız
 * çox uşaqlı qruplar yığılır və seçilmiş kateqoriyanın üst qrupları həmişə açıqdır.
 */
export function defaultExpandedNodes(categories: Category[], rootId?: string, initialId?: string): string[] {
  if (!rootId) return [];
  const collapsed = new Set(defaultCollapsedGroups(categories, rootId));
  const open = categoryGroupsOf(categories, rootId).map((group) => group.parent.id)
    .filter((id) => !collapsed.has(id));
  return [...new Set([...open, ...groupsToOpen(categories, initialId)])];
}

/** Tile, qrup başlığı və çip üçün vahid alt yazı. */
export function categoryMeta(categories: Category[], category: Category): string {
  const children = categoryChildren(categories, category.id).length;
  if (children) return `${children} alt bölmə`;
  if (category.productCount == null) return 'Məhsullara bax';
  return category.productCount ? `${category.productCount} məhsul` : 'Məhsul yoxdur';
}

/** Axtarış nəticələri: hər nəticə üçün yol (breadcrumb) və alt bölmə sayı. */
export function categoryHits(categories: Category[], query: string, limit = 60): CategoryHit[] {
  return searchCategories(categories, query).slice(0, limit).map((category) => ({
    category,
    trail: categoryTrail(categories, category),
    children: categoryChildren(categories, category.id).length,
  }));
}
