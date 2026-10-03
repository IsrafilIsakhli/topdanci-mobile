import type { Product, Store } from '../../api/types';
import { addRecent, addSearch, emptyLibrary, parseLibrary, productSnapshot, storeSnapshot, type LibraryState } from './library-state';
export function createLibrary(storage: { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> }, key: string) {
  let state = emptyLibrary(); let loading: Promise<void> | undefined; let writes = Promise.resolve();
  const listeners = new Set<() => void>(); const notify = () => listeners.forEach((fn) => fn());
  const hydrate = () => loading ??= storage.getItem(key).then((raw) => { state = parseLibrary(raw); notify(); })
    .catch(() => { state = { ...state, ready: true, error: 'Cihaz yaddaşı açılmadı. Yenidən yoxlayın.' }; notify(); });
  const update = async (change: (current: LibraryState) => LibraryState) => {
    await hydrate(); state = { ...change(state), ready: true, error: '' }; notify(); const raw = JSON.stringify(state);
    writes = writes.catch(() => undefined).then(() => storage.setItem(key, raw)).catch(() => { state = { ...state, error: 'Dəyişiklik cihazda saxlanmadı. Yenidən cəhd edin.' }; notify(); });
    await writes;
  };
  return { hydrate, snapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    toggleProduct: (product: Product) => update((s) => { const item = productSnapshot(product); return !item ? s : { ...s, products: s.products.some((p) => p.id === item.id) ? s.products.filter((p) => p.id !== item.id) : [item, ...s.products].slice(0, 100) }; }),
    toggleStore: (store: Store) => update((s) => { const item = storeSnapshot(store); return !item ? s : { ...s, stores: s.stores.some((p) => p.id === item.id) ? s.stores.filter((p) => p.id !== item.id) : [item, ...s.stores].slice(0, 100) }; }),
    viewProduct: (product: Product) => update((s) => { const item = productSnapshot(product); return item ? { ...s, recent: addRecent(s.recent, { kind: 'product', item, at: Date.now() }) } : s; }),
    viewStore: (store: Store) => update((s) => { const item = storeSnapshot(store); return item ? { ...s, recent: addRecent(s.recent, { kind: 'store', item, at: Date.now() }) } : s; }),
    search: (value: string) => update((s) => ({ ...s, searches: addSearch(s.searches, value) })),
    removeSearch: (value: string) => update((s) => ({ ...s, searches: s.searches.filter((item) => item !== value) })),
    clearRecent: () => update((s) => ({ ...s, recent: [] })),
    rememberStores: (value: Pick<LibraryState, 'storeFilters' | 'storeSort'>) => update((s) => ({ ...s, ...value })),
    remember: (value: Pick<LibraryState, 'filters' | 'sort' | 'layout'>) => update((s) => ({ ...s, ...value })),
  };
}
