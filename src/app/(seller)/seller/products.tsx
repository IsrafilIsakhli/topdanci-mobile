import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { api } from '../../../api/client';
import type { Product } from '../../../api/types';
import { Button, Loading, Notice } from '../../../components/ui';
import { ManagementPage, PanelSearch, StatusBadge, SectionTitle, PanelChoice } from '../../../features/management/ui';
import { ProductImage } from '../../../features/catalog/product-image';
import { useColors } from '../../../theme/colors';
export default function SellerProducts() {
  const c = useColors(); const router = useRouter();
  const [draft, setDraft] = useState(''); const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const query = useInfiniteQuery({ queryKey: ['seller-products', q, status], initialPageParam: '',
    queryFn: ({ pageParam }) => api.get<Product[]>('/seller/products', { q, status, cursor: pageParam, limit: 20 }),
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined });
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const renderProduct = useCallback((product: Product) => <Pressable accessibilityRole="button"
    accessibilityLabel={product.title + ': redaktə et'} onPress={() => router.push(('/seller/product/' + product.id) as never)}
    style={({ pressed }) => ({ borderRadius: 18, padding: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? .8 : 1, flexDirection: 'row', gap: 12 })}>
    <View style={{ width: 78, alignSelf: 'flex-start' }}><ProductImage product={product} height={86} marginBottom={0} /></View>
    <View style={{ flex: 1, gap: 8 }}><StatusBadge status={product.status} />
      <Text numberOfLines={2} style={{ color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>{product.title}</Text>
      <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>{product.price == null ? 'Razılaşma yolu ilə' : Number(product.price).toLocaleString('az-AZ') + ' AZN'}</Text>
      <Text style={{ color: c.muted, fontSize: 10 }}>Məhsulu redaktə et</Text>
    </View><ChevronRight size={17} color={c.muted} style={{ alignSelf: 'center' }} />
  </Pressable>, [router, c]);
  return <ManagementPage title="Məhsullarım" mode="seller" list={{ data: items, renderItem: renderProduct, keyExtractor: (item) => item.id,
    empty: query.isPending ? <Loading /> : query.error ? <Notice message={query.error.message} /> : <Notice message="Bu seçimə uyğun məhsul yoxdur." />,
    footer: query.hasNextPage ? <Button title={query.isFetchingNextPage ? 'Yüklənir…' : 'Daha çox göstər'} disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} /> : null }}>
    <PanelSearch value={draft} onChange={setDraft} placeholder="Məhsulun adı ilə axtar" onSubmit={() => setQ(draft.trim())} />
    <PanelChoice label="Məhsul statusu" value={status} onChange={setStatus} options={[
      { label: 'Hamısı', value: '' }, { label: 'Aktiv', value: 'ACTIVE' }, { label: 'Yoxlamada', value: 'PENDING_REVIEW' },
      { label: 'Qaralama', value: 'DRAFT' }, { label: 'Passiv', value: 'PASSIVE' }, { label: 'Rədd edildi', value: 'REJECTED' }]} />
    <SectionTitle title={(query.data?.pages[0]?.meta?.total ?? items.length) + ' məhsul'} action="+ Yeni məhsul" onPress={() => router.push('/seller/product/new')} />
  </ManagementPage>;
}
