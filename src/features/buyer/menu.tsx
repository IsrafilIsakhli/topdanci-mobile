import { useRouter } from 'expo-router';
import { ClipboardList, Heart, History, Store } from 'lucide-react-native';
import { View } from 'react-native';
import { MenuItem } from '../../components/form-ui';
import { useColors } from '../../theme/colors';
import { useLibrary } from './library';
export function BuyerMenu() {
  const router = useRouter(); const c = useColors(); const { state } = useLibrary();
  return <View style={{ gap: 10 }}>
    <MenuItem icon={<Heart size={21} color={c.brand} />} title="Seçilmiş məhsullar" text={state.products.length + ' məhsul · Bu cihazda saxlanır'} onPress={() => router.push('/saved')} />
    <MenuItem icon={<Store size={21} color={c.brand} />} title="Seçilmiş mağazalar" text={state.stores.length + ' mağaza · Təchizatçılara rahat qayıdın'} onPress={() => router.push('/saved?tab=stores' as never)} />
    <MenuItem icon={<History size={21} color={c.brand} />} title="Son baxılanlar" text="Açdığınız məhsul və mağazalar" onPress={() => router.push('/saved?tab=recent' as never)} />
    <MenuItem icon={<ClipboardList size={21} color={c.brand} />} title="Axtardığım məhsul" text="Tələb yerləşdirin və satıcı təkliflərini görün" onPress={() => router.push('/requests' as never)} />
  </View>;
}
