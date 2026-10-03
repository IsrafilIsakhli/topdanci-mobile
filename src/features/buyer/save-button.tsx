import { Alert, Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import type { Product, Store } from '../../api/types';
import { useColors } from '../../theme/colors';
import { useLibrary } from './library';
export function SaveButton({ product, store }: { product?: Product; store?: Store }) {
  const c = useColors(); const { state, actions } = useLibrary();
  const selected = product ? state.products.some((item) => item.id === product.id) : state.stores.some((item) => item.id === store?.id);
  return <Pressable accessibilityRole="button" accessibilityLabel={(product ? 'Məhsulu' : 'Mağazanı') + (selected ? ' seçilmişlərdən çıxar' : ' seçilmişlərə əlavə et')}
    accessibilityState={{ selected, disabled: !state.ready }} disabled={!state.ready} onPress={(event) => { event.stopPropagation(); const result = product ? actions.toggleProduct(product) : store ? actions.toggleStore(store) : undefined; void result?.then(() => { const error = actions.snapshot().error; if (error) Alert.alert('Yadda saxlanmadı', error); }); }}
    style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .7 : 1, borderWidth: 1, borderColor: c.line })}>
    <Heart size={20} color={selected ? c.brand : c.muted} fill={selected ? c.brand : 'transparent'} />
  </Pressable>;
}
