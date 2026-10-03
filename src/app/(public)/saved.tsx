import { ActivityIndicator, Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Heart, History, Package, Store as StoreIcon } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PublicPage, IntroCard } from '../../components/public-page';
import { FormButton, FormNote } from '../../components/form-ui';
import { CatalogProductCard } from '../../features/catalog/catalog-product-card';
import { DirectoryStoreCard } from '../../features/catalog/store-directory';
import { useLibrary } from '../../features/buyer/library';
import { useColors } from '../../theme/colors';
export default function Saved() {
  const params = useLocalSearchParams<{ tab?: string }>(); const router = useRouter(); const c = useColors();
  const tab = params.tab === 'stores' ? 'stores' : params.tab === 'recent' ? 'recent' : 'products';
  const { state, actions } = useLibrary(); const { width, fontScale } = useWindowDimensions();
  const cardWidth = width < 350 || fontScale >= 1.3 ? width - 32 : (width - 42) / 2;
  const count = tab === 'products' ? state.products.length : tab === 'stores' ? state.stores.length : state.recent.length;
  return <PublicPage title={tab === 'recent' ? 'Son baxılanlar' : 'Seçilmişlər'} back>
    <IntroCard eyebrow="SİZİN KATALOQUNUZ" title="Bəyəndikləriniz bir yerdə" text="Məhsul və mağazalar bu cihazda saxlanır. Açarkən ən son məlumatları görəcəksiniz." icon={<Heart color="#fff" size={22} />} />
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {[{ key: 'products', label: 'Məhsullar', Icon: Package }, { key: 'stores', label: 'Mağazalar', Icon: StoreIcon }, { key: 'recent', label: 'Son baxılan', Icon: History }].map(({ key, label, Icon }) =>
        <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => router.setParams({ tab: key })}
          style={{ flex: 1, minHeight: 52, borderRadius: 13, backgroundColor: tab === key ? c.brand : c.surface, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Icon size={17} color={tab === key ? c.surface : c.muted} /><Text style={{ color: tab === key ? c.surface : c.ink, fontSize: 11, fontWeight: '700' }}>{label}</Text>
        </Pressable>)}
    </View>
    {!!state.error && <FormNote error>{state.error}</FormNote>}
    {!state.ready ? <ActivityIndicator color={c.brand} /> : !count ? <View style={{ padding: 24, gap: 14, alignItems: 'center' }}>
      <Heart size={35} color={c.brand} /><Text style={{ color: c.ink, fontSize: 18, fontWeight: '800' }}>{tab === 'recent' ? 'Baxış tarixçəniz boşdur' : 'Hələ seçim yoxdur'}</Text>
      <Text style={{ color: c.muted, textAlign: 'center', fontSize: 13, lineHeight: 20 }}>{tab === 'recent' ? 'Açdığınız məhsul və mağazalar burada görünəcək.' : 'Ürək işarəsinə toxunaraq bəyəndiklərinizi yadda saxlayın.'}</Text>
      <FormButton title="Kataloqu kəşf et" onPress={() => router.push('/products')} />
    </View> : <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1, color: c.muted, fontSize: 12 }}>{count} {tab === 'stores' ? 'mağaza' : tab === 'recent' ? 'baxış' : 'məhsul'}</Text>
        {tab === 'recent' && <Pressable accessibilityRole="button" onPress={() => Alert.alert('Baxış tarixçəsini təmizlə', 'Bu cihazdakı baxış tarixçəsi silinəcək.', [{ text: 'Ləğv et', style: 'cancel' }, { text: 'Təmizlə', style: 'destructive', onPress: () => void actions.clearRecent() }])}
          style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.brand, fontWeight: '700', fontSize: 12 }}>Təmizlə</Text></Pressable>}
      </View>
      {tab === 'products' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{state.products.map((product) => <CatalogProductCard key={product.id} product={product} width={cardWidth} />)}</View>
        : tab === 'stores' ? state.stores.map((store) => <DirectoryStoreCard key={store.id} store={store} />)
          : state.recent.map((entry) => <Pressable key={entry.kind + entry.item.id} accessibilityRole="button"
            onPress={() => router.push(((entry.kind === 'product' ? '/product/' : '/store/') + entry.item.slug) as never)}
            style={{ padding: 15, borderRadius: 17, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, gap: 7 }}>
            <Text style={{ color: c.brand, fontSize: 10, fontWeight: '700' }}>{entry.kind === 'product' ? 'MƏHSUL' : 'MAĞAZA'} · {new Date(entry.at).toLocaleDateString('az')}</Text>
            <Text style={{ color: c.ink, fontSize: 15, fontWeight: '700' }}>{entry.kind === 'product' ? entry.item.title : entry.item.name}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{entry.kind === 'product' ? entry.item.store?.name : entry.item.city} →</Text>
          </Pressable>)}
    </>}
  </PublicPage>;
}
