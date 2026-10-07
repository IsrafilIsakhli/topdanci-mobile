import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { getAuthSnapshot, subscribeAuth } from '../../api/auth-store';
import { api } from '../../api/client';
import type { Product, Store } from '../../api/types';
import { DEMO_CATALOG } from '../../api/config';
import { useConnected } from '../network/connectivity';
import { createLibrary } from './library-store';
import { migrateGuestRequests } from './requests';
const stores = new Map<string, ReturnType<typeof createLibrary>>();
function library(scope: string) {
 let store = stores.get(scope);
 if (!store) { store = createLibrary(AsyncStorage,'topdanbazar.library.v1:' + scope); stores.set(scope,store); }
 return store;
}
export function useLibrary() {
 const user = useSyncExternalStore(subscribeAuth,getAuthSnapshot,getAuthSnapshot);
 const scope = (DEMO_CATALOG ? 'demo' : 'live') + ':' + (user?.id ?? 'guest'), store = library(scope);
 useEffect(() => { void store.hydrate(); },[store]);
 const state = useSyncExternalStore(store.subscribe,store.snapshot,store.snapshot);
 return { state,actions:store,scope };
}
const flights = new Map<string,Promise<void>>();
export function LibraryBridge() {
 const user = useSyncExternalStore(subscribeAuth,getAuthSnapshot,getAuthSnapshot), connected = useConnected();
 useEffect(() => {
  if (!user) return;
  const scope = (DEMO_CATALOG ? 'demo' : 'live') + ':' + user.id, store = library(scope), guest = library((DEMO_CATALOG ? 'demo' : 'live') + ':guest');
  let disposed = false, timer: ReturnType<typeof setTimeout> | undefined;
  const valid = () => !disposed && getAuthSnapshot()?.id === user.id;
  const run = () => {
   if (!valid() || flights.has(scope)) return;
   const task = (async () => {
    await Promise.all([store.hydrate(),guest.hydrate()]);
    if (!valid()) return;
    if (guest.snapshot().products.length || guest.snapshot().stores.length) {
     await store.importGuest(guest.snapshot()); if (store.snapshot().error) throw Error(store.snapshot().error);
     await guest.consumeGuest();
    }
    if (!valid()) return;
    await migrateGuestRequests();
    if (DEMO_CATALOG || !connected) return;
    const changes = await store.prepareSync(); if (!valid()) return;
    const remote = changes.length ? await api.patch<{ products:Product[];stores:Store[] }>('/library',{changes:changes.map(({kind,id,saved})=>({kind,id,saved}))})
      : await api.get<{ products:Product[];stores:Store[] }>('/library');
    if (valid()) await store.acceptRemote(remote.data,changes);
   })().catch(e => { if (valid()) store.syncFailed(e instanceof Error ? e.message : 'Seçimlər hesaba köçürülmədi.'); })
    .finally(() => { flights.delete(scope); if (valid() && connected && store.snapshot().pending.length && !store.snapshot().syncError) schedule(); });
   flights.set(scope,task);
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(run,800); };
  const stop = store.subscribe(() => { if (store.snapshot().pending.length && !flights.has(scope)) schedule(); });
  run();
  const foreground = AppState.addEventListener('change',state => { if (state === 'active') run(); });
  const interval = setInterval(run,60000);
  return () => { disposed = true; stop(); foreground.remove(); clearTimeout(timer); clearInterval(interval); };
 },[user,connected]); return null;
}