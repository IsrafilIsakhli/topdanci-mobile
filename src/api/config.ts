export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

const webUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://topdanci-az.vercel.app';
export const WEB_BASE_URL = (() => { try { const url = new URL(webUrl); return url.protocol === 'https:' ? url.origin : 'https://topdanci-az.vercel.app'; } catch { return 'https://topdanci-az.vercel.app'; } })();

export const CDN_BASE_URL = (process.env.EXPO_PUBLIC_CDN_BASE_URL ?? '').replace(/\/+$/, '');

export const DEMO_CATALOG = typeof __DEV__ !== 'undefined' && __DEV__ &&
  process.env.EXPO_PUBLIC_DEMO_CATALOG !== 'false';
