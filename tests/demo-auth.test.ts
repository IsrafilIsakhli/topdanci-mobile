import { beforeEach, describe, expect, it, vi } from 'vitest';
const secure = vi.hoisted(() => { const values = new Map<string, string>(); return { values,
  getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null), setItemAsync: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
  deleteItemAsync: vi.fn(async (key: string) => { values.delete(key); }) }; });
vi.mock('expo-secure-store', () => secure);
vi.mock('../src/api/config', () => ({ DEMO_CATALOG: true, API_BASE_URL: 'http://api.test' }));
beforeEach(() => { vi.resetModules(); secure.values.clear(); vi.stubGlobal('fetch', vi.fn()); });
describe('local preview authentication', () => {
  it('accepts the seller test login without producing bearer tokens', async () => {
    const auth = await import('../src/api/auth-store'); await auth.login(' MAGAZA@DEMO.AZ ', 'Magaza123!');
    expect(auth.getAuthSnapshot()).toMatchObject({ role: 'SELLER', id: 'preview-seller' });
    expect(auth.getAccessToken()).toBeNull(); expect(fetch).not.toHaveBeenCalled();
    expect(secure.values.get('topdanbazar.preview-user.v1')).toBe('preview-seller');
    expect(secure.values.has('topdanbazar.refresh.v1')).toBe(false);
  });
  it('rejects a wrong password and unknown identifiers', async () => {
    const auth = await import('../src/api/auth-store');
    await expect(auth.login('superadmin@demo.az', 'wrong')).rejects.toThrow('yanlışdır');
    await expect(auth.login('other@demo.az', 'Super123!')).rejects.toThrow('yanlışdır');
    expect(auth.getAuthSnapshot()).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
  it('restores the superadmin from the separate preview key', async () => {
    secure.values.set('topdanbazar.preview-user.v1', 'preview-super');
    const auth = await import('../src/api/auth-store'); await auth.restoreAuth();
    expect(auth.getAuthSnapshot()?.role).toBe('SUPER_ADMIN'); expect(fetch).not.toHaveBeenCalled();
  });
  it('logs out locally and removes the preview session', async () => {
    const auth = await import('../src/api/auth-store'); await auth.login('superadmin@demo.az', 'Super123!'); await auth.logout();
    expect(auth.getAuthSnapshot()).toBeNull(); expect(secure.values.size).toBe(0); expect(fetch).not.toHaveBeenCalled();
  });
});
