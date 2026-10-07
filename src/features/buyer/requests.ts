import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ApiError, api } from '../../api/client';
import { getAuthSnapshot } from '../../api/auth-store';
import { DEMO_CATALOG } from '../../api/config';
import type { Store } from '../../api/types';
export type BuyerOffer={id:string;price?:number|string|null;message:string;store:Store;updatedAt:string};
export type BuyerRequest={id:string;title:string;quantity:number|string;unit:string;city:string;category?:string;description?:string;status:'ACTIVE'|'CLOSED';createdAt:string;expiresAt:string;_count:{offers:number};offers?:BuyerOffer[];owned?:boolean};
export type RequestDraft={title:string;quantity:number;unit:string;city:string;category?:string;description?:string};
export const units=['ədəd','cüt','kq','metr','qutu','palet','dəst','litr'];
export function requestErrors(draft:RequestDraft){
 const errors:Record<string,string>={};
 if(draft.title.trim().length<4)errors.title='Məhsulun adını ən az 4 simvolla yazın.';
 if(!Number.isFinite(draft.quantity)||draft.quantity<=0||draft.quantity>100000000||Math.abs(Math.round(draft.quantity*1000)-draft.quantity*1000)>0.000001)errors.quantity='Miqdarı düzgün yazın (ən çox 3 onluq rəqəm).';
 if(draft.city.trim().length<2)errors.city='Şəhərin adını yazın.';
 if(!units.includes(draft.unit))errors.unit='Miqdar vahidini seçin.';
 return errors;
}
const scope=()=> (DEMO_CATALOG?'demo':'live')+':'+(getAuthSnapshot()?.id??'guest');
const indexKey=(id:string)=>'topdanbazar.requests.v1:'+id;
const tokenKey=(id:string,owner:string)=>'request-token.'+owner.replace(/[^a-zA-Z0-9._-]/g,'_')+'.'+id;
const tokenCache=new Map<string,string>();
const memoryIds=new Map<string,string[]>();
export async function ownRequestIds(){const owner=scope();const raw=await AsyncStorage.getItem(indexKey(owner));let ids:string[]=[];try{const parsed=JSON.parse(raw??'[]');if(Array.isArray(parsed))ids=parsed.filter(v=>typeof v==='string').slice(0,100);}catch{/* Köhnə siyahı oxunmasa cari sessiya saxlanır. */}return [...new Set([...(memoryIds.get(owner)??[]),...ids])];}
export async function requestToken(id:string){const key=tokenKey(id,scope());return tokenCache.get(key)??await SecureStore.getItemAsync(key);}
async function remember(id:string,token:string,owner:string){
 const key=tokenKey(id,owner);tokenCache.set(key,token);memoryIds.set(owner,[id,...(memoryIds.get(owner)??[]).filter(v=>v!==id)]);
 await SecureStore.setItemAsync(key,token);
 const parsed=JSON.parse(await AsyncStorage.getItem(indexKey(owner))??'[]'); const ids=Array.isArray(parsed)?parsed.filter(v=>typeof v==='string'):[];
 await AsyncStorage.setItem(indexKey(owner),JSON.stringify([id,...ids.filter(v=>v!==id)].slice(0,100)));
}
let writes=Promise.resolve();
const demoKey='topdanbazar.demoboard.v1';
async function demoItems():Promise<BuyerRequest[]>{
 const raw=await AsyncStorage.getItem(demoKey);if(raw)return JSON.parse(raw);
 return [{id:'sample-hats',title:'Yay papaqları, qarışıq modellər',quantity:500,unit:'ədəd',city:'Bakı',category:'geyim-ayaqqabi-ve-tekstil',status:'ACTIVE',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+30*86400000).toISOString(),_count:{offers:0},offers:[]}];
}
async function changeDemo(change:(items:BuyerRequest[])=>BuyerRequest[]){
 const operation=writes.catch(()=>undefined).then(async()=>{await AsyncStorage.setItem(demoKey,JSON.stringify(change(await demoItems())));});
 writes=operation;await operation;
}
export async function listRequests(params:{q?:string;city?:string;category?:string;cursor?:string}={}){
 if(!DEMO_CATALOG)return api.get<BuyerRequest[]>('/buyer-requests',{...params,limit:20});
 const items=(await demoItems()).filter(r=>r.status==='ACTIVE'&&new Date(r.expiresAt)>new Date()&&(!params.q||r.title.toLocaleLowerCase('az').includes(params.q.toLocaleLowerCase('az')))&&(!params.city||r.city.toLocaleLowerCase('az')===params.city.toLocaleLowerCase('az'))&&(!params.category||r.category===params.category));
 const start=Number(params.cursor)||0;return {data:items.slice(start,start+20).map(r=>({...r,offers:undefined})),meta:{total:items.length,nextCursor:start+20<items.length?String(start+20):null}};
}
export async function getRequest(id:string,manage=true){
 const token=manage?await requestToken(id):null;
 if(!DEMO_CATALOG && manage && getAuthSnapshot()) {
  try { return await api.get<BuyerRequest>('/buyer-requests/'+encodeURIComponent(id)+'/owned'); }
  catch(e) { if(!(e instanceof ApiError) || e.status!==404) throw e; }
 }
 if(!DEMO_CATALOG)return token?api.post<BuyerRequest>('/buyer-requests/'+encodeURIComponent(id)+'/manage',{token}):api.get<BuyerRequest>('/buyer-requests/'+encodeURIComponent(id));
 const item=(await demoItems()).find(r=>r.id===id);if(!item)throw new Error('Tələb tapılmadı.');
 return {data:token?{...item,owned:true}:{...item,offers:undefined}};
}
export async function createRequest(draft:RequestDraft){
 const owner=scope();let item:BuyerRequest;let token:string;
 if(DEMO_CATALOG){
   item={...draft,id:'demo-request-'+Date.now().toString(36),status:'ACTIVE',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+30*86400000).toISOString(),_count:{offers:0},offers:[]};
   token='demo-'+item.id;await changeDemo(items=>[item,...items]);
 }else{
   const result=await api.post<{request:BuyerRequest;managementToken:string}>('/buyer-requests',draft);item=result.data.request;token=result.data.managementToken;
 }
 try{await remember(item.id,token,owner);}catch{return {...item,storageWarning:'Tələb yaradıldı, amma idarə açarı cihazda saxlanmadı. Tətbiqi bağlamadan təklifləri izləyin və ya tələbi bağlayın.'};}return {...item,storageWarning:''};
}
export async function closeRequest(id:string){
 if(!DEMO_CATALOG&&getAuthSnapshot()){ try { await api.post('/buyer-requests/'+encodeURIComponent(id)+'/owned/close',{});return; } catch(e){if(!(e instanceof ApiError)||e.status!==404)throw e;} }
 const token=await requestToken(id);if(!token)throw new Error('Bu tələbi yalnız sahibi bağlaya bilər.');
 if(DEMO_CATALOG)await changeDemo(items=>items.map(r=>r.id===id?{...r,status:'CLOSED'}:r));else await api.post('/buyer-requests/'+encodeURIComponent(id)+'/close',{token});
}
export async function listOwnRequests(cursor = '') {
 if(!DEMO_CATALOG&&getAuthSnapshot()) return api.get<BuyerRequest[]>('/buyer-requests/mine',{cursor,limit:20});
 const ids=await ownRequestIds();const data=await Promise.all(ids.slice(Number(cursor)||0,(Number(cursor)||0)+20).map(async id=>(await getRequest(id)).data));
 return {data,meta:{nextCursor:(Number(cursor)||0)+20<ids.length?String((Number(cursor)||0)+20):null}};
}
export async function migrateGuestRequests(){
 const user=getAuthSnapshot();if(!user)return;
 const owner=scope(),guest=(DEMO_CATALOG?'demo':'live')+':guest';let parsed:unknown;try{parsed=JSON.parse(await AsyncStorage.getItem(indexKey(guest))??'[]');}catch{return;}if(!Array.isArray(parsed))return;
 for(const id of parsed.filter(v=>typeof v==='string').slice(0,100)){
  if(getAuthSnapshot()?.id!==user.id)return;
  const token=await SecureStore.getItemAsync(tokenKey(id,guest));if(!token)continue;
  if(!DEMO_CATALOG){try{await api.post('/buyer-requests/'+encodeURIComponent(id)+'/claim',{token});}catch(e){if(e instanceof ApiError&&(e.status===403||e.status===404))continue;throw e;}}
  await remember(id,token,owner);
  await SecureStore.deleteItemAsync(tokenKey(id,guest)); tokenCache.delete(tokenKey(id,guest));
  const current=JSON.parse(await AsyncStorage.getItem(indexKey(guest))??'[]');
  await AsyncStorage.setItem(indexKey(guest),JSON.stringify(Array.isArray(current)?current.filter(v=>v!==id):[]));
  memoryIds.set(guest,(memoryIds.get(guest)??[]).filter(v=>v!==id));
 }
}
export async function sendOffer(id:string,store:Store,price:number|undefined,message:string){
 if(!DEMO_CATALOG)return api.post('/buyer-requests/'+encodeURIComponent(id)+'/offers',{storeId:store.id,...(price!==undefined?{price}:{}),message});
 if(getAuthSnapshot()?.role!=='SELLER')throw new Error('Təklif üçün satıcı hesabına daxil olun.');
 const own=await api.get<Store[]>('/seller/stores');if(!own.data.some(s=>s.id===store.id))throw new Error('Yalnız öz mağazanızdan təklif göndərin.');
 await changeDemo(items=>items.map(r=>{
   if(r.id!==id)return r;if(r.status!=='ACTIVE'||new Date(r.expiresAt)<=new Date())throw new Error('Tələb artıq təklif qəbul etmir.');
   const offers=[{id:'offer-'+store.id,price,message,store,updatedAt:new Date().toISOString()},...(r.offers??[]).filter(o=>o.store.id!==store.id)];
   return {...r,offers,_count:{offers:offers.length}};
 }));
}