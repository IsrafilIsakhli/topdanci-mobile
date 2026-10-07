import * as Linking from 'expo-linking';
import { DEMO_CATALOG } from '../../api/config';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { Share2, Flag, CloudDownload } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColors } from '../../theme/colors';
import { sharedCatalogUrl } from './share-links';
export function DetailActions({kind,id,slug,name}:{kind:'product'|'store';id:string;slug:string;name:string}) {
 const c=useColors(),router=useRouter();
 const share=async()=>{try{await Share.share({title:name,message:name+' · TopdanBazar\n'+(DEMO_CATALOG?Linking.createURL((kind==='product'?'/product/':'/store/')+encodeURIComponent(slug)):sharedCatalogUrl(kind,slug))});}catch{Alert.alert('Paylaşım açılmadı','Yenidən cəhd edin.');}};
 return <View style={{flexDirection:'row',gap:10}}>
  {[{label:'Paylaş',Icon:Share2,press:()=>void share()},{label:'Problem bildir',Icon:Flag,press:()=>router.push({pathname:'/report',params:{kind,id,name}} as never)}].map(({label,Icon,press})=><Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={press} style={({pressed})=>({flex:1,minHeight:46,borderRadius:14,borderWidth:1,borderColor:c.line,backgroundColor:c.surface,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',opacity:pressed?.7:1})}><Icon size={17} color={c.brand}/><Text style={{color:c.brand,fontSize:12,fontWeight:'700'}}>{label}</Text></Pressable>)}
 </View>;
}
export function CachedNotice({at}:{at?:string}) {
 const c=useColors();if(!at)return null;
 return <View style={{padding:12,borderRadius:14,backgroundColor:'#fff3d9',flexDirection:'row',gap:8}}><CloudDownload size={17} color="#896016"/><Text style={{flex:1,color:c.ink,fontSize:11,lineHeight:17}}>Cihazda saxlanmış məlumat · {new Date(at).toLocaleDateString('az')}. Qiymət və stok dəyişmiş ola bilər.</Text></View>;
}