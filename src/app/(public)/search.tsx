import { useState } from 'react';
import { Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PublicPage } from '../../components/public-page';
import { FormButton, FormInput } from '../../components/form-ui';
import { SearchPanel } from '../../features/buyer/search-panel';
import { useLibrary } from '../../features/buyer/library';
export default function SearchScreen(){
 const params=useLocalSearchParams<{q?:string}>(),router=useRouter(),{actions}=useLibrary();const [text,setText]=useState(typeof params.q==='string'?params.q:'');
 function submit(word:string){if(!word.trim())return;void actions.search(word);Keyboard.dismiss();router.push('/products?q='+encodeURIComponent(word.trim()) as never);}
 return <PublicPage title="Axtarış" back><FormInput label="Məhsul, mağaza və kateqoriya" placeholder="Nə axtarırsınız?" value={text} onChangeText={setText} maxLength={120} returnKeyType="search" onSubmitEditing={()=>submit(text)}/><SearchPanel text={text} onSearch={word=>setText(word)}/><FormButton title="Bütün uyğun məhsullara bax" disabled={!text.trim()} onPress={()=>submit(text)}/></PublicPage>;
}