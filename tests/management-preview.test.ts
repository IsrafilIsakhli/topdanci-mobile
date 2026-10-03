import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminRecord, Product, SessionUser, Store } from '../src/api/types';
import { api } from '../src/api/client';
import { resetManagementPreview } from '../src/features/management/demo-api';
import { demoUser } from '../src/features/auth/demo-accounts';
import { detailRows } from '../src/features/management/detail-rows';
import { productDraftErrors } from '../src/features/management/validation';
const auth = vi.hoisted(() => ({ getAuthSnapshot: vi.fn(), getAccessToken: vi.fn(), refreshAccess: vi.fn() }));
vi.mock('../src/api/auth-store', () => auth);
vi.mock('../src/api/config', () => ({ DEMO_CATALOG: true, API_BASE_URL: 'http://api.test' }));
const seller = () => auth.getAuthSnapshot.mockReturnValue(demoUser('preview-seller'));
const admin = () => auth.getAuthSnapshot.mockReturnValue(demoUser('preview-super'));
beforeEach(() => { resetManagementPreview(); auth.getAuthSnapshot.mockReturnValue(null); vi.stubGlobal('fetch', vi.fn()); });
describe('management preview isolation and permissions', () => {
  it('requires login for protected previews', async () => { await expect(api.get('/seller/overview')).rejects.toMatchObject({ status: 401 }); expect(fetch).not.toHaveBeenCalled(); });
  it('keeps the seller out of superadmin routes and other stores', async () => {
    seller(); await expect(api.get('/admin/users')).rejects.toMatchObject({ status: 403 });
    await expect(api.patch('/seller/stores/demo-store-tech', { name: 'other' })).rejects.toMatchObject({ status: 404 });
    await expect(api.get('/seller/products/demo-product-4')).rejects.toMatchObject({ status: 404 }); expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects forged preview roles', async () => { auth.getAuthSnapshot.mockReturnValue({ ...demoUser('preview-seller'), role: 'SUPER_ADMIN' } as SessionUser); await expect(api.get('/admin/users')).rejects.toMatchObject({ status: 401 }); });
  it('never forwards unimplemented preview mutations to a real API', async () => { seller(); await expect(api.post('/media/upload-url', {})).rejects.toMatchObject({ status: 400 }); expect(fetch).not.toHaveBeenCalled(); });
});
describe('management preview workflows', () => {
  it('creates, reviews, approves, then deletes a seller product', async () => {
    seller(); const stores = await api.get<Store[]>('/seller/stores');
    const created = await api.post<Product>('/seller/products', { storeId: stores.data[0].id, categoryId: 'demo-category-koynekler', title: 'Test köynək', priceType: 'FIXED', price: 12, unit: 'PIECE', minOrderQuantity: 10, stockStatus: 'IN_STOCK' });
    expect(created.data.status).toBe('DRAFT'); await api.post('/seller/products/' + created.data.id + '/submit-review', {});
    admin(); await api.post('/admin/products/' + created.data.id + '/approve', {});
    seller(); expect((await api.get<Product>('/seller/products/' + created.data.id)).data.status).toBe('ACTIVE');
    await api.delete('/seller/products/' + created.data.id); await expect(api.get('/seller/products/' + created.data.id)).rejects.toMatchObject({ status: 404 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('paginates and filters seller status lists', async () => {
    seller(); const first = await api.get<Product[]>('/seller/products', { limit: 2 });
    expect(first.meta?.total).toBe(5); const next = await api.get<Product[]>('/seller/products', { limit: 2, cursor: first.meta?.nextCursor });
    expect(next.data[0].id).not.toBe(first.data[0].id);
    expect((await api.get<Product[]>('/seller/products', { status: 'DRAFT' })).data.every((p) => p.status === 'DRAFT')).toBe(true);
  });
  it('approves applications and updates the overview', async () => {
    admin(); await api.post('/admin/store-applications/preview-application-1/approve', {});
    const result = await api.get<{ pendingStores: number; activeStores: number }>('/admin/overview'); expect(result.data).toMatchObject({ pendingStores: 1, activeStores: 5 });
  });
  it('records mutations in the audit and protects the current superadmin', async () => {
    admin(); await api.patch('/admin/users/preview-buyer/status', { status: 'SUSPENDED' });
    expect((await api.get<AdminRecord[]>('/admin/audit-logs')).data.length).toBe(2);
    await expect(api.patch('/admin/users/preview-super/role', { role: 'BUYER' })).rejects.toThrow('dəyişmək olmaz');
  });
  it('rejects circular category parenting and keeps public fixtures unchanged', async () => {
    admin(); await expect(api.patch('/admin/categories/demo-category-geyim-ayaqqabi-ve-tekstil', { parentId: 'demo-category-koynekler' })).rejects.toThrow('dairəvi');
    seller(); await api.patch('/seller/stores/demo-store-textile', { name: 'Test yeniləmə' });
    expect((await api.get<Store[]>('/seller/stores')).data[0].name).toBe('Test yeniləmə');
    expect((await api.get<Store>('/stores/baku-tekstil-mmc')).data.name).toBe('Baku Tekstil MMC');
  });
});
describe('mobile editor safeguards', () => {
  it('rejects invalid money and minimum orders, accepts a decimal comma', () => {
    const base = { storeId: 's', categoryId: 'c', title: 'Köynək', priceType: 'FIXED', price: '12,50', minOrder: '10' };
    expect(productDraftErrors(base)).toEqual({}); expect(productDraftErrors({ ...base, price: '-1', minOrder: 'abc' })).toHaveProperty('price');
    expect(productDraftErrors({ ...base, minOrder: '0' })).toHaveProperty('minOrder');
  });
  it('hides sensitive values including nested secrets in admin details', () => {
    const rows = detailRows({ name: 'Store', passwordHash: 'secret', owner: { email: 'a@demo.az', refreshToken: 'secret', id: 'internal' } });
    expect(JSON.stringify(rows)).not.toContain('secret'); expect(JSON.stringify(rows)).not.toContain('internal'); expect(JSON.stringify(rows)).toContain('a@demo.az');
  });
});
