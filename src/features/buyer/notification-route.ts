import type { UserRole } from '../../api/types';
export function notificationRoute(href:unknown,role?:UserRole):string|undefined{
 if(typeof href!=='string'||href.includes('://')||href.includes('\\')||href.includes('%')||href.startsWith('//'))return;
 const match=href.match(/^\/(requests|product|store)\/([a-zA-Z0-9_-]+)$/);if(match)return href;
 if(href==='/requests'||href==='/account'||href==='/home')return href;
 if(role==='SELLER'){
  if(['/seller','/seller/store','/seller/products'].includes(href))return href;
  const product=href.match(/^\/seller\/products\/([a-zA-Z0-9_-]+)(?:\/edit)?$/);if(product)return '/seller/product/'+product[1];
 }
 if(role==='ADMIN'||role==='SUPER_ADMIN'){
  if(href==='/admin')return href;
  const admin=href.match(/^\/admin\/(store-applications|applications|products|stores|reports)\/([a-zA-Z0-9_-]+)$/);
  if(admin)return '/admin/'+(admin[1]==='store-applications'?'applications':admin[1])+'/'+admin[2];
 }
}