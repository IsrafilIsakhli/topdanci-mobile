import { valueLabel } from '../../lib/labels';
import { dateLabel } from '../management/format';
export const sections = {
  applications: { title: 'Mağaza müraciətləri', path: '/admin/store-applications' },
  products: { title: 'Məhsul yoxlaması', path: '/admin/products' },
  stores: { title: 'Mağazalar', path: '/admin/stores' },
  users: { title: 'İstifadəçilər', path: '/admin/users', superOnly: true },
  categories: { title: 'Kateqoriyalar', path: '/admin/categories/tree', superOnly: true },
  reports: { title: 'Şikayətlər', path: '/admin/reports' },
  analytics: { title: 'Statistika', path: '/admin/analytics' },
  audit: { title: 'Audit qeydləri', path: '/admin/audit-logs', superOnly: true },
  system: { title: 'Sistem vəziyyəti', path: '/admin/system', superOnly: true },
} as const;
export type Section = keyof typeof sections;
export function isSection(value: string): value is Section { return Object.hasOwn(sections, value); }
export function needsSuper(section: Section) { return 'superOnly' in sections[section]; }
export function flattenCategories(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return items.flatMap((item) => [item, ...flattenCategories(Array.isArray(item.children) ? item.children as Record<string, unknown>[] : [])]);
}
export function recordTitle(item: Record<string, unknown>) {
  return String(item.title ?? item.name ?? item.companyName ?? item.email ?? item.action ?? item.type ?? item.id ?? 'Qeyd');
}
export function recordSubtitle(item: Record<string, unknown>) {
  const store = item.store && typeof item.store === 'object' ? (item.store as Record<string, unknown>).name : null;
  return [item.status, store, item.city, item.role].filter((value) => typeof value === 'string').map(valueLabel)
    .concat(item.createdAt ? [dateLabel(item.createdAt)] : []).join(' · ');
}
