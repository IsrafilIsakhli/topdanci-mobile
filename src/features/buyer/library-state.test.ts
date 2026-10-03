import { describe, expect, it } from 'vitest';
import { addRecent, addSearch, parseLibrary, productSnapshot } from './library-state';
import { createLibrary } from './library-store';
import { notificationRoute } from './notification-route';
import type { Product } from '../../api/types';
const product:Product={id:'p',slug:'shirt',title:'Köynək',store:{id:'s',slug:'shop',name:'Mağaza',phone:'+994',email:'private@sample.az'}};
describe('Alıcı yaddaşı',()=>{
 it('şəxsi əlaqə məlumatlarını yaddaş surətinə daxil etmir',()=>{expect(JSON.stringify(productSnapshot(product))).not.toContain('private@');expect(productSnapshot(product)?.store?.phone).toBeUndefined();});
 it('zədələnmiş yaddaşı təhlükəsiz açır və uyğun olmayan filtri silir',()=>{expect(parseLibrary('{').ready).toBe(true);expect(parseLibrary(JSON.stringify({filters:{stock:'BAD',priceMin:'5',priceMax:'2'}})).filters.priceMin).toBe('');});
 it('axtarışları təkrarsız və məhdud saxlayır',()=>{expect(addSearch(['KÖYNƏK','un'],'köynək')).toEqual(['köynək','un']);expect(addSearch(Array.from({length:12},(_,i)=>String(i)),'new')).toHaveLength(8);});
 it('son baxılan məhsulu qabağa gətirir',()=>{expect(addRecent([{kind:'product',item:product,at:1}],{kind:'product',item:product,at:2})).toHaveLength(1);});
 it('gec açılan yaddaş zamanı yeni seçimlər itmir və yazılar ardıcıldır',async()=>{
 let resolve!:(value:string|null)=>void;const writes:string[]=[];
 const store=createLibrary({getItem:()=>new Promise(r=>{resolve=r;}),setItem:async(_,raw)=>{writes.push(raw);}},'guest');
 const first=store.toggleProduct(product),second=store.search('un');resolve(JSON.stringify({searches:['köynək']}));
 await Promise.all([first,second]);expect(store.snapshot().products).toHaveLength(1);expect(store.snapshot().searches).toEqual(['un','köynək']);expect(JSON.parse(writes.at(-1)!)).toMatchObject({searches:['un','köynək']});
 });
 it('hesabların yaddaşını ayırır və tətbiq açılışında saxlanmış seçimi bərpa edir',async()=>{
 const values=new Map<string,string>();const storage={getItem:async(key:string)=>values.get(key)??null,setItem:async(key:string,raw:string)=>{values.set(key,raw);}};
 const guest=createLibrary(storage,'guest');await guest.toggleProduct(product);
 const seller=createLibrary(storage,'seller');await seller.hydrate();expect(seller.snapshot().products).toHaveLength(0);
 const reopened=createLibrary(storage,'guest');await reopened.hydrate();expect(reopened.snapshot().products[0]?.id).toBe('p');
 });
 it('yazı xətasını göstərir',async()=>{const store=createLibrary({getItem:async()=>null,setItem:async()=>{throw new Error('full');}},'key');await store.search('un');expect(store.snapshot().error).toContain('saxlanmadı');});
});
describe('Bildiriş keçidləri',()=>{
 it('rol və məlum daxili səhifələr üzrə keçid verir',()=>{expect(notificationRoute('/seller/products/p/edit','SELLER')).toBe('/seller/product/p');expect(notificationRoute('/admin/store-applications/a','SUPER_ADMIN')).toBe('/admin/applications/a');expect(notificationRoute('/admin/products/p','SELLER')).toBeUndefined();expect(notificationRoute('/requests/r')).toBe('/requests/r');});
 it('xarici və naməlum ünvanları rədd edir',()=>{for(const url of ['https://evil.test','//evil.test','/admin/%2e%2e','/unknown','/store/a?token=x'])expect(notificationRoute(url,'SUPER_ADMIN')).toBeUndefined();});
})