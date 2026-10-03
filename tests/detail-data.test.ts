import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/api/config', () => ({ CDN_BASE_URL: 'https://cdn.test' }));
import { availableContacts, productImageUris, storeAddress, storeHours } from '../src/features/catalog/detail-data';
const store = { id: 's', slug: 's', name: 'Satıcı' };
describe('detail data from the public catalog', () => {
  it('keeps ready photos and API photos without status, resolving storage keys', () => {
    expect(productImageUris({ id: 'p', slug: 'p', title: 'Məhsul', imageUrl: 'https://cdn.test/a.jpg',
      images: [
        { id: '1', status: 'READY', cdnUrl: 'https://cdn.test/a.jpg' },
        { id: '2', storageKey: 'products/b.jpg' },
        { id: '3', status: 'FAILED', cdnUrl: 'https://cdn.test/failed.jpg' },
        { id: '4', status: 'UPLOADING', storageKey: 'pending.jpg' },
        { id: '5', status: 'DELETED', cdnUrl: 'https://cdn.test/deleted.jpg' },
        { id: '6', cdnUrl: 'bad.json', storageKey: 'products/c.webp' },
      ] })).toEqual(['https://cdn.test/a.jpg', 'https://cdn.test/products/b.jpg', 'https://cdn.test/products/c.webp']);
  });
  it('does not fabricate media, addresses or working hours', () => {
    expect(productImageUris({ id: 'p', slug: 'p', title: 'Məhsul' })).toEqual([]);
    expect(storeAddress(store)).toBe('');
    expect(storeAddress({ ...store, city: ' Bakı ', district: 'Bakı', address: 'Nizami 10' })).toBe('Bakı, Nizami 10');
    expect(storeHours({ ...store, workingHours: { workdays: ' 09:00–18:00 ', saturday: '', sunday: false } }))
      .toEqual([{ label: 'Bazar ertəsi – Cümə', value: '09:00–18:00' }]);
    expect(storeHours(store)).toEqual([]);
  });
  it('offers only valid live contacts and demo actions without fake recipients', () => {
    expect(availableContacts({ ...store, phone: 'bad', email: 'seller@test.az' }).map((item) => item.kind)).toEqual(['email']);
    expect(availableContacts(store, true)).toEqual([]);
    const actions = availableContacts({ ...store, id: 'demo-s' }, true);
    expect(actions.map((item) => item.kind)).toEqual(['whatsapp', 'phone']);
    expect(actions.every((item) => item.value === undefined)).toBe(true);
  });
});
