export interface DraftStorage { getItemAsync(key:string):Promise<string|null>; setItemAsync(key:string,value:string):Promise<void>; deleteItemAsync(key:string):Promise<void> }
type Manifest={version:string;count:number;at:number};
function manifest(raw:string|null):Manifest|null{
 if(!raw)return null;
 try{const value=JSON.parse(raw);return value&&typeof value.version==='string'&&/^[a-z0-9]{1,40}$/.test(value.version)&&Number.isInteger(value.count)&&value.count>=1&&value.count<=40&&Number.isFinite(value.at)?value:null;}catch{return null;}
}
export function draftStorage(storage:DraftStorage,key:string){
 let writes=Promise.resolve();
 const cleanup=async(value:Manifest|null)=>{if(value)await Promise.all(Array.from({length:value.count},(_,i)=>storage.deleteItemAsync(key+'.'+value.version+'.'+i))).catch(()=>undefined);};
 const clear=()=>{
  const task=writes.catch(()=>undefined).then(async()=>{const old=manifest(await storage.getItemAsync(key));await storage.deleteItemAsync(key);await cleanup(old);});writes=task;return task;
 };
 const read=async()=>{
  const raw=await storage.getItemAsync(key);if(!raw)return null;
  const value=manifest(raw);if(!value)throw Error('Qaralama oxunmadı.');
  if(Date.now()-value.at>30*86400000){await clear();return null;}
  const chunks=await Promise.all(Array.from({length:value.count},(_,i)=>storage.getItemAsync(key+'.'+value.version+'.'+i)));
  if(chunks.some(v=>v===null))throw Error('Qaralama tam oxunmadı.');
  return JSON.parse(chunks.join('')) as Record<string,unknown>;
 };
 const write=(value:unknown)=>{
  const task=writes.catch(()=>undefined).then(async()=>{
   const raw=JSON.stringify(value);if(raw.length>16000)throw Error('Qaralama çox böyükdür.');
   const old=manifest(await storage.getItemAsync(key)),version=Date.now().toString(36)+Math.random().toString(36).slice(2,8),chunks=raw.match(/[\s\S]{1,400}/g)??[];
   const next={version,count:chunks.length,at:Date.now()};
   const results=await Promise.allSettled(chunks.map((v,i)=>storage.setItemAsync(key+'.'+version+'.'+i,v)));
   if(results.some(v=>v.status==='rejected')){await cleanup(next);throw Error('Qaralama saxlanmadı.');}
   try{await storage.setItemAsync(key,JSON.stringify(next));}catch(error){await cleanup(next);throw error;}
   await cleanup(old);
  });writes=task;return task;
 };
 return{read,write,clear};
}