import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(),
  refreshAccess: vi.fn<() => Promise<string | null>>(),
}));
vi.mock('../src/api/auth-store', () => auth);
vi.mock('../src/api/config', () => ({ API_BASE_URL: 'http://api.test/api/v1', DEMO_CATALOG: false }));

import { ApiError, request, withParams } from '../src/api/client';

beforeEach(() => {
  vi.resetAllMocks();
  auth.getAccessToken.mockReturnValue(null);
});

describe('API client', () => {
  it('encodes filters and omits empty values', () => {
    expect(withParams('/products', { q: 'qazlı içki', city: '', limit: 20, verified: false }))
      .toBe('/products?q=qazl%C4%B1+i%C3%A7ki&limit=20&verified=false');
  });

  it('refreshes an expired access token and retries once', async () => {
    auth.getAccessToken.mockReturnValue('expired');
    auth.refreshAccess.mockResolvedValue('fresh');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'p1' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await request<{ id: string }[]>('/products', { params: { limit: 20 } });
    expect(result.data[0].id).toBe('p1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe('Bearer expired');
    expect(fetchMock.mock.calls[1][1].headers.authorization).toBe('Bearer fresh');
  });

  it('keeps the server error status and request id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: 'Access denied' }, requestId: 'req-1' }), { status: 403 },
    )));
    await expect(request('/admin/overview')).rejects.toMatchObject({
      name: 'Error', message: 'Access denied', status: 403, requestId: 'req-1',
    } satisfies Partial<ApiError>);
  });

  it('reports an offline request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(request('/products')).rejects.toMatchObject({ status: 0 });
  });
});
