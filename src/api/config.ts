export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

export const CDN_BASE_URL = (process.env.EXPO_PUBLIC_CDN_BASE_URL ?? '').replace(/\/+$/, '');

export const DEMO_CATALOG = typeof __DEV__ !== 'undefined' && __DEV__ &&
  process.env.EXPO_PUBLIC_DEMO_CATALOG !== 'false';
