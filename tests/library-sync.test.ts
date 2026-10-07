import { describe,it,expect } from 'vitest';
import { createLibrary,reconcileLibrary } from '../src/features/buyer/library-store';
import { emptyLibrary } from '../src/features/buyer/library-state';
import type { Product } from '../src/api/types';
const p:Product={id:'p',slug:'shirt',title:'Köynək'};
function memory(){const rows=new Map<string,string>();return{getItem:async(k:string)=>rows.get(k)??null,setItem:async(k:string,v:string)=>{rows.set(k,v);}};}
describe('Hesabla seçimlərin yenilənməsi',()=>{
 it('qonaq seçimini hesaba köçürür və şəxsi əlaqə məlumatı saxlamır',async()=>{
 const data=memory(),guest=createLibrary(data,'guest'),user=createLibrary(data,'user');
 await guest.toggleProduct({...p,store:{id:'s',slug:'s',name:'Mağaza',email:'secret@test.az'}});
 await user.importGuest(guest.snapshot());expect(user.snapshot().products).toHaveLength(1);expect(user.snapshot().products[0].store?.email).toBeUndefined();
 await guest.consumeGuest();expect(guest.snapshot().products).toHaveLength(0);expect(user.snapshot().pending[0]).toMatchObject({id:'p',saved:true});
 });
 it('sorğu gedərkən silinən seçimi köhnə cavab geri qaytarmır',async()=>{
 const user=createLibrary(memory(),'u');await user.toggleProduct(p);const sent=await user.prepareSync();await user.toggleProduct(p);
 await user.acceptRemote({products:[p],stores:[]},sent);expect(user.snapshot().products).toEqual([]);expect(user.snapshot().pending[0].saved).toBe(false);
 const remove=await user.prepareSync();await user.acceptRemote({products:[],stores:[]},remove);expect(user.snapshot().pending).toHaveLength(0);
 });
 it('internet olmayan müddətdə silmə niyyətini cihazda bərpa edir',async()=>{
 const data=memory(),user=createLibrary(data,'u');await user.toggleProduct(p);await user.toggleProduct(p);
 const reopen=createLibrary(data,'u');await reopen.hydrate();expect(reopen.snapshot().pending).toHaveLength(1);expect(reopen.snapshot().pending[0].saved).toBe(false);
 });
 it('serverdən başqa cihazın seçimlərini gətirir',()=>{
 const state=reconcileLibrary(emptyLibrary(),{products:[p],stores:[]},[]);expect(state.products[0].id).toBe('p');expect(state.cloudInitialized).toBe(true);
 });
});
