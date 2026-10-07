import { useCallback,useEffect,useMemo,useRef,useState,type Dispatch,type SetStateAction } from 'react';
import { Alert,AppState,Pressable,Text,View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { FileCheck2,RotateCcw } from 'lucide-react-native';
import { useSession } from '../auth/use-session';
import { DEMO_CATALOG } from '../../api/config';
import { useColors } from '../../theme/colors';
import { draftStorage } from './draft-storage';
export function useDraft<T extends Record<string,unknown>>(name:string,value:T,setValue:Dispatch<SetStateAction<T>>,initial:T){
 const {user}=useSession(),navigation=useNavigation();
 const key=('draft.v2.'+(DEMO_CATALOG?'demo.':'live.')+(user?.id??'guest')+'.'+name).replace(/[^a-zA-Z0-9._-]/g,'_');
 const storage=useMemo(()=>draftStorage(SecureStore,key),[key]);
 const [baseline]=useState(initial),[status,setStatus]=useState({key,ready:false,message:'',done:false});
 const current=useRef({key,value}),setter=useRef(setValue),allow=useRef(false);
 useEffect(()=>{current.current={key,value};setter.current=setValue;},[key,value,setValue]);
 const ready=status.key===key&&status.ready,done=status.key===key&&status.done,message=status.key===key?status.message:'';
 const dirty=JSON.stringify(value)!==JSON.stringify(baseline);
 useEffect(()=>{
  let disposed=false;allow.current=false;
  void storage.read().then(raw=>{
   if(disposed)return;
   const restored={...baseline};
   if(raw){
    const fields=Object.keys(restored).length?Object.keys(restored):Object.keys(raw).filter(field=>['storeId','categoryId','title','description','priceType','price','unit','minOrder','stockStatus'].includes(field));
    for(const field of fields)if(typeof raw[field]===typeof restored[field]||(restored[field]===undefined&&typeof raw[field]==='string'))restored[field as keyof T]=raw[field] as T[keyof T];
   }
   setter.current(restored);setStatus({key,ready:true,done:false,message:raw?'Qaralamanız bərpa edildi':''});
  }).catch(()=>{if(!disposed)setStatus({key,ready:true,done:false,message:'Qaralama oxunmadı. Yazdıqlarınız formadadır.'});});
  return()=>{disposed=true;};
 },[storage,key,baseline]);
 const flush=useCallback(async()=>{
  if(!ready||done||allow.current||current.current.key!==key)return;
  await storage.write(current.current.value);
  if(current.current.key===key)setStatus(s=>({...s,message:'Qaralama cihazda saxlanıldı'}));
 },[ready,done,storage,key]);
 useEffect(()=>{
  if(!ready||done||!dirty)return;
  const timer=setTimeout(()=>{void flush().catch(()=>setStatus(s=>({...s,message:'Qaralama saxlanmadı. Səhifəni açıq saxlayın.'})));},650);
  return()=>clearTimeout(timer);
 },[value,ready,done,dirty,flush]);
 useEffect(()=>{
  const subscription=AppState.addEventListener('change',state=>{if(state!=='active')void flush().catch(()=>undefined);});
  return()=>{subscription.remove();};
 },[flush]);
 const clear=async()=>{allow.current=true;await storage.clear();setStatus(s=>({...s,done:true,message:''}));};
 usePreventRemove(ready&&dirty&&!done,({data})=>{
  if(allow.current){navigation.dispatch(data.action);return;}
  Alert.alert('Yazdıqlarınız qaralamada qalsın?','Göndərilməmiş məlumatlara sonra qayıda bilərsiniz.',[
   {text:'Davam et',style:'cancel'},
   {text:'Sil və çıx',style:'destructive',onPress:()=>{void clear().then(()=>navigation.dispatch(data.action)).catch(()=>{allow.current=false;Alert.alert('Silinmədi','Qaralama silinmədi. Yenidən yoxlayın.');});}},
   {text:'Saxla və çıx',onPress:()=>{void flush().then(()=>{allow.current=true;navigation.dispatch(data.action);}).catch(()=>Alert.alert('Saxlanmadı','Qaralama saxlanmadı. Səhifəni açıq saxlayın.'));}},
  ]);
 });
 const reset=()=>Alert.alert('Qaralamanı təmizlə?','Formadakı yazdıqlarınız silinəcək.',[{text:'İmtina',style:'cancel'},{text:'Təmizlə',style:'destructive',onPress:()=>{void storage.clear().then(()=>{setValue({...baseline});setStatus(s=>({...s,message:''}));}).catch(()=>setStatus(s=>({...s,message:'Qaralama təmizlənmədi.'})));}}]);
 const rearm=()=>{allow.current=false;setStatus(s=>({...s,done:false}));};
 return{ready,message,clear,reset,flush,rearm};
}
export function DraftNote({draft}:{draft:{message:string;reset:()=>void}}){
 const c=useColors();if(!draft.message)return null;
 return <View style={{borderRadius:14,backgroundColor:c.brandSoft,paddingLeft:12,flexDirection:'row',gap:8,alignItems:'center'}}><FileCheck2 size={18} color={c.brand}/><Text accessibilityLiveRegion="polite" style={{flex:1,color:c.brand,fontSize:12,lineHeight:18}}>{draft.message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Qaralamanı təmizlə" onPress={draft.reset} style={{minHeight:44,minWidth:44,alignItems:'center',justifyContent:'center'}}><RotateCcw size={17} color={c.brand}/></Pressable></View>;
}