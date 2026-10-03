import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../api/config';
export const pushTokenKey='topdanbazar.push-token.v1';
const pendingKey='topdanbazar.push-logout.v1';
let flushing:Promise<boolean>|undefined;
export async function queuePushLogout(refreshToken:string|null){
 const token=await SecureStore.getItemAsync(pushTokenKey);
 if(token&&refreshToken)await SecureStore.setItemAsync(pendingKey,JSON.stringify({refreshToken,pushToken:token}));
 await SecureStore.deleteItemAsync(pushTokenKey);
}
export function flushPushLogout():Promise<boolean>{
 if(flushing)return flushing;
 flushing=(async()=>{
  const raw=await SecureStore.getItemAsync(pendingKey);if(!raw)return true;
  try{
   const response=await fetch(API_BASE_URL+'/auth/mobile/logout',{method:'POST',headers:{'content-type':'application/json'},credentials:'omit',body:raw,signal:AbortSignal.timeout(8000)});
   if(response.ok){await SecureStore.deleteItemAsync(pendingKey);return true;}
  }catch{/* İnternet bərpa ediləndə yenidən göndərilir. */}
  return false;
 })().finally(()=>{flushing=undefined;});
 return flushing;
}