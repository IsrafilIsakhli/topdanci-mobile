import { SaveButton } from '../buyer/save-button';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BadgeCheck, MapPin } from 'lucide-react-native';
import type { Product } from '../../api/types';
import { useColors } from '../../theme/colors';
import { ProductImage } from './product-image';
import { productPresentation } from './product-presentation';

export const CatalogProductCard = memo(function CatalogProductCard({ product, width, list = false }: {
  product: Product; width: number; list?: boolean;
}) {
  const c = useColors(); const router = useRouter();
  const { price, negotiated, minimum, stock } = productPresentation(product);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${product.title}, ${price}, ${minimum}, ${product.store?.name ?? ''}`}
    onPress={() => router.push(('/product/' + product.slug) as never)}
    style={({ pressed }) => ({ width, flexDirection: list ? 'row' : 'column', backgroundColor: c.surface,
      borderRadius: 18, borderWidth: 1, borderColor: c.line, padding: 7, opacity: pressed ? .75 : 1 })}>
    <View style={{ width: list ? 102 : '100%' }}>
      <ProductImage product={product} height={list ? 112 : Math.min(136, Math.max(110, width * .72))} marginBottom={0} />
      {stock && <View style={{ position: 'absolute', left: 6, top: 6, borderRadius: 7, paddingHorizontal: 6,
        paddingVertical: 4, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2,
          backgroundColor: product.stockStatus === 'LIMITED' ? c.warning : product.stockStatus === 'OUT_OF_STOCK' ? c.muted : c.success }} />
        <Text style={{ color: c.ink, fontSize: 9, fontWeight: '700' }}>{stock}</Text>
      </View>}
      <View style={{ position: 'absolute', right: 4, top: 4 }}><SaveButton product={product} /></View>
    </View>
    <View style={{ flex: list ? 1 : undefined, paddingHorizontal: 4, paddingTop: list ? 1 : 9,
      paddingBottom: 4, marginLeft: list ? 10 : 0, gap: 5 }}>
      <Text numberOfLines={2} style={{ color: c.ink, fontSize: 13, fontWeight: '700', lineHeight: 18, minHeight: 36 }}>{product.title}</Text>
      <Text numberOfLines={2} style={{ color: c.brand, fontSize: negotiated ? 12 : 18, fontWeight: '800',
        lineHeight: negotiated ? 18 : 23, minHeight: 34 }}>{price}</Text>
      <Text numberOfLines={1} style={{ color: c.muted, fontSize: 10, lineHeight: 15 }}>{minimum}</Text>
      <View style={{ borderTopWidth: list ? 0 : 1, borderColor: c.line, paddingTop: list ? 0 : 6, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text numberOfLines={1} style={{ color: c.ink, fontSize: 10, fontWeight: '600', flexShrink: 1 }}>{product.store?.name ?? 'Satıcı mağazası'}</Text>
          {product.store?.verified && <BadgeCheck size={12} color={c.brand} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <MapPin size={10} color={c.muted} />
          <Text numberOfLines={1} style={{ color: c.muted, fontSize: 10, flexShrink: 1 }}>{product.store?.city ?? 'Ünvan göstərilməyib'}</Text>
        </View>
      </View>
    </View>
  </Pressable>;
});
