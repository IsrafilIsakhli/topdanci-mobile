import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useSession } from '../../features/auth/use-session';
import { PublicPage } from '../../components/public-page';
import { FormButton, FormNote } from '../../components/form-ui';
import { useColors } from '../../theme/colors';
import { PushSettings } from '../../features/buyer/push';
import { notificationRoute } from '../../features/buyer/notification-route';
import { DEMO_CATALOG } from '../../api/config';
type Notification={id:string;type?:string;title:string;message:string;href?:string;readAt?:string|null;createdAt:string};
export default function Notifications(){
 const {user}=useSession(),router=useRouter(),qc=useQueryClient(),c=useColors();const [unread,setUnread]=useState(false),[busy,setBusy]=useState(false);const lock=useRef(false);
 const query=useInfiniteQuery({queryKey:['notifications',user?.id,unread],enabled:!!user,initialPageParam:'',queryFn:({pageParam})=>api.get<Notification[]>('/notifications',{unreadOnly:unread,cursor:pageParam,limit:20}),getNextPageParam:p=>p.meta?.nextCursor??undefined});
 const seen=new Set<string>();const items=(query.data?.pages.flatMap(p=>p.data)??[]).filter(n=>!seen.has(n.id)&&!!seen.add(n.id));
 async function read(item:Notification){
 if(lock.current)return;lock.current=true;
 try{if(!item.readAt){await api.patch('/notifications/'+encodeURIComponent(item.id)+'/read',{});await qc.invalidateQueries({queryKey:['notifications']});}const route=notificationRoute(item.href,user?.role);if(route)router.push(route as never);}
 catch(e){Alert.alert('Bildiriş açılmadı',e instanceof Error?e.message:'Yenidən yoxlayın.');}finally{lock.current=false;}
 }
 async function allRead(){
 if(lock.current)return;lock.current=true;setBusy(true);
 try{await api.post('/notifications/read-all',{});await qc.invalidateQueries({queryKey:['notifications']});}catch(e){Alert.alert('Oxundu kimi qeyd edilmədi',e instanceof Error?e.message:'Yenidən yoxlayın.');}finally{setBusy(false);lock.current=false;}
 }
 return <PublicPage title="Bildirişlər" back><PushSettings/>
 {DEMO_CATALOG&&<FormNote>Nümunə hesabdır. Real bildirişlər canlı hesab hadisələrindən yaranır.</FormNote>}
 {!user?<><FormNote>Hesab yeniliklərini görmək üçün daxil olun.</FormNote><FormButton title="Daxil ol" onPress={()=>router.push('/login')}/></>:<>
 <View style={{flexDirection:'row',gap:8}}>{[false,true].map(v=><Pressable key={String(v)} accessibilityRole="button" accessibilityState={{selected:unread===v}} onPress={()=>setUnread(v)} style={{flex:1,minHeight:44,borderRadius:12,backgroundColor:unread===v?c.brand:c.surface,alignItems:'center',justifyContent:'center'}}><Text style={{color:unread===v?'#fff':c.ink,fontSize:12,fontWeight:'700'}}>{v?'Oxunmamışlar':'Hamısı'}</Text></Pressable>)}</View>
 {query.isPending?<ActivityIndicator color={c.brand}/>:query.error&&!items.length?<><FormNote error>{query.error.message}</FormNote><FormButton secondary title="Yenidən yoxla" onPress={()=>void query.refetch()}/></>:!items.length?<View style={{paddingVertical:26,alignItems:'center',gap:12}}><Bell size={32} color={c.brand}/><Text style={{color:c.ink,fontSize:17,fontWeight:'800'}}>{unread?'Hamısı oxunub':'Hələ bildiriş yoxdur'}</Text><Text style={{color:c.muted,fontSize:12,textAlign:'center'}}>Hesab yenilikləri burada görünəcək.</Text></View>:<>
 <View style={{flexDirection:'row',alignItems:'center',gap:8}}><CheckCheck color={c.brand} size={18}/><Text style={{color:c.muted,fontSize:12,flex:1}}>{query.data?.pages[0]?.meta?.unreadCount??items.filter(n=>!n.readAt).length} oxunmamış</Text><FormButton secondary title="Hamısını oxundu et" busy={busy} onPress={()=>void allRead()}/></View>
 {items.map(n=><Pressable key={n.id} accessibilityRole="button" accessibilityLabel={n.title+(n.readAt?', oxunub':', oxunmayıb')} onPress={()=>void read(n)} style={{backgroundColor:n.readAt?c.surface:c.brandSoft,borderWidth:1,borderColor:c.line,borderRadius:18,padding:15,gap:8}}>
 <View style={{flexDirection:'row',gap:9,alignItems:'center'}}><Bell size={19} color={c.brand}/><Text style={{color:c.ink,fontSize:14,fontWeight:'800',flex:1}}>{n.title}</Text>{!n.readAt&&<View style={{width:7,height:7,borderRadius:4,backgroundColor:c.brand}}/>}</View>
 <Text style={{color:c.ink,fontSize:12,lineHeight:19}}>{n.message}</Text><View style={{flexDirection:'row',alignItems:'center'}}><Text style={{flex:1,color:c.muted,fontSize:10}}>{new Date(n.createdAt).toLocaleString('az')}</Text>{notificationRoute(n.href,user.role)&&<><Text style={{color:c.brand,fontWeight:'700',fontSize:11}}>Ətraflı bax</Text><ChevronRight size={15} color={c.brand}/></>}</View>
 </Pressable>)}
 {query.hasNextPage&&<FormButton secondary busy={query.isFetchingNextPage} title={query.isFetchNextPageError?'Yenidən yoxla':'Daha çox bildiriş'} onPress={()=>void query.fetchNextPage()}/>}
 </>}
 <FormButton secondary title="Bildirişləri yenilə" busy={query.isRefetching} onPress={()=>void query.refetch()}/>
 </>}
 </PublicPage>;
}