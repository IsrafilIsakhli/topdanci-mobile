import { SaveButton } from '../buyer/save-button';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, BadgeCheck, Construction, Cpu, Package, Shirt, ShoppingBasket,
  Armchair, Car, Flower2, Baby, Boxes, BriefcaseBusiness, Sprout, Wrench, MapPin } from 'lucide-react-native';
import type { Category, Product, Store } from '../../api/types';
import { ProductImage } from '../catalog/product-image';
import { productPresentation } from '../catalog/product-presentation';
import { useColors } from '../../theme/colors';

export function categoryIcon(category: Category, color: string, size = 22) {
  const key = `${category.slug} ${category.name}`.toLocaleLowerCase('az');
  const Icon = key.includes('geyim') || key.includes('tekstil') ? Shirt
    : key.includes('elektron') ? Cpu
    : key.includes('qida') || key.includes('icki') ? ShoppingBasket
    : key.includes('tikinti') || key.includes('temir') ? Construction
    : key.includes('mebel') || key.includes('meiset') || key.includes('ev-bag') ? Armchair
    : key.includes('avto') ? Car : key.includes('gozellik') ? Flower2
    : key.includes('usaq') ? Baby : key.includes('qablas') ? Boxes
    : key.includes('biznes') ? BriefcaseBusiness : key.includes('kend') ? Sprout
    : key.includes('xidmet') ? Wrench : Package;
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}

export function categoryShortName(category: Category): string {
  const names: Record<string, string> = {
    'geyim-ayaqqabi-ve-tekstil': 'Geyim',
    'elektronika-ve-aksesuarlar': 'Elektronika',
    'qida-ve-icki': 'Qida və içki',
    'tikinti-ve-temir': 'Tikinti',
    'ev-bag-ve-mebel': 'Ev və bağ',
    'meiset-texnikasi': 'Məişət texnikası',
    'avto-neqliyyat-ve-ehtiyat-hisseleri': 'Avto',
    'gozellik-saglamliq-ve-sexsi-qulluq': 'Gözəllik və qulluq',
    'usaq-mehsullari': 'Uşaq məhsulları',
    'qablasdirma-ve-reklam-mehsullari': 'Qablaşdırma',
    'biznes-ve-magaza-avadanligi': 'Biznes avadanlığı',
    'kend-teserrufati-ve-heyvandarliq': 'Kənd təsərrüfatı',
    'xidmetler-ve-b2b-heller': 'B2B xidmətlər',
  };
  return names[category.slug] ?? category.name;
}

export const HomeProductCard = memo(function HomeProductCard({ product, width, imageHeight }: {
  product: Product; width: number; imageHeight: number;
}) {
  const router = useRouter(); const c = useColors();
  const { price, negotiated, minimum, stock } = productPresentation(product);
  const limited = product.stockStatus === 'LIMITED';
  return <Pressable accessibilityRole="button" accessibilityLabel={`${product.title}, ${price}, ${minimum}`}
    onPress={() => router.push(('/product/' + product.slug) as never)}
    style={({ pressed }) => ({ width, backgroundColor: c.surface, borderRadius: 20,
      borderWidth: 1, borderColor: c.line, overflow: 'hidden', opacity: pressed ? .8 : 1 })}>
    <View style={{ padding: 6, paddingBottom: 0 }}>
      <ProductImage product={product} height={imageHeight} marginBottom={0} />
      {stock && <View style={{ position: 'absolute', left: 13, top: 13,
        backgroundColor: limited ? '#fff0d7' : '#ffffff', borderRadius: 7,
        paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: limited ? '#a56618' : '#207853' }} />
        <Text style={{ color: limited ? '#805315' : '#285d45', fontSize: 9, fontWeight: '700' }}>{stock}</Text>
      </View>}
    </View>
    <View style={{ position: 'absolute', right: 9, top: 9 }}><SaveButton product={product} /></View>
    <View style={{ padding: 10, gap: 5 }}>
      <Text numberOfLines={2} style={{ color: c.ink, fontWeight: '700', fontSize: 13, lineHeight: 18, minHeight: 36 }}>
        {product.title}
      </Text>
      <View style={{ minHeight: 34, justifyContent: 'center' }}>
        <Text numberOfLines={negotiated ? 2 : 1} style={{ color: c.brand, fontWeight: '800',
          fontSize: negotiated ? 12 : 18, lineHeight: 20 }}>{price}</Text>
      </View>
      <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11, lineHeight: 15 }}>{minimum}</Text>
      <View style={{ borderTopColor: c.line, borderTopWidth: 1, paddingTop: 6, marginTop: 2, gap: 3 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontSize: 11, fontWeight: '600', lineHeight: 15 }}>
          {product.store?.name ?? 'Satıcı mağazası'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <MapPin size={11} color={c.muted} />
          <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11, lineHeight: 15 }}>
            {product.store?.city ?? 'Ünvan göstərilməyib'}
          </Text>
        </View>
      </View>
    </View>
  </Pressable>;
});

export const HomeStoreCard = memo(function HomeStoreCard({ store, width, products }: {
  store: Store; width: number; products: Product[];
}) {
  const router = useRouter(); const c = useColors();
  const initials = store.name.split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('').toLocaleUpperCase('az');
  const previews = products.filter((product) => product.store?.id === store.id).slice(0, 3);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${store.name} mağazasına bax`}
    onPress={() => router.push(('/store/' + store.slug) as never)}
    style={({ pressed }) => ({ width, backgroundColor: c.surface, borderRadius: 20, padding: 14,
      borderWidth: 1, borderColor: c.line, gap: 12, opacity: pressed ? .75 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View style={{ width: 39, height: 39, borderRadius: 13, backgroundColor: c.brandSoft,
        alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.brand, fontSize: 12, fontWeight: '800' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontWeight: '800', fontSize: 13 }}>{store.name}</Text>
        <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11 }}>{store.city ?? 'Topdansatış mağazası'}</Text>
      </View>
      {store.verified && <BadgeCheck size={18} color={c.brand} accessibilityLabel="Təsdiqlənib" />}
      <SaveButton store={store} />
    </View>
    {store.category && <Text numberOfLines={1} style={{ color: c.muted, fontSize: 10, lineHeight: 14 }}>
      {store.category.name}
    </Text>}
    {previews.length > 0 && <View style={{ flexDirection: 'row', gap: 6 }}>
      {previews.map((product) => <View key={product.id} style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
        <ProductImage product={product} height={62} marginBottom={0} />
      </View>)}
    </View>}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: c.muted, fontSize: 11 }}>{store.productCount != null ? `${store.productCount} məhsul` : 'Məhsullara bax'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>Mağazaya keç</Text>
        <ArrowUpRight size={14} color={c.brand} />
      </View>
    </View>
  </Pressable>;
});
