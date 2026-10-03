import { beforeEach, describe, expect, it, vi } from 'vitest';

const secure = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
    deleteItemAsync: vi.fn(async (key: string) => { values.delete(key); }),
  };
});
vi.mock('expo-secure-store', () => secure);
vi.mock('../src/api/config', () => ({ API_BASE_URL: 'http://api.test/api/v1', DEMO_CATALOG: false }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  secure.values.clear();
});

describe('mobile session', () => {
  it('does not treat test credentials as an offline login in live mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const auth = await import('../src/api/auth-store');
    await expect(auth.login('superadmin@demo.az', 'Super123!')).rejects.toThrow('yanlışdır');
    expect(fetch).toHaveBeenCalled(); expect(auth.getAuthSnapshot()).toBeNull();
  });
  it('retains the refresh token during an internet outage', async () => {
    secure.values.set('topdanbazar.refresh.v1', 'saved-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const auth = await import('../src/api/auth-store');
    expect(await auth.refreshAccess()).toBeNull();
    expect(secure.values.get('topdanbazar.refresh.v1')).toBe('saved-token');
  });

  it('rotates tokens and exposes the signed-in user', async () => {
    secure.values.set('topdanbazar.refresh.v1', 'old-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { authenticated: true, user: { id: 'u1', role: 'SELLER', status: 'ACTIVE' },
        accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 },
    }), { status: 200 })));
    const auth = await import('../src/api/auth-store');
    expect(await auth.refreshAccess()).toBe('new-access');
    expect(auth.getAuthSnapshot()?.role).toBe('SELLER');
    expect(secure.values.get('topdanbazar.refresh.v1')).toBe('new-refresh');
  });

  it('removes an invalid refresh session', async () => {
    secure.values.set('topdanbazar.refresh.v1', 'invalid-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const auth = await import('../src/api/auth-store');
    expect(await auth.refreshAccess()).toBeNull();
    expect(secure.values.has('topdanbazar.refresh.v1')).toBe(false);
  });
});
