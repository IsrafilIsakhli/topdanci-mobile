import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { getAuthSnapshot, login, logout, logoutEverywhere, refreshAccess, restoreAuth, subscribeAuth } from '../../api/auth-store';
import { DEMO_CATALOG } from '../../api/config';

let restored = false;
let restoring: Promise<void> | null = null;
export function useSession() {
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const [loading, setLoading] = useState(!restored);
  useEffect(() => {
    if (!restoring && !restored) restoring = restoreAuth().finally(() => { restored = true; });
    if (restoring) void restoring.finally(() => setLoading(false));
    const listener = AppState.addEventListener('change', (state) => {
      if (!DEMO_CATALOG && state === 'active' && !getAuthSnapshot()) void refreshAccess();
    });
    return () => listener.remove();
  }, []);
  return { user, loading, login, logout, logoutEverywhere, retrySession: refreshAccess };
}
