import { flushPushLogout, pushTokenKey, queuePushLogout } from '../features/buyer/push-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, DEMO_CATALOG } from './config';
import type { ApiEnvelope, SessionUser } from './types';
import { authenticateDemo, demoUser, isDemoUser } from '../features/auth/demo-accounts';

const REFRESH_KEY = 'topdanbazar.refresh.v1';
const DEMO_KEY = 'topdanbazar.preview-user.v1';
let accessToken: string | null = null;
let currentUser: SessionUser | null = null;
let refreshPromise: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

type AuthTokens = {
  authenticated: true; user: SessionUser; accessToken: string; refreshToken: string; expiresIn: number;
};

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getAuthSnapshot() { return currentUser; }
export function getAccessToken() { return accessToken; }
function notify() { listeners.forEach((listener) => listener()); }

async function applyTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  accessToken = tokens.accessToken;
  currentUser = tokens.user;
  notify();
}
export async function clearAuth() {
  if (!DEMO_CATALOG) { await queuePushLogout(await SecureStore.getItemAsync(REFRESH_KEY)).catch(() => undefined); void flushPushLogout(); }
  accessToken = null;
  currentUser = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(DEMO_KEY);
  notify();
}
class AuthRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
async function authRequest(path: string, body: unknown): Promise<AuthTokens> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      credentials: 'omit', body: JSON.stringify(body), signal: controller.signal,
    });
  } catch {
    throw new AuthRequestError('Serverlə əlaqə yoxdur. İnterneti yoxlayın.', 0);
  } finally { clearTimeout(timeout); }
  const payload = await response.json().catch(() => null) as ApiEnvelope<AuthTokens> | null;
  if (!response.ok || !payload?.data?.accessToken) {
    throw new AuthRequestError(response.status === 401 ? 'Giriş məlumatları yanlışdır.'
      : response.status === 429 ? 'Çox cəhd edildi. Bir az sonra yenidən yoxlayın.'
      : 'Giriş sorğusu alınmadı.', response.status);
  }
  return payload.data;
}
export async function login(identifier: string, password: string) {
  if (DEMO_CATALOG) {
    const user = authenticateDemo(identifier, password);
    await SecureStore.setItemAsync(DEMO_KEY, user.id);
    accessToken = null; currentUser = user; notify();
    return;
  }
  const tokens = await authRequest('/auth/mobile/login', { identifier, password });
  await applyTokens(tokens);
}
export async function refreshAccess(): Promise<string | null> {
  if (DEMO_CATALOG) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return null;
      const tokens = await authRequest('/auth/mobile/refresh', { refreshToken });
      await applyTokens(tokens);
      return tokens.accessToken;
    } catch (error) {
      if (error instanceof AuthRequestError && error.status === 401) await clearAuth();
      return null;
    }
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}
export async function restoreAuth() {
  if (DEMO_CATALOG) {
    const id = await SecureStore.getItemAsync(DEMO_KEY);
    currentUser = id ? demoUser(id) : null; accessToken = null; notify(); return;
  }
  await refreshAccess();
}
export async function logout() {
  if (DEMO_CATALOG || isDemoUser(currentUser)) { await clearAuth(); return; }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (refreshToken) {
      await fetch(API_BASE_URL + '/auth/mobile/logout', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        credentials: 'omit', body: JSON.stringify({ refreshToken, pushToken: await SecureStore.getItemAsync(pushTokenKey) ?? undefined }), signal: controller.signal,
      });
    }
  } catch {
    // Lokal çıxış internet kəsildikdə də tamamlanır.
  } finally {
    clearTimeout(timeout);
    await clearAuth();
  }
}

export async function logoutEverywhere() {
  if (DEMO_CATALOG || isDemoUser(currentUser)) { await clearAuth(); return; }
  try {
    const { api } = await import('./client');
    await api.post('/auth/logout-all', {});
  } finally { await clearAuth(); }
}
