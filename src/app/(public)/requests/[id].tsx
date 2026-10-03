import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PublicPage } from '../../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../../components/form-ui';
import { api } from '../../../api/client';
import type { Store } from '../../../api/types';
import { DEMO_CATALOG } from '../../../api/config';
import { useSession } from '../../../features/auth/use-session';
import { useLibrary } from '../../../features/buyer/library';
import { closeRequest, getRequest, requestToken, sendOffer } from '../../../features/buyer/requests';
import { RequestCard } from '../../../features/buyer/request-card';
import { useColors } from '../../../theme/colors';
export default function RequestDetail(){
 const {id,warning}=useLocalSearchParams<{id:string;warning?:string}>(),router=useRouter(),c=useColors(),qc=useQueryClient(),{user}=useSession(),{scope}=useLibrary();
 const token=useQuery({queryKey:['request-token',id,scope],queryFn:()=>requestToken(id)});
 const query=useQuery({queryKey:['request-detail',id,scope,!!token.data],enabled:!!id&&!token.isPending,queryFn:()=>getRequest(id)});
 const stores=useQuery({queryKey:['seller-stores'],enabled:user?.role==='SELLER',queryFn:()=>api.get<Store[]>('/seller/stores')});
 const [selected,setSelected]=useState(''),[message,setMessage]=useState(''),[price,setPrice]=useState(''),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState(''),[failed,setFailed]=useState(false);const lock=useRef(false);
 const item=query.data?.data,store=stores.data?.data.find(s=>s.id===selected)??stores.data?.data[0];
 const active=item?.status==='ACTIVE'&&new Date(item.expiresAt)>new Date();
 async function refresh(){await Promise.all([qc.invalidateQueries({queryKey:['request-detail',id]}),qc.invalidateQueries({queryKey:['requests']}),qc.invalidateQueries({queryKey:['my-requests']})]);}
 async function offer(){
 if(lock.current||!store)return;const parsed=price?Number(price.replace(',','.')):undefined;
 if(message.trim().length<10 || (parsed!==undefined&&(!Number.isFinite(parsed)||parsed<0||parsed>1000000000||Math.abs(Math.round(parsed*100)-parsed*100)>0.000001))){setFailed(true);setFeedback('Təklifi ən az 10 simvolla, qiyməti ən çox 2 onluq rəqəmlə yazın.');return;}
 lock.current=true;setBusy(true);setFailed(false);setFeedback('');try{await sendOffer(id,store,parsed,message.trim());setFeedback(DEMO_CATALOG?'Test təklifi bu cihazda saxlanıldı.':'Təklifiniz göndərildi. Eyni mağazadan yeni təklif əvvəlkini yeniləyir.');await refresh();}catch(e){setFailed(true);setFeedback(e instanceof Error?e.message:'Təklif göndərilmədi.');}finally{setBusy(false);lock.current=false;}
 }
 function close(){Alert.alert('Tələbi bağlamaq istəyirsiniz?','Yeni təkliflər qəbul edilməyəcək.',[{text:'İmtina',style:'cancel'},{text:'Bağla',onPress:async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{await closeRequest(id);await refresh();}catch(e){setFailed(true);setFeedback(e instanceof Error?e.message:'Bağlamaq alınmadı.');}finally{lock.current=false;setBusy(false);}}}]);}
 return <PublicPage title="Tələb haqqında" back>
 {!!warning&&<FormNote error>{warning}</FormNote>}
 {DEMO_CATALOG&&<FormNote>Nümunə tələb və təkliflərdir. Real satıcıya göndərilmir.</FormNote>}
 {query.isPending||token.isPending?<ActivityIndicator color={c.brand}/>:query.error?<><FormNote error>{query.error.message}</FormNote><FormButton secondary title="Yenidən yoxla" onPress={()=>void query.refetch()}/></>:item&&<>
 <RequestCard item={item}/>
 {!!item.description&&<FormSection title="Alıcının qeydi"><Text style={{color:c.ink,fontSize:14,lineHeight:22}}>{item.description}</Text></FormSection>}
 <Text style={{color:c.muted,fontSize:12}}>Son tarix: {new Date(item.expiresAt).toLocaleDateString('az')}</Text>
 {token.data?<FormSection title={'Təkliflər · '+(item.offers?.length??0)} subtitle="Bu məlumatlar yalnız tələbin sahibinə görünür.">
 {!item.offers?.length?<FormNote>Hələ təklif yoxdur. Bu səhifəni yeniləyərək yeni təklifləri görə bilərsiniz.</FormNote>:item.offers.map(o=><FormSection key={o.id} title={o.store.name} subtitle={o.store.city}>
 <Text style={{color:c.brand,fontSize:18,fontWeight:'800'}}>{o.price!=null?o.price+' AZN':'Razılaşma yolu ilə'}</Text><Text style={{color:c.ink,lineHeight:21}}>{o.message}</Text><FormButton secondary title="Mağazaya keç və əlaqə saxla" onPress={()=>router.push('/store/'+o.store.slug as never)}/></FormSection>)}
 <FormButton secondary title="Təklifləri yenilə" busy={query.isFetching} onPress={()=>void query.refetch()}/>
 {!!feedback&&<FormNote error={failed}>{feedback}</FormNote>}
 {active&&<FormButton secondary title="Tələbi bağla" disabled={busy} onPress={close}/>}
 </FormSection>:active&&(user?.role==='SELLER'?<FormSection title="Mağazanızdan təklif ver" subtitle="Qiymət miqdar vahidinə aiddir. Eyni mağazadan təklifinizi yeniləyə bilərsiniz.">
 {stores.isPending?<ActivityIndicator/>:stores.error?<FormNote error>{stores.error.message}</FormNote>:!store?<FormNote>Aktiv mağazanız tapılmadı.</FormNote>:<>
 {(stores.data?.data??[]).map(s=><FormButton key={s.id} secondary title={(store.id===s.id?'✓ ':'')+s.name} disabled={busy} onPress={()=>setSelected(s.id)}/>)}
 <FormInput label="Vahid qiyməti (AZN)" optional value={price} onChangeText={setPrice} keyboardType="decimal-pad" maxLength={14} editable={!busy}/>
 <FormInput label="Təklifiniz" placeholder="Stok, ölçü, qiymət şərtləri…" value={message} onChangeText={setMessage} multiline maxLength={1200} editable={!busy}/>
 {!!feedback&&<FormNote error={failed}>{feedback}</FormNote>}
 <FormButton title="Təklifi göndər" busy={busy} onPress={()=>void offer()}/></>}
 </FormSection>:<FormNote>Təklif vermək üçün satıcı hesabına daxil olun.</FormNote>)}
 {!token.data&&!user&&<FormButton secondary title="Satıcı kimi daxil ol" onPress={()=>router.push('/login')}/>}
 </>}

 </PublicPage>;
}