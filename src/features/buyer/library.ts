import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { getAuthSnapshot, subscribeAuth } from '../../api/auth-store';
import { DEMO_CATALOG } from '../../api/config';
import { createLibrary } from './library-store';
const stores = new Map<string, ReturnType<typeof createLibrary>>();
export function useLibrary() {
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const scope = (DEMO_CATALOG ? 'demo' : 'live') + ':' + (user?.id ?? 'guest');
  let store = stores.get(scope);
  if (!store) { store = createLibrary(AsyncStorage, 'topdanbazar.library.v1:' + scope); stores.set(scope, store); }
  useEffect(() => { void store.hydrate(); }, [store]);
  const state = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  return { state, actions: store, scope };
}
