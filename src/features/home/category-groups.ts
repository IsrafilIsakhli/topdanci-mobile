import type { Category } from '../../api/types';

export type CategoryGroup = { parent: Category; children: Category[] };

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('az');
}

export function categoryGroups(categories: Category[], search: string): CategoryGroup[] {
  const ids = new Set(categories.map((category) => category.id));
  const roots = categories.filter((category) => !category.parentId || !ids.has(category.parentId));
  const query = normalized(search);

  function descendants(parentId: string, seen: Set<string>): Category[] {
    return categories.flatMap((category) => {
      if (category.parentId !== parentId || seen.has(category.id)) return [];
      const nextSeen = new Set(seen).add(category.id);
      return [category, ...descendants(category.id, nextSeen)];
    });
  }

  return roots.flatMap((parent) => {
    const children = descendants(parent.id, new Set([parent.id]));
    if (!query || normalized(parent.name).includes(query)) return [{ parent, children }];
    const matches = children.filter((child) => normalized(child.name).includes(query));
    return matches.length ? [{ parent, children: matches }] : [];
  });
}
