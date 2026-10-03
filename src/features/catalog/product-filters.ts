import type { ApiEnvelope, Product } from '../../api/types';

export const sortOptions = [
  { value: 'newest', label: 'Ən yenilər', detail: 'Son əlavə olunan məhsullar' },
  { value: 'popular', label: 'Populyar', detail: 'Ən çox maraq göstərilən məhsullar' },
  { value: 'price_asc', label: 'Ucuzdan bahaya', detail: 'Qiyməti göstərilənlər əvvəl' },
  { value: 'price_desc', label: 'Bahadan ucuza', detail: 'Qiyməti göstərilənlər əvvəl' },
] as const;
export type ProductSort = typeof sortOptions[number]['value'];
export const stockOptions = [
  { value: '', label: 'Hamısı' }, { value: 'IN_STOCK', label: 'Stokda' },
  { value: 'LIMITED', label: 'Az qalıb' }, { value: 'OUT_OF_STOCK', label: 'Bitib' },
] as const;
export type ProductFilters = {
  category: string; city: string; stock: string; verified: boolean;
  priceMin: string; priceMax: string; minOrderMax: string; store: string;
};
export const emptyFilters: ProductFilters = {
  category: '', city: '', stock: '', verified: false, priceMin: '', priceMax: '', minOrderMax: '', store: '',
};

export function amount(value: string): number | undefined {
  const text = value.trim().replace(',', '.');
  return text ? Number(text) : undefined;
}
export function validateFilters(filters: ProductFilters): string | undefined {
  for (const field of ['priceMin', 'priceMax', 'minOrderMax'] as const) {
    const value = amount(filters[field]);
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || !/^\d+(?:[.,]\d+)?$/.test(filters[field].trim()))) {
      return field === 'minOrderMax' ? 'Minimum sifariş üçün düzgün miqdar yazın.' : 'Qiyməti sıfır və ya müsbət rəqəmlə yazın.';
    }
  }
  if (amount(filters.priceMin) !== undefined && amount(filters.priceMax) !== undefined &&
    amount(filters.priceMin)! > amount(filters.priceMax)!) return 'Maksimum qiymət minimumdan az ola bilməz.';
}
export function filterCount(filters: ProductFilters): number {
  return Number(!!filters.category) + Number(!!filters.city) + Number(!!filters.stock) + Number(filters.verified) +
    Number(!!(filters.priceMin || filters.priceMax)) + Number(!!filters.minOrderMax) + Number(!!filters.store);
}
export function productParams(q: string, filters: ProductFilters, sort: ProductSort) {
  return { q: q.trim().slice(0, 120), category: filters.category, city: filters.city.trim(), stock: filters.stock,
    verified: filters.verified || undefined, store: filters.store,
    priceMin: amount(filters.priceMin), priceMax: amount(filters.priceMax), minOrderMax: amount(filters.minOrderMax), sort };
}
export function uniqueProducts(pages: ApiEnvelope<Product[]>[]): Product[] {
  const seen = new Set<string>();
  return pages.flatMap((page) => page.data).filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id); return true;
  });
}
export function routeText(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}
