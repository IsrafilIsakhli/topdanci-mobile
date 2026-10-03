import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import { PublicPage, IntroCard } from '../../../components/public-page';
import { FormButton, FormInput, FormNote } from '../../../components/form-ui';
import { DEMO_CATALOG } from '../../../api/config';
import { useColors } from '../../../theme/colors';
import { useLibrary } from '../../../features/buyer/library';
import { getRequest, listRequests, ownRequestIds } from '../../../features/buyer/requests';
import { RequestCard } from '../../../features/buyer/request-card';
export default function Requests(){
 const c=useColors(),router=useRouter(),{scope}=useLibrary();
 const [tab,setTab]=useState<'all'|'mine'>('all'),[text,setText]=useState(''),[q,setQ]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setQ(text.trim()),250);return()=>clearTimeout(timer);},[text]);
 const query=useInfiniteQuery({queryKey:['requests',q],initialPageParam:'',queryFn:({pageParam})=>listRequests({q,cursor:pageParam}),getNextPageParam:p=>p.meta?.nextCursor??undefined});
 const own=useQuery({queryKey:['my-requests',scope],queryFn:async()=>Promise.all((await ownRequestIds()).map(async id=>(await getRequest(id)).data)),enabled:tab==='mine'});
 const items=tab==='mine'?own.data??[]:query.data?.pages.flatMap(p=>p.data)??[];const active=tab==='mine'?own:query;
 return <PublicPage title="Axtardığım məhsul" back>
 <IntroCard eyebrow="ALICI TƏLƏBLƏRİ" title="Məhsulu axtarmaqla vaxt itirməyin" text="Nə lazım olduğunu yazın. Uyğun satıcılar mağazalarının təklifini göndərsin." icon={<ClipboardList color="#fff" size={23}/>}/>
 {DEMO_CATALOG&&<FormNote>Nümunə tələb taxtasıdır. Buradakı elan və təkliflər yalnız bu cihazda sınaq üçün saxlanır.</FormNote>}
 <FormButton title="Yeni tələb yerləşdir" onPress={()=>router.push('/requests/new')}/>
 <View style={{flexDirection:'row',gap:8}}>{([{value:'all',label:'Bütün tələblər'},{value:'mine',label:'Mənim tələblərim'}] as const).map(t=><Pressable key={t.value} accessibilityRole="button" accessibilityState={{selected:tab===t.value}} onPress={()=>setTab(t.value)} style={{flex:1,minHeight:46,borderRadius:13,backgroundColor:tab===t.value?c.brand:c.surface,borderWidth:1,borderColor:c.line,justifyContent:'center',alignItems:'center'}}><Text style={{color:tab===t.value?'#fff':c.ink,fontWeight:'700',fontSize:12}}>{t.label}</Text></Pressable>)}</View>
 {tab==='all'&&<><FormInput label="Tələb axtar" placeholder="Məhsulun adı" value={text} onChangeText={setText} maxLength={120} returnKeyType="search" onSubmitEditing={()=>setQ(text.trim())}/></>}
 {tab==='mine'&&<Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Bu hesab və cihazdan yerləşdirdiyiniz tələblər. Təklifləri tələbin içində görə bilərsiniz.</Text>}
 {active.isPending?<ActivityIndicator color={c.brand}/>:active.error?<><FormNote error>{active.error.message}</FormNote><FormButton secondary title="Yenidən yoxla" onPress={()=>void active.refetch()}/></>:!items.length?<FormNote>{tab==='mine'?'Hələ tələb yerləşdirməmisiniz.':'Uyğun tələb yoxdur. Başqa sözlə axtarın.'}</FormNote>:items.map(item=><RequestCard key={item.id} item={item}/>)}
 {tab==='all'&&query.hasNextPage&&<FormButton secondary busy={query.isFetchingNextPage} title={query.isFetchNextPageError?'Yenidən yoxla':'Daha çox tələb'} onPress={()=>void query.fetchNextPage()}/>}
 </PublicPage>;
}