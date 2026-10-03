import { memo } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { Product, Store } from '../../api/types';
import { useColors } from '../../theme/colors';
import { Card, RemoteImage, Body } from '../../components/ui';
import { ProductImage } from './product-image';

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const router = useRouter(); const c = useColors();
  return <Pressable onPress={() => router.push('/product/' + product.slug as never)}>
    <Card><ProductImage product={product} height={170} />
      <Text style={{ color: c.muted, fontSize: 12 }}>{product.category?.name ?? 'Məhsul'}</Text>
      <Text style={{ color: c.ink, fontSize: 17, fontWeight: '800' }}>{product.title}</Text>
      <Text style={{ color: c.brand, fontWeight: '800' }}>{product.priceLabel ?? (product.price ? product.price + ' ' + (product.currency ?? 'AZN') : 'Razılaşma yolu ilə')}</Text>
      <Body muted>{product.store?.name ?? ''}{product.store?.city ? ' · ' + product.store.city : ''}</Body>
    </Card>
  </Pressable>;
});
export const StoreCard = memo(function StoreCard({ store }: { store: Store }) {
  const router = useRouter(); const c = useColors();
  return <Pressable onPress={() => router.push('/store/' + store.slug as never)}>
    <Card><RemoteImage uri={store.bannerKey ?? store.logoKey ?? store.bannerUrl ?? store.logoUrl} height={150}
        recyclingKey={store.slug ?? store.id} />
      <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800' }}>{store.name}</Text>
      <Body muted>{[store.category?.name, store.city, store.productCount != null ? store.productCount + ' məhsul' : null].filter(Boolean).join(' · ')}</Body>
      {store.description && <Body>{store.description}</Body>}
      {store.verified && <Text style={{ color: c.brand, fontWeight: '700' }}>✓ Təsdiqlənmiş mağaza</Text>}
    </Card>
  </Pressable>;
});
