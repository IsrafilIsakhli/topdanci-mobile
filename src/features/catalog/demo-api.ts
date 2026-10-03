import type { ApiEnvelope, Product, Store } from '../../api/types';
import { demoCategories, demoProducts, demoStores } from './demo-data';
import { categoryBranchIds } from '../home/category-tree';

type Params = Record<string, string | number | boolean | null | undefined> | undefined;

function normalized(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('az');
}

function page<T>(items: T[], params: Params): ApiEnvelope<T[]> {
  const parsedCursor = Number(params?.cursor ?? 0);
  const start = Number.isFinite(parsedCursor) && parsedCursor > 0 ? Math.floor(parsedCursor) : 0;
  const parsedLimit = Number(params?.limit ?? 20);
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(50, Math.floor(parsedLimit))) : 20;
  return {
    data: items.slice(start, start + limit),
    meta: { total: items.length, nextCursor: start + limit < items.length ? String(start + limit) : null },
  };
}

function products(params: Params): ApiEnvelope<Product[]> {
  const q = normalized(params?.q);
  const city = normalized(params?.city);
  const category = normalized(params?.category);
  const selectedCategory = demoCategories.find((item) => normalized(item.slug) === category);
  const branch = selectedCategory ? categoryBranchIds(demoCategories, selectedCategory.id) : new Set<string>();
  const store = normalized(params?.store);
  const stock = normalized(params?.stock);
  const maxPrice = params?.priceMax == null || params.priceMax === '' ? null : Number(params.priceMax);
  const minPrice = params?.priceMin == null || params.priceMin === '' ? null : Number(params.priceMin);
  const maxOrder = params?.minOrderMax == null || params.minOrderMax === '' ? null : Number(params.minOrderMax);
  let items = demoProducts.filter((product) =>
    (!q || [product.title, product.description, product.store?.name].some((value) => normalized(value).includes(q))) &&
    (!city || normalized(product.store?.city) === city) &&
    (!category || (product.category && branch.has(product.category.id))) &&
    (!store || normalized(product.store?.slug) === store) &&
    (!stock || normalized(product.stockStatus) === stock) &&
    (params?.verified !== true && params?.verified !== 'true' || product.store?.verified === true) &&
    (maxPrice === null || (Number.isFinite(maxPrice) && product.price != null && Number(product.price) <= maxPrice)) &&
    (minPrice === null || (Number.isFinite(minPrice) && product.price != null && Number(product.price) >= minPrice)) &&
    (maxOrder === null || (Number.isFinite(maxOrder) && product.minOrderQuantity != null && Number(product.minOrderQuantity) <= maxOrder))
  );
  if (params?.sort === 'price_asc' || params?.sort === 'price_desc') {
    items = [...items].sort((a, b) => {
      if (a.price == null && b.price == null) return b.id.localeCompare(a.id);
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      const first = Number(a.price);
      const second = Number(b.price);
      if (first === second) return b.id.localeCompare(a.id);
      return params.sort === 'price_asc' ? first - second : second - first;
    });
  } else if (params?.sort === 'popular') {
    items = [...items].reverse();
  }
  return page(items, params);
}

function stores(params: Params): ApiEnvelope<Store[]> {
  const q = normalized(params?.q);
  const city = normalized(params?.city);
  const category = normalized(params?.category);
  let items = demoStores.filter((store) =>
    (!q || [store.name, store.description].some((value) => normalized(value).includes(q))) &&
    (!city || normalized(store.city) === city) &&
    (!category || normalized(store.category?.slug) === category)
  );
  if (params?.sort === 'products') items = [...items].sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));
  if (params?.sort === 'popular') items = [...items].reverse();
  return page(items, params);
}

export function demoCatalogResponse<T>(path: string, params?: Params): ApiEnvelope<T> | null {
  if (path === '/products') return products(params) as ApiEnvelope<T>;
  if (path === '/stores') return stores(params) as ApiEnvelope<T>;
  if (path === '/categories') return {
    data: demoCategories.map((category) => ({ ...category,
      productCount: demoProducts.filter((product) => product.category &&
        categoryBranchIds(demoCategories, category.id).has(product.category.id)).length,
    })) as T,
  };
  if (path === '/search') {
    const q = normalized(params?.q);
    return { data: { products: q.length >= 2 ? demoProducts.filter(p => [p.title,p.store?.name,p.category?.name].some(v=>normalized(v).includes(q))).slice(0,10) : [], stores: q.length >= 2 ? demoStores.filter(s => normalized(s.name).includes(q)).slice(0,8) : [], categories: q.length >= 2 ? demoCategories.filter(v=>normalized(v.name).includes(q)).slice(0,8) : [] } as T };
  }
  if (path === '/search/suggestions') {
    const q = normalized(params?.q);
    const suggestions = q ? [...new Set([...demoProducts.map((product) => product.title),
      ...demoStores.map((store) => store.name), ...demoCategories.map((category) => category.name)])]
      .filter((value) => normalized(value).includes(q)).slice(0, 10) : [];
    return { data: suggestions as T };
  }
  if (path.startsWith('/products/')) {
    const item = demoProducts.find((product) => product.slug === decodeURIComponent(path.slice('/products/'.length)));
    if (!item) throw new Error('Məhsul tapılmadı.');
    return { data: item as T };
  }
  if (path.startsWith('/stores/')) {
    const item = demoStores.find((store) => store.slug === decodeURIComponent(path.slice('/stores/'.length)));
    if (!item) throw new Error('Mağaza tapılmadı.');
    return { data: item as T };
  }
  return null;
}
