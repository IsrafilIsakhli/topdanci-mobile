import { describe,it,expect } from 'vitest';
import { draftStorage } from '../src/features/forms/draft-storage';
function memory(){const rows=new Map<string,string>();return{rows,getItemAsync:async(k:string)=>rows.get(k)??null,setItemAsync:async(k:string,v:string)=>{rows.set(k,v);},deleteItemAsync:async(k:string)=>{rows.delete(k);}};}
describe('Qorunan qaralamalar',()=>{
 it('uzun Azərbaycan mətnini kiçik hissələrlə saxlayır və bərpa edir',async()=>{const data=memory(),draft=draftStorage(data,'u.form');const value={description:'Şəki şəhərində '.repeat(250)};await draft.write(value);expect(await draft.read()).toEqual(value);expect([...data.rows.values()].every(v=>v.length<=400)).toBe(true);});
 it('yazılma yarımçıq qalanda əvvəlki qaralamanı qoruyur',async()=>{const data=memory(),draft=draftStorage(data,'x');await draft.write({title:'Birinci'});const broken=draftStorage({...data,setItemAsync:async(k,v)=>{if(k!=='x')throw Error('full');await data.setItemAsync(k,v);}},'x');await expect(broken.write({title:'İkinci'})).rejects.toThrow();expect(await draft.read()).toEqual({title:'Birinci'});});
 it('gözləyən yazıdan sonra təmizləyir, uğurlu formanı geri qaytarmır',async()=>{const data=memory(),draft=draftStorage(data,'u');const save=draft.write({title:'Məhsul'});await draft.clear();await save;expect(await draft.read()).toBeNull();expect(data.rows.size).toBe(0);});
 it('zədələnmiş manifestdən sonra yeni qaralama saxlayır',async()=>{const data=memory();data.rows.set('x','broken');const draft=draftStorage(data,'x');await expect(draft.read()).rejects.toThrow();await draft.write({title:'Yeni'});expect(await draft.read()).toEqual({title:'Yeni'});});
 it('vaxtı keçmiş qaralamanı qorunan yaddaşdan silir',async()=>{const data=memory(),draft=draftStorage(data,'x');await draft.write({title:'Köhnə'});const item=JSON.parse(data.rows.get('x')!);data.rows.set('x',JSON.stringify({...item,at:Date.now()-31*86400000}));expect(await draft.read()).toBeNull();expect(data.rows.size).toBe(0);});
 it('hesab qaralamalarını ayrı saxlayır',async()=>{const data=memory();await draftStorage(data,'first').write({title:'Özəl'});expect(await draftStorage(data,'second').read()).toBeNull();});
});
