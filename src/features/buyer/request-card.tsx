import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, MapPin, MessageSquare } from 'lucide-react-native';
import { useColors } from '../../theme/colors';
import type { BuyerRequest } from './requests';
export function RequestCard({item}:{item:BuyerRequest}){
 const c=useColors(),router=useRouter();return <Pressable accessibilityRole="button" accessibilityLabel={item.title+' tələbinə bax'} onPress={()=>router.push('/requests/'+encodeURIComponent(item.id) as never)}
 style={({pressed})=>({padding:16,gap:12,borderRadius:20,borderWidth:1,borderColor:c.line,backgroundColor:pressed?c.brandSoft:c.surface})}>
 <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{backgroundColor:c.brandSoft,paddingHorizontal:10,paddingVertical:6,borderRadius:9}}><Text style={{color:c.brand,fontWeight:'800',fontSize:12}}>{item.quantity} {item.unit}</Text></View><Text style={{color:c.muted,fontSize:11,flex:1,textAlign:'right'}}>{item.status==='CLOSED'?'Bağlanıb':new Date(item.createdAt).toLocaleDateString('az')}</Text><ArrowUpRight color={c.brand} size={17}/></View>
 <Text style={{color:c.ink,fontWeight:'800',fontSize:16,lineHeight:22}} numberOfLines={2}>{item.title}</Text>
 <View style={{flexDirection:'row',gap:6,alignItems:'center'}}><MapPin size={14} color={c.muted}/><Text style={{color:c.muted,fontSize:12,flex:1}}>{item.city}</Text><MessageSquare size={14} color={c.brand}/><Text style={{color:c.brand,fontWeight:'700',fontSize:12}}>{item._count.offers} təklif</Text></View></Pressable>;
}