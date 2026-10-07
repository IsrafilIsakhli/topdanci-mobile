import { describe,it,expect,vi } from 'vitest';
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:async()=>null,setItem:async()=>undefined}}));
import { publicCachePath,writePublicCache,readPublicCache } from '../src/features/network/public-cache';
describe('İnternetsiz açıq kataloq',()=>{
 it('hesab, satıcı, admin və alıcı tələblərini keşə daxil etmir',()=>{for(const path of ['/auth/me','/seller/products','/admin/overview','/buyer-requests/mine','/notifications','/stores/applications'])expect(publicCachePath(path)).toBe(false);expect(publicCachePath('/products/shirt')).toBe(true);expect(publicCachePath('/stores')).toBe(true);});
 it('köhnə qiymətin göstərildiyini açıq işarələyir',async()=>{await writePublicCache('/products',{data:[{id:'p'}],meta:{total:1}});const cached=await readPublicCache('/products');expect(cached?.meta?.cachedAt).toBeTruthy();expect(cached?.meta?.total).toBe(1);});
});
