import { useRef,useState } from 'react';
import { Keyboard,Pressable,Text,View } from 'react-native';
import { Flag,CheckCircle2 } from 'lucide-react-native';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { api } from '../../api/client';
import { DEMO_CATALOG } from '../../api/config';
import { PublicPage } from '../../components/public-page';
import { FormButton,FormInput,FormNote,FormSection } from '../../components/form-ui';
import { useColors } from '../../theme/colors';
import { DraftNote,useDraft } from '../../features/forms/use-draft';
const reasons=[{value:'wrong_information',label:'Məlumat yanlışdır'},{value:'unavailable',label:'Artıq əlçatan deyil'},{value:'suspicious',label:'Şübhəli görünür'},{value:'other',label:'Digər problem'}];
const empty={reason:'wrong_information',message:''};
export default function Report(){
 const params=useLocalSearchParams<{kind:string;id:string;name?:string}>(),router=useRouter(),c=useColors();
 const kind=params.kind==='store'?'store':'product',id=typeof params.id==='string'?params.id:'',name=typeof params.name==='string'?params.name.slice(0,160):'';
 const [form,setForm]=useState({...empty}),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 const draft=useDraft('report.'+kind+'.'+id,form,setForm,{...empty});
 async function submit(){
  if(lock.current)return;Keyboard.dismiss();setError('');
  if(!id||form.message.trim().length<10){setError('Problemi ən az 10 simvolla izah edin.');return;}
  if(DEMO_CATALOG){setError('Nümunə rejimində şikayət göndərilmir. Yazdıqlarınız qaralamada saxlanır.');return;}
  lock.current=true;setBusy(true);
  try{await api.post('/support/reports',{kind,targetId:id,reason:form.reason,message:form.message.trim()});setSent(true);await draft.clear().catch(()=>undefined);}
  catch(e){setError(e instanceof Error?e.message:'Şikayət göndərilmədi. Yazdıqlarınız saxlanır.');}finally{setBusy(false);lock.current=false;}
 }
 return <PublicPage title="Problem bildir" back scrollKey={sent?'sent':'form'}>
 {sent?<FormSection title="Məlumatınız qeydə alındı"><CheckCircle2 size={38} color={c.brand}/><Text style={{color:c.muted,fontSize:13,lineHeight:21}}>Komandamız şikayəti yoxlayacaq. Elanın görünməsi yoxlamanın nəticəsindən asılıdır.</Text><FormButton title="Kataloqa qayıt" onPress={()=>router.replace(kind==='product'?'/products':'/stores')}/></FormSection>:<>
 <View style={{padding:18,borderRadius:20,backgroundColor:c.surface,borderWidth:1,borderColor:c.line,gap:9}}><Flag size={24} color={c.brand}/><Text style={{color:c.ink,fontSize:19,fontWeight:'800'}}>Kataloqu birlikdə yaxşılaşdıraq</Text><Text style={{color:c.muted,fontSize:13,lineHeight:20}}>{name||'Seçilmiş elan'} · {kind==='product'?'Məhsul':'Mağaza'}</Text></View>
 <DraftNote draft={draft}/>
 <FormSection title="Nə baş verib?">
 <View style={{gap:8}}>{reasons.map(v=><Pressable key={v.value} accessibilityRole="radio" accessibilityState={{checked:form.reason===v.value}} disabled={busy} onPress={()=>setForm(s=>({...s,reason:v.value}))} style={({pressed})=>({minHeight:48,borderRadius:13,borderWidth:1,borderColor:form.reason===v.value?c.brand:c.line,backgroundColor:form.reason===v.value?c.brandSoft:c.background,padding:13,flexDirection:'row',alignItems:'center',gap:10,opacity:pressed?.75:1})}><View style={{width:17,height:17,borderRadius:9,borderWidth:form.reason===v.value?5:1,borderColor:form.reason===v.value?c.brand:c.muted}}/><Text style={{color:c.ink,fontSize:13,fontWeight:'600',flex:1}}>{v.label}</Text></Pressable>)}</View>
 <FormInput label="Qısa izah" value={form.message} onChangeText={v=>{setForm(s=>({...s,message:v}));setError('');}} placeholder="Hansı məlumat və ya davranış sizi narahat etdi?" multiline maxLength={1200} hint={form.message.length+'/1200 simvol'} editable={!busy&&draft.ready} autoCapitalize="sentences"/>
 <FormNote>Şifrə, bank məlumatı və digər məxfi məlumatları yazmayın.</FormNote>
 {!!error&&<FormNote error>{error}</FormNote>}
 <FormButton title={DEMO_CATALOG?'Test formasını yoxla':'Şikayəti göndər'} onPress={()=>void submit()} busy={busy} disabled={!draft.ready}/>
 </FormSection></>}
 </PublicPage>;
}