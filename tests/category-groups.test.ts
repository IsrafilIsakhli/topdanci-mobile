import { describe, expect, it } from 'vitest';
import type { Category } from '../src/api/types';
import { categoryGroups } from '../src/features/home/category-groups';

const categories: Category[] = [
  { id: 'clothes', slug: 'geyim', name: 'Geyim' },
  { id: 'coats', parentId: 'clothes', slug: 'godekce', name: 'Gödəkçələr' },
  { id: 'winter', parentId: 'coats', slug: 'qis', name: 'Qış gödəkçələri' },
  { id: 'food', slug: 'qida', name: 'Qida' },
];

describe('category picker groups', () => {
  it('shows root categories and their nested selections', () => {
    expect(categoryGroups(categories, '').map(({ parent, children }) => [parent.slug, ...children.map((item) => item.slug)]))
      .toEqual([['geyim', 'godekce', 'qis'], ['qida']]);
  });

  it('finds a nested Azerbaijani category without hiding its parent', () => {
    expect(categoryGroups(categories, 'QIŞ').map(({ parent, children }) => [parent.slug, ...children.map((item) => item.slug)]))
      .toEqual([['geyim', 'qis']]);
  });
});
