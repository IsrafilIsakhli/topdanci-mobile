import { API_BASE_URL, DEMO_CATALOG } from './config';
import { getAccessToken, getAuthSnapshot, refreshAccess } from './auth-store';
import type { ApiEnvelope } from './types';
import { demoCatalogResponse } from '../features/catalog/demo-api';
import { managementPreview, PreviewError } from '../features/management/demo-api';

export class ApiError extends Error {
  constructor(message: string, public status: number, public requestId?: string) { super(message); }
}
type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; params?: Record<string, string | number | boolean | null | undefined> };
export function withParams(path: string, params: Options['params']) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? path + '?' + suffix : path;
}
async function send(path: string, options: Options, token: string | null): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(API_BASE_URL + withParams(path, options.params), {
      method: options.method ?? 'GET', credentials: 'omit',
      headers: {
        accept: 'application/json',
        ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: 'Bearer ' + token } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });
  } finally { clearTimeout(timeout); }
}
export async function request<T>(path: string, options: Options = {}): Promise<ApiEnvelope<T>> {
  if (DEMO_CATALOG) {
    try { const preview = managementPreview<T>(path, options, getAuthSnapshot()); if (preview) return preview; }
    catch (error) { if (error instanceof PreviewError) throw new ApiError(error.message, error.status); throw error; }
  }
  if (DEMO_CATALOG && (!options.method || options.method === 'GET')) {
    const demo = demoCatalogResponse<T>(path, options.params);
    if (demo) return demo;
  }
  if (DEMO_CATALOG) throw new ApiError('Bu əməliyyat yalnız canlı rejimdə işləyir. Test məlumatı serverə göndərilmir.', 400);
  let response: Response;
  try {
    const token = getAccessToken();
    response = await send(path, options, token);
    if (response.status === 401 && token) {
      const replacement = await refreshAccess();
      if (replacement) response = await send(path, options, replacement);
    }
  } catch {
    throw new ApiError('Serverlə əlaqə yoxdur. İnterneti və API ünvanını yoxlayın.', 0);
  }
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> & { error?: { message?: string }; requestId?: string } | null;
  if (!response.ok) throw new ApiError(payload?.error?.message ?? 'Sorğu yerinə yetirilmədi.', response.status, payload?.requestId);
  if (!payload || !('data' in payload)) throw new ApiError('Server cavabı gözlənilən formada deyil.', response.status);
  return payload;
}
export const api = {
  get: <T>(path: string, params?: Options['params']) => request<T>(path, { params }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
