import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Clock, LayoutGrid, PackageSearch, Store as StoreIcon, X } from 'lucide-react-native';
import { api } from '../../api/client';
import { useColors } from '../../theme/colors';
import { useLibrary } from './library';
import type { Category } from '../../api/types';
export type SearchResults={products:{id:string;slug:string;title:string;store?:{name:string}}[];stores:{id:string;slug:string;name:string;city?:string}[];categories:Category[]};
export function SearchPanel({text,onSearch,onCategory,maxHeight=340,kind='all'}:{kind?:'all'|'stores';maxHeight?:number;text:string;onSearch:(word:string)=>void;onCategory?:(slug:string)=>void}){
 const c=useColors(),router=useRouter(),{state,actions}=useLibrary();const [debounced,setDebounced]=useState(text.trim());
 useEffect(()=>{const timer=setTimeout(()=>setDebounced(text.trim()),250);return()=>clearTimeout(timer);},[text]);
 const query=useQuery({queryKey:['typed-search',debounced],enabled:debounced.length>=2&&debounced===text.trim(),queryFn:()=>api.get<SearchResults>('/search',{q:debounced}),staleTime:60000});
 const categories=useQuery({queryKey:['categories'],queryFn:()=>api.get<Category[]>('/categories'),staleTime:60000});
 const category=(slug:string)=>onCategory?onCategory(slug):router.push('/products?category='+encodeURIComponent(slug) as never);
 const groups=query.data?.data;const empty=groups&&(kind==='stores'||!groups.products.length)&&!groups.stores.length&&!groups.categories.length;
 const words=text.trim().toLocaleLowerCase('az').split(/\s+/).filter(w=>w.length>=2);
 const roots=categories.data?.data??[];
 const related=roots.filter(v=>words.some(w=>v.name.toLocaleLowerCase('az').includes(w))).slice(0,4);
 const recommended=related.length?related:roots.filter(v=>!v.parentId).slice(0,4);
 function go(href:string){void actions.search(text);router.push(href as never);}
 const row=(key:string,title:string,detail:string,Icon:typeof Clock,press:()=>void)=><Pressable key={key} accessibilityRole="button" onPress={press} style={{minHeight:50,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8}}><Icon color={c.brand} size={18}/><View style={{flex:1,gap:3}}><Text style={{color:c.ink,fontSize:13,fontWeight:'700'}} numberOfLines={2}>{title}</Text><Text style={{color:c.muted,fontSize:10}}>{detail}</Text></View><ArrowUpRight color={c.brand} size={15}/></Pressable>;
 return <View style={{backgroundColor:c.surface,padding:12,borderRadius:16,borderColor:c.line,borderWidth:1,gap:4}}><ScrollView style={{maxHeight}} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
 {text.trim().length<2?<><Text style={{color:c.muted,fontSize:11,fontWeight:'700',paddingBottom:4}}>SON AXTARIŞLAR</Text>{state.searches.length?state.searches.map(word=><View key={word} style={{flexDirection:'row',alignItems:'center'}}><View style={{flex:1}}>{row(word,word,'Yenidən axtar',Clock,()=>onSearch(word))}</View><Pressable accessibilityRole="button" accessibilityLabel={word+' axtarışını sil'} onPress={()=>void actions.removeSearch(word)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><X size={16} color={c.muted}/></Pressable></View>):<Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Məhsul, mağaza və ya kateqoriya adı yazın. Ən az 2 simvol.</Text>}</>:query.isPending||debounced!==text.trim()?<ActivityIndicator color={c.brand}/>:query.error?<Text style={{color:c.danger,fontSize:12}}>{query.error.message}</Text>:groups&&<>
 {kind==='all'&&groups.products.slice(0,4).map(p=>row('p'+p.id,p.title,'Məhsul · '+(p.store?.name??''),PackageSearch,()=>go('/product/'+encodeURIComponent(p.slug))))}
 {groups.stores.slice(0,3).map(s=>row('s'+s.id,s.name,'Mağaza · '+(s.city??''),StoreIcon,()=>go('/store/'+encodeURIComponent(s.slug))))}
 {groups.categories.slice(0,3).map(v=>row('c'+v.id,v.name,'Kateqoriya',LayoutGrid,()=>{void actions.search(text);category(v.slug);} ))}
 {empty&&<><Text style={{color:c.ink,fontWeight:'700',fontSize:13}}>Nəticə tapılmadı</Text><Text style={{color:c.muted,fontSize:12,lineHeight:18}}>{related.length?'Uyğun ola biləcək kateqoriyalara baxın.':'Başqa söz yoxlayın və ya əsas kateqoriyalara baxın.'}</Text>{recommended.map(v=>row(v.id,v.name,'Kateqoriyanı aç',LayoutGrid,()=>category(v.slug)))}</>}
 </>}
 </ScrollView></View>;
}