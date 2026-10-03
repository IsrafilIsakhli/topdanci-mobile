import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { PublicPage } from '../../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../../components/form-ui';
import { api } from '../../../api/client';
import type { Category } from '../../../api/types';
import { DEMO_CATALOG } from '../../../api/config';
import { useColors } from '../../../theme/colors';
import { CategoryPicker } from '../../../features/home/category-picker';
import { createRequest, requestErrors, units } from '../../../features/buyer/requests';
export default function NewRequest(){
 const c=useColors(),router=useRouter(),qc=useQueryClient(),lock=useRef(false);
 const [title,setTitle]=useState(''),[quantity,setQuantity]=useState(''),[unit,setUnit]=useState('ədəd'),[city,setCity]=useState(''),[description,setDescription]=useState(''),[category,setCategory]=useState(''),[picker,setPicker]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const categories=useQuery({queryKey:['categories'],queryFn:()=>api.get<Category[]>('/categories')});
 const chosen=categories.data?.data.find(v=>v.slug===category);
 async function submit(){
 if(lock.current)return;const draft={title:title.trim(),quantity:Number(quantity.replace(',','.')),unit,city:city.trim(),...(category?{category}:{}),...(description.trim()?{description:description.trim()}: {})};const next=requestErrors(draft);setErrors(next);if(Object.keys(next).length)return;
 lock.current=true;setBusy(true);setMessage('');Keyboard.dismiss();
 try{const item=await createRequest(draft);await Promise.all([qc.invalidateQueries({queryKey:['requests']}),qc.invalidateQueries({queryKey:['my-requests']})]);router.replace({pathname:'/requests/'+item.id,params:item.storageWarning?{warning:item.storageWarning}:{}} as never);}catch(e){setMessage(e instanceof Error?e.message:'Tələb göndərilmədi.');}finally{lock.current=false;setBusy(false);}
 }
 return <PublicPage title="Yeni tələb" back>
 <FormNote>{DEMO_CATALOG?'Test tələbi yalnız bu cihazda saxlanacaq.':'Tələb 30 gün aktiv qalır. Təklifləri bu cihazdan görə və tələbi bağlaya bilərsiniz.'}</FormNote>
 <FormSection title="Nə axtarırsınız?" subtitle="Dəqiq məlumat satıcının uyğun təklif verməsinə kömək edir.">
 <FormInput label="Məhsulun adı" placeholder="Məsələn, uşaq məktəb ayaqqabısı" value={title} onChangeText={setTitle} error={errors.title} maxLength={160} editable={!busy}/>
 <FormInput label="Miqdar" placeholder="300" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" error={errors.quantity} maxLength={14} editable={!busy}/>
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{units.map(v=><Pressable key={v} disabled={busy} accessibilityRole="button" accessibilityLabel={v+' vahidini seç'} accessibilityState={{selected:unit===v}} onPress={()=>setUnit(v)} style={{minHeight:44,paddingHorizontal:15,borderRadius:12,backgroundColor:unit===v?c.brand:c.background,justifyContent:'center'}}><Text style={{color:unit===v?'#fff':c.ink,fontSize:12,fontWeight:'700'}}>{v}</Text></Pressable>)}</View>
 <FormInput label="Şəhər" placeholder="Bakı" value={city} onChangeText={setCity} error={errors.city} maxLength={80} editable={!busy}/>
 <FormButton secondary disabled={busy||!categories.data?.data.length} title={chosen?.name??'Kateqoriya seç'} onPress={()=>setPicker(true)}/>
 {categories.error&&<FormNote error>{categories.error.message}</FormNote>}
 <FormInput label="Əlavə məlumat" optional placeholder="Ölçü, rəng, material və digər tələblər" value={description} onChangeText={setDescription} multiline maxLength={1200} editable={!busy}/>
 <FormNote>Elan mətninə telefon, e-poçt və şəxsi məlumat yazmayın. Satıcı təkliflərini burada görə bilərsiniz.</FormNote>
 {!!message&&<FormNote error>{message}</FormNote>}
 <FormButton title="Tələbi yerləşdir" busy={busy} onPress={()=>void submit()}/>
 </FormSection>
 {picker&&<CategoryPicker visible selectionOnly initialCategoryId={chosen?.id} categories={categories.data?.data??[]} onClose={()=>setPicker(false)} onSelect={(v)=>{setCategory(v??'');setPicker(false);}}/>}
 </PublicPage>;
}