import type { Product, Store } from '../../api/types';
import { addRecent, addSearch, emptyLibrary, parseLibrary, productSnapshot, storeSnapshot, type LibraryChange, type LibraryState } from './library-state';
let revision = Date.now();
export function changeFor(kind: LibraryChange['kind'], id: string, saved: boolean): LibraryChange { return { kind, id, saved, revision: ++revision }; }
export function enqueue(pending: LibraryChange[], change: LibraryChange) { return [...pending.filter(v => v.kind !== change.kind || v.id !== change.id), change]; }
export function reconcileLibrary(state: LibraryState, remote: { products: Product[]; stores: Store[] }, sent: LibraryChange[]): LibraryState {
 const pending = state.pending.filter(v => !sent.some(s => s.kind === v.kind && s.id === v.id && s.revision === v.revision));
 const products = remote.products.map(productSnapshot).filter((v): v is Product => !!v), stores = remote.stores.map(storeSnapshot).filter((v): v is Store => !!v);
 const merge = <T extends { id: string }>(kind: LibraryChange['kind'], rows: T[], local: T[]) => {
  let result = rows;
  for (const change of pending.filter(v => v.kind === kind)) { result = result.filter(v => v.id !== change.id); const item = local.find(v => v.id === change.id); if (change.saved && item) result = [item,...result]; }
  return result.slice(0,100);
 };
 return { ...state, products: merge('product',products,state.products), stores: merge('store',stores,state.stores), pending, cloudInitialized: true, syncError: '', syncedAt: Date.now() };
}
export function createLibrary(storage: { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> }, key: string) {
 let state = emptyLibrary(); let loading: Promise<void> | undefined; let writes = Promise.resolve();
 const listeners = new Set<() => void>(); const notify = () => listeners.forEach(fn => fn());
 const hydrate = () => loading ??= storage.getItem(key).then(raw => { state = parseLibrary(raw); revision = Math.max(revision,...state.pending.map(v => v.revision)); notify(); })
  .catch(() => { state = { ...state, ready: true, error: 'Cihaz yaddaşı açılmadı. Yenidən yoxlayın.' }; notify(); });
 const update = async (change: (current: LibraryState) => LibraryState) => {
  await hydrate(); state = { ...change(state), ready: true, error: '' }; notify(); const raw = JSON.stringify(state);
  writes = writes.catch(() => undefined).then(() => storage.setItem(key,raw)).catch(() => { state = { ...state, error: 'Dəyişiklik cihazda saxlanmadı. Yenidən cəhd edin.' }; notify(); });
  await writes;
 };
 function toggle<T extends Product | Store>(kind: LibraryChange['kind'], item: T) {
  return update(s => {
   const rows = kind === 'product' ? s.products : s.stores, saved = !rows.some(v => v.id === item.id);
   let pending = enqueue(s.pending,changeFor(kind,item.id,saved));
   if (saved && rows.length >= 100) pending = enqueue(pending,changeFor(kind,rows[rows.length-1].id,false));
   const next = saved ? [item,...rows].slice(0,100) : rows.filter(v => v.id !== item.id);
   return { ...s, [kind === 'product' ? 'products' : 'stores']: next, pending };
  });
 }
 return { hydrate, snapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
  toggleProduct: (product: Product) => { const item = productSnapshot(product); return item ? toggle('product',item) : Promise.resolve(); },
  toggleStore: (store: Store) => { const item = storeSnapshot(store); return item ? toggle('store',item) : Promise.resolve(); },
  importGuest: (guest: LibraryState) => update(s => {
   const products = [...guest.products,...s.products.filter(v => !guest.products.some(p => p.id === v.id))].slice(0,100);
   const stores = [...guest.stores,...s.stores.filter(v => !guest.stores.some(p => p.id === v.id))].slice(0,100);
   let pending = s.pending;
   for (const item of products) if (guest.products.some(v => v.id === item.id) && !pending.some(v => v.kind === 'product' && v.id === item.id)) pending = enqueue(pending,changeFor('product',item.id,true));
   for (const item of stores) if (guest.stores.some(v => v.id === item.id) && !pending.some(v => v.kind === 'store' && v.id === item.id)) pending = enqueue(pending,changeFor('store',item.id,true));
   return { ...s, products, stores, pending };
  }),
  consumeGuest: () => update(s => ({ ...s, products: [], stores: [], pending: [] })),
  prepareSync: async () => { await update(s => {
   if (s.cloudInitialized) return s; let pending = s.pending;
   for (const p of s.products) if (!pending.some(v => v.kind === 'product' && v.id === p.id)) pending = enqueue(pending,changeFor('product',p.id,true));
   for (const p of s.stores) if (!pending.some(v => v.kind === 'store' && v.id === p.id)) pending = enqueue(pending,changeFor('store',p.id,true));
   return { ...s,pending };
  }); return [...state.pending].slice(0,200); },
  acceptRemote: (remote: { products: Product[]; stores: Store[] }, sent: LibraryChange[]) => update(s => reconcileLibrary(s,remote,sent)),
  syncFailed: (message: string) => { state = { ...state,syncError: message }; notify(); },
  viewProduct: (product: Product) => update(s => { const item = productSnapshot(product); return item ? { ...s, recent: addRecent(s.recent,{ kind:'product',item,at:Date.now() }) } : s; }),
  viewStore: (store: Store) => update(s => { const item = storeSnapshot(store); return item ? { ...s,recent:addRecent(s.recent,{kind:'store',item,at:Date.now()}) } : s; }),
  search: (value: string) => update(s => ({ ...s,searches:addSearch(s.searches,value) })),
  removeSearch: (value: string) => update(s => ({ ...s,searches:s.searches.filter(item => item !== value) })),
  clearRecent: () => update(s => ({ ...s,recent:[] })),
  rememberStores: (value: Pick<LibraryState,'storeFilters'|'storeSort'>) => update(s => ({ ...s,...value })),
  remember: (value: Pick<LibraryState,'filters'|'sort'|'layout'>) => update(s => ({ ...s,...value })),
 };
}