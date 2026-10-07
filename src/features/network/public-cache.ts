import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../api/config';
import type { ApiEnvelope } from '../../api/types';
const key = 'public-cache.v1:' + API_BASE_URL;
type Entry = { at: number; payload: ApiEnvelope<unknown> };
let data: Record<string, Entry> = {}, hydrated: Promise<void> | undefined, writes = Promise.resolve();
export function publicCachePath(path: string) { return /^\/(categories|products|stores)(\/[^/?]+)?$/.test(path) && path !== '/stores/applications'; }
async function hydrate() { await (hydrated ??= AsyncStorage.getItem(key).then(raw => { if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed; } }).catch(() => undefined)); }
export async function readPublicCache<T>(url: string) {
  await hydrate(); const entry = data[url]; if (!entry || !Number.isFinite(entry.at) || Date.now() - entry.at > 7 * 86400000 || !entry.payload || !('data' in entry.payload)) return null;
  return { ...entry.payload, meta: { ...entry.payload.meta, cachedAt: new Date(entry.at).toISOString() } } as ApiEnvelope<T>;
}
export async function forgetPublicCache(url:string) {
 await hydrate();delete data[url];const raw=JSON.stringify(data);
 writes=writes.catch(()=>undefined).then(()=>AsyncStorage.setItem(key,raw)).catch(()=>undefined);await writes;
}
export async function writePublicCache(url: string, payload: ApiEnvelope<unknown>) {
  await hydrate(); if (JSON.stringify(payload).length > 150000) return;
  data[url] = { at: Date.now(), payload };
  data = Object.fromEntries(Object.entries(data).sort((a,b) => b[1].at - a[1].at).slice(0,30));
  const raw = JSON.stringify(data); writes = writes.catch(() => undefined).then(() => AsyncStorage.setItem(key, raw)).catch(() => undefined); await writes;
}