import { WEB_BASE_URL } from '../../api/config';
export function sharedCatalogUrl(kind:'product'|'store',slug:string) { return WEB_BASE_URL + (kind==='product'?'/products/':'/stores/') + encodeURIComponent(slug); }
export function catalogLinkRoute(path:string) {
 try {
  const parsed = new URL(path, WEB_BASE_URL);
  if (!['topdanbazar:','https:'].includes(parsed.protocol)) return '/home';
  if (parsed.protocol==='https:' && parsed.origin !== new URL(WEB_BASE_URL).origin) return '/home';
  const match=parsed.pathname.match(/^\/(products?|stores?)\/([^/]+)\/?$/);
  if(match) return (match[1].startsWith('product')?'/product/':'/store/')+encodeURIComponent(decodeURIComponent(match[2]));
  return '/home';
 }catch{return '/home';}
}