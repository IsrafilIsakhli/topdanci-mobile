import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { PublicPage, IntroCard } from '../../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../../components/form-ui';
import { DraftNote, useDraft } from '../../../features/forms/use-draft';
import { useSession } from '../../../features/auth/use-session';
import { api } from '../../../api/client';
import type { Category } from '../../../api/types';
import { DEMO_CATALOG } from '../../../api/config';
import { useColors } from '../../../theme/colors';
import { CategoryPicker } from '../../../features/home/category-picker';
import { createRequest, requestErrors, units } from '../../../features/buyer/requests';
const empty = { title:'',quantity:'',unit:'ədəd',city:'',description:'',category:'' };
export default function NewRequest() {
 const c=useColors(),router=useRouter(),qc=useQueryClient(),lock=useRef(false),{user}=useSession();
 const [form,setForm]=useState({...empty}),[picker,setPicker]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const draft=useDraft('buyer-request',form,setForm,{...empty});
 const update=(key:keyof typeof empty)=>(value:string)=>{setForm(s=>({...s,[key]:value}));setErrors(s=>({...s,[key]:''}));};
 const categories=useQuery({queryKey:['categories'],queryFn:()=>api.get<Category[]>('/categories')});
 const chosen=categories.data?.data.find(v=>v.slug===form.category);
 async function submit(){
  if(lock.current)return;
  const payload={title:form.title.trim(),quantity:Number(form.quantity.replace(',','.')),unit:form.unit,city:form.city.trim(),...(form.category?{category:form.category}:{}),...(form.description.trim()?{description:form.description.trim()}:{})};
  const next=requestErrors(payload);setErrors(next);if(Object.keys(next).length)return;
  lock.current=true;setBusy(true);setMessage('');Keyboard.dismiss();
  try {
   const item=await createRequest(payload);
   await draft.clear().catch(()=>undefined);
   await Promise.all([qc.invalidateQueries({queryKey:['requests']}),qc.invalidateQueries({queryKey:['my-requests']})]);
   router.replace({pathname:'/requests/'+item.id,params:item.storageWarning?{warning:item.storageWarning}:{}} as never);
  } catch(e){setMessage(e instanceof Error?e.message:'Tələb göndərilmədi. Yazdıqlarınız saxlanır.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <PublicPage title="Yeni tələb" back>
  <IntroCard eyebrow="SATICILARDAN TƏKLİF ALIN" title="Axtardığınız məhsulu yazın" text="Miqdarı və şəhəri seçin. Uyğun təchizatçılar öz təkliflərini göndərsin." icon={<ClipboardList size={23} color="#fff"/>}/>
  <DraftNote draft={draft}/>
  <FormNote>{DEMO_CATALOG?'Test tələbi yalnız bu cihazda saxlanır.':user?'Tələb 30 gün aktiv qalır. Təklifləriniz hesabınızla digər cihazlarda da görünür.':'Hesabsız tələbin idarəsi bu cihazda saxlanır. Başqa cihazdan baxmaq üçün hesabınıza daxil olun.'}</FormNote>
  <FormSection title="Məhsul və miqdar" subtitle="Dəqiq məlumat daha uyğun təklif almağa kömək edir.">
   <FormInput label="Məhsulun adı" placeholder="Məsələn, uşaq məktəb ayaqqabısı" value={form.title} onChangeText={update('title')} error={errors.title} maxLength={160} editable={!busy&&draft.ready} autoCapitalize="sentences"/>
   <FormInput label="Miqdar" placeholder="300" value={form.quantity} onChangeText={update('quantity')} keyboardType="decimal-pad" error={errors.quantity} maxLength={14} editable={!busy&&draft.ready}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{units.map(v=><Pressable key={v} disabled={busy} accessibilityRole="button" accessibilityLabel={v+' vahidini seç'} accessibilityState={{selected:form.unit===v}} onPress={()=>update('unit')(v)} style={({pressed})=>({minHeight:44,paddingHorizontal:15,borderRadius:12,backgroundColor:form.unit===v?c.brand:c.background,justifyContent:'center',opacity:pressed?.7:1})}><Text style={{color:form.unit===v?'#fff':c.ink,fontSize:12,fontWeight:'700'}}>{v}</Text></Pressable>)}</View>
  </FormSection>
  <FormSection title="Şəhər və əlavə şərtlər">
   <FormInput label="Şəhər" placeholder="Bakı" value={form.city} onChangeText={update('city')} error={errors.city} maxLength={80} editable={!busy&&draft.ready} autoCapitalize="words"/>
   <FormButton secondary disabled={busy||!categories.data?.data.length} title={chosen?.name??'Kateqoriya seç'} onPress={()=>{Keyboard.dismiss();setPicker(true);}}/>
   {categories.error&&<FormNote error>{categories.error.message}</FormNote>}
   <FormInput label="Əlavə məlumat" optional placeholder="Ölçü, rəng, material və digər tələblər…" value={form.description} onChangeText={update('description')} multiline maxLength={1200} editable={!busy&&draft.ready} hint={form.description.length+'/1200 simvol'} autoCapitalize="sentences"/>
   <FormNote>Elan mətninə telefon, e-poçt və şəxsi məlumat yazmayın. Satıcı təkliflərini burada görə bilərsiniz.</FormNote>
   {!!message&&<FormNote error>{message}</FormNote>}
   <FormButton title="Tələbi yerləşdir" busy={busy} disabled={!draft.ready} onPress={()=>void submit()}/>
  </FormSection>
  {picker&&<CategoryPicker visible selectionOnly initialCategoryId={chosen?.id} categories={categories.data?.data??[]} onClose={()=>setPicker(false)} onSelect={v=>{update('category')(v??'');setPicker(false);}}/>}
 </PublicPage>;
}