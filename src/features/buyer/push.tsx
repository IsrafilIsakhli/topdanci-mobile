import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../api/client';
import { DEMO_CATALOG } from '../../api/config';
import { getAuthSnapshot } from '../../api/auth-store';
import { useSession } from '../auth/use-session';
import { FormButton, FormNote, FormSection } from '../../components/form-ui';
import { notificationRoute } from './notification-route';
import { flushPushLogout, pushTokenKey } from './push-storage';
const projectId=Constants.expoConfig?.extra?.eas?.projectId as string|undefined;
const preferenceKey=(id:string)=>'push-opt-in.'+id;
async function notifications(){return import('expo-notifications');}
async function register(userId:string){
 if(!projectId)throw new Error('Push xidməti hələ qurulmayıb.');
 if(!await flushPushLogout())throw new Error('Əvvəlki çıxış sorğusu göndərilmədi. İnterneti yoxlayıb yenidən cəhd edin.');
 const n=await notifications();if(Platform.OS==='android')await n.setNotificationChannelAsync('updates',{name:'Hesab yenilikləri',importance:n.AndroidImportance.DEFAULT});
 const permission=await n.getPermissionsAsync();if(permission.status!=='granted')throw new Error('Bildiriş icazəsi verilməyib.');
 const token=(await n.getExpoPushTokenAsync({projectId})).data;
 if(getAuthSnapshot()?.id!==userId)return;
 await api.post('/notifications/push/register',{token,platform:Platform.OS});
 if(getAuthSnapshot()?.id!==userId)return;
 await SecureStore.setItemAsync(pushTokenKey,token);return token;
}
export function PushBridge(){
 const {user}=useSession(),router=useRouter(),qc=useQueryClient(),last=useRef('');
 useEffect(()=>{
 if(DEMO_CATALOG)return;
 void flushPushLogout();
 const foreground=AppState.addEventListener('change',state=>{if(state==='active'){void flushPushLogout();void qc.invalidateQueries({queryKey:['notifications']});}});
 return()=>foreground.remove();
 },[qc]);
 useEffect(()=>{
 if(DEMO_CATALOG||!user||!projectId)return;
 let disposed=false;const subscriptions:{remove:()=>void}[]=[];
 void(async()=>{
 const n=await notifications();if(disposed)return;
 n.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:!!getAuthSnapshot(),shouldShowList:!!getAuthSnapshot(),shouldPlaySound:false,shouldSetBadge:false})});
 const handle=(response:import('expo-notifications').NotificationResponse)=>{
 if(disposed||getAuthSnapshot()?.id!==user.id)return;
 const key=response.notification.request.identifier;if(last.current===key)return;last.current=key;
 const data=response.notification.request.content.data ?? {};
 if(data.userId!==user.id){void n.clearLastNotificationResponseAsync();return;}const route=notificationRoute(data.href,user.role);
 if(typeof data.notificationId==='string')void api.patch('/notifications/'+encodeURIComponent(data.notificationId)+'/read',{}).catch(()=>undefined);
 void qc.invalidateQueries({queryKey:['notifications']});router.push((route??'/notifications') as never);
 void n.clearLastNotificationResponseAsync();
 };
 subscriptions.push(n.addNotificationResponseReceivedListener(handle),n.addNotificationReceivedListener(()=>{void qc.invalidateQueries({queryKey:['notifications']});}));
 const initial=await n.getLastNotificationResponseAsync();if(initial)handle(initial);
 if(await SecureStore.getItemAsync(preferenceKey(user.id))==='true'&&!disposed)await register(user.id);
 })().catch(()=>undefined);
 return()=>{disposed=true;subscriptions.forEach(s=>s.remove());};
 },[user,qc,router]);return null;
}
export function PushSettings(){
 const {user}=useSession(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[enabled,setEnabled]=useState(false);const lock=useRef(false);
 const status=useQuery({queryKey:['push-status',user?.id],enabled:!!user&&!DEMO_CATALOG&&!!projectId,queryFn:()=>api.get<{configured:boolean;devices:number}>('/notifications/push/status')});
 useEffect(()=>{if(user)void SecureStore.getItemAsync(preferenceKey(user.id)).then(v=>setEnabled(v==='true'));},[user]);
 async function toggle(){
 if(!user||lock.current)return;lock.current=true;setBusy(true);setMessage('');
 try{
 if(enabled){const token=await SecureStore.getItemAsync(pushTokenKey);if(token)await api.post('/notifications/push/unregister',{token});await SecureStore.deleteItemAsync(pushTokenKey);await SecureStore.setItemAsync(preferenceKey(user.id),'false');setEnabled(false);setMessage('Bu cihaz üçün push bildirişləri söndürüldü.');}
 else{const n=await notifications();if(Platform.OS==='android')await n.setNotificationChannelAsync('updates',{name:'Hesab yenilikləri',importance:n.AndroidImportance.DEFAULT});const p=await n.requestPermissionsAsync();if(p.status!=='granted'){setMessage('İcazə verilmədi. Telefon ayarlarında bildirişləri aça bilərsiniz.');return;}await register(user.id);await SecureStore.setItemAsync(preferenceKey(user.id),'true');setEnabled(true);setMessage('Bu cihaz hesab bildirişləri üçün qeydiyyata alındı.');}
 await status.refetch();
 }catch(e){setMessage(e instanceof Error?e.message:'Bildiriş ayarı dəyişmədi.');}finally{lock.current=false;setBusy(false);}
 }
 const available=!!user&&!DEMO_CATALOG&&!!projectId&&status.data?.data.configured===true;
 return <FormSection title="Telefon bildirişləri" subtitle="Məhsul yoxlaması, müraciət nəticəsi və tələb təklifləri">
 {DEMO_CATALOG||!projectId?<FormNote>Push xidməti hələ qoşulmayıb. Tətbiq daxilindəki bildirişlər ayrıca işləyir.</FormNote>:!user?<FormNote>Bildirişləri açmaq üçün hesabınıza daxil olun.</FormNote>:status.isPending?<FormNote>Xidmət yoxlanılır…</FormNote>:status.error?<><FormNote error>{status.error.message}</FormNote><FormButton secondary title="Yenidən yoxla" onPress={()=>void status.refetch()}/></>:!status.data?.data.configured?<FormNote>Serverdə push xidməti hələ aktiv deyil.</FormNote>:<FormButton secondary title={enabled?'Bu cihazda bildirişləri söndür':'Bu cihazda bildirişləri aç'} busy={busy} disabled={!available} onPress={()=>void toggle()}/>}
 {!!message&&<><FormNote>{message}</FormNote><FormButton secondary title="Telefon ayarlarına keç" onPress={()=>void Linking.openSettings()}/></>}
 </FormSection>;
}