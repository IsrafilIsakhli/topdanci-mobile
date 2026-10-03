import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ alert: vi.fn(), openURL: vi.fn(), post: vi.fn(), config: { DEMO_CATALOG: true } }));
vi.mock('react-native', () => ({ Alert: { alert: mocks.alert }, Linking: { openURL: mocks.openURL } }));
vi.mock('../src/api/config', () => mocks.config);
vi.mock('../src/api/client', () => ({ api: { post: mocks.post } }));
import { openContact } from '../src/lib/contact';
beforeEach(() => { vi.resetAllMocks(); mocks.config.DEMO_CATALOG = true; mocks.openURL.mockResolvedValue(undefined); mocks.post.mockResolvedValue(undefined); });
describe('contact actions', () => {
  it('keeps demo contacts entirely local', async () => {
    await openContact('whatsapp', undefined, 'demo-store', 'demo-product');
    expect(mocks.alert).toHaveBeenCalledWith('Nümunə kataloq', expect.any(String));
    expect(mocks.openURL).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('does not open or track invalid contacts', async () => {
    mocks.config.DEMO_CATALOG = false;
    await openContact('phone', 'invalid', 's');
    expect(mocks.openURL).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.alert).toHaveBeenCalledWith('Məlumat yoxdur', expect.any(String));
  });
  it('opens valid contact even when analytics fails, with product context', async () => {
    mocks.config.DEMO_CATALOG = false;
    mocks.post.mockRejectedValue(new Error('offline'));
    await openContact('whatsapp', '+994501234567', 's', 'p', 'Salam & ölçü');
    expect(mocks.openURL).toHaveBeenCalledWith('https://wa.me/994501234567?text=' + encodeURIComponent('Salam & ölçü'));
    expect(mocks.post).toHaveBeenCalledWith('/leads', { type: 'WHATSAPP_CLICK', storeId: 's', productId: 'p', source: 'mobile' });
  });
  it('reports an unavailable contact app', async () => {
    mocks.config.DEMO_CATALOG = false;
    mocks.openURL.mockRejectedValue(new Error('unavailable'));
    await openContact('email', 'seller@test.az', 's');
    expect(mocks.alert).toHaveBeenCalledWith('Açılmadı', expect.any(String));
  });
});
