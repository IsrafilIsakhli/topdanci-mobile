import type { StoreFilters, StoreSort } from '../catalog/store-directory';
import type { Product, Store } from '../../api/types';
import { emptyFilters, sortOptions, stockOptions, validateFilters, type ProductFilters, type ProductSort } from '../catalog/product-filters';
export type Viewed = { kind: 'product'; item: Product; at: number } | { kind: 'store'; item: Store; at: number };
export type LibraryState = { products: Product[]; stores: Store[]; recent: Viewed[]; searches: string[]; filters: ProductFilters; sort: ProductSort; storeFilters: StoreFilters; storeSort: StoreSort; layout: 'grid' | 'list'; ready: boolean; error: string };
export function emptyLibrary(): LibraryState { return { products: [], stores: [], recent: [], searches: [], filters: { ...emptyFilters }, sort: 'newest', storeFilters: { city: '', category: '' }, storeSort: 'newest', layout: 'grid', ready: false, error: '' }; }
const str = (value: unknown, max = 160) => typeof value === 'string' ? value.slice(0, max) : '';
export function storeSnapshot(value: unknown): Store | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Store;
  if (!str(item.id) || !str(item.slug) || !str(item.name)) return null;
  return { id: str(item.id), slug: str(item.slug), name: str(item.name), city: str(item.city, 80), verified: item.verified === true,
    logoUrl: str(item.logoUrl, 1200) || undefined, logoKey: str(item.logoKey, 400) || undefined,
    productCount: Number.isFinite(item.productCount) ? item.productCount : undefined,
    category: item.category?.id && item.category?.slug ? { id: str(item.category.id), slug: str(item.category.slug), name: str(item.category.name) } : undefined };
}
export function productSnapshot(value: unknown): Product | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Product;
  if (!str(item.id) || !str(item.slug) || !str(item.title)) return null;
  return { id: str(item.id), slug: str(item.slug), title: str(item.title), price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : str(item.price, 30) || undefined,
    priceType: str(item.priceType, 30), currency: str(item.currency, 10), unit: str(item.unit, 40),
    minOrderQuantity: typeof item.minOrderQuantity === 'number' && Number.isFinite(item.minOrderQuantity) ? item.minOrderQuantity : str(item.minOrderQuantity, 30), stockStatus: str(item.stockStatus, 30),
    imageUrl: str(item.imageUrl, 1200) || undefined, images: Array.isArray(item.images) ? item.images.slice(0, 4).map((image) => ({ id: str(image.id), cdnUrl: str(image.cdnUrl, 1200), storageKey: str(image.storageKey, 400), status: str(image.status, 30) })) : [],
    store: storeSnapshot(item.store) ?? undefined };
}
export function rememberedFilters(value: unknown): ProductFilters {
  const next = { ...emptyFilters };
  if (value && typeof value === 'object') for (const key of Object.keys(emptyFilters) as (keyof ProductFilters)[]) {
    const record = value as Record<string, unknown>;
    if (key === 'verified') next.verified = record.verified === true; else next[key] = str(record[key], 120);
  }
  if (!stockOptions.some((option) => option.value === next.stock)) next.stock = '';
  if (validateFilters(next)) { next.priceMin = ''; next.priceMax = ''; next.minOrderMax = ''; }
  return next;
}
export function parseLibrary(raw: string | null): LibraryState {
  const next = emptyLibrary(); next.ready = true;
  if (!raw) return next;
  try {
    const data = JSON.parse(raw);
    next.products = (Array.isArray(data.products) ? data.products : []).slice(0, 100).map(productSnapshot).filter((v: Product | null): v is Product => !!v);
    next.stores = (Array.isArray(data.stores) ? data.stores : []).slice(0, 100).map(storeSnapshot).filter((v: Store | null): v is Store => !!v);
    next.recent = (Array.isArray(data.recent) ? data.recent : []).slice(0, 30).flatMap((entry: Viewed) => {
      if (!entry || !Number.isFinite(entry.at)) return [];
      if (entry.kind === 'product') { const item = productSnapshot(entry.item); return item ? [{ kind: 'product' as const, item, at: entry.at }] : []; }
      if (entry.kind === 'store') { const item = storeSnapshot(entry.item); return item ? [{ kind: 'store' as const, item, at: entry.at }] : []; }
      return [];
    });
    next.searches = [...new Set((Array.isArray(data.searches) ? data.searches : []).map((v: unknown) => str(v, 120).trim()).filter(Boolean))].slice(0, 8) as string[];
    next.filters = rememberedFilters(data.filters);
    next.storeFilters = { city: str(data.storeFilters?.city, 80), category: str(data.storeFilters?.category, 120) };
    next.storeSort = ['newest','popular','products'].includes(data.storeSort) ? data.storeSort : 'newest';
    next.sort = sortOptions.some((item) => item.value === data.sort) ? data.sort : 'newest'; next.layout = data.layout === 'list' ? 'list' : 'grid';
  } catch { next.error = 'Yadda saxlanmış məlumat oxunmadı. Yenidən seçim edə bilərsiniz.'; }
  return next;
}
export function addSearch(searches: string[], value: string): string[] {
  const next = value.trim().slice(0, 120);
  return next ? [next, ...searches.filter((item) => item.toLocaleLowerCase('az') !== next.toLocaleLowerCase('az'))].slice(0, 8) : searches;
}
export function addRecent(recent: Viewed[], entry: Viewed): Viewed[] {
  return [entry, ...recent.filter((item) => item.kind !== entry.kind || item.item.id !== entry.item.id)].slice(0, 30);
}
