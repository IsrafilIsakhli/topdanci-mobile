import { CachedNotice, DetailActions } from '../../../features/catalog/detail-actions';
import { useLibrary } from '../../../features/buyer/library';
import { SaveButton } from '../../../features/buyer/save-button';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, RefreshControl, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRight, BadgeCheck, MapPin, Package, Search, X } from 'lucide-react-native';
import { ApiError, api } from '../../../api/client';
import { DEMO_CATALOG } from '../../../api/config';
import type { Product, Store } from '../../../api/types';
import { RemoteImage } from '../../../components/ui';
import { CatalogProductCard } from '../../../features/catalog/catalog-product-card';
import { SortSheet } from '../../../features/catalog/catalog-sheets';
import { ContactBar, DetailFrame, DetailState, StoreAbout, StoreAvatar } from '../../../features/catalog/detail-ui';
import { routeText, sortOptions, uniqueProducts, type ProductSort } from '../../../features/catalog/product-filters';
import { categoryIcon } from '../../../features/home/cards';
import { mediaUrl } from '../../../lib/media';
import { track } from '../../../lib/contact';
import { useColors } from '../../../theme/colors';

export default function StoreDetail() {
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = routeText(params.slug);
  return <StoreProfile key={slug} slug={slug} />;
}

function StoreIdentity({ store }: { store: Store }) {
  const c = useColors();
  const banner = !DEMO_CATALOG ? mediaUrl(store.bannerUrl) ?? mediaUrl(store.bannerKey) : null;
  return <View style={{ borderRadius: 24, borderWidth: 1, borderColor: c.line, overflow: 'hidden', backgroundColor: c.surface }}>
    <View style={{ height: 108, backgroundColor: c.brand, overflow: 'hidden' }}>
      {banner ? <View style={{ position: 'absolute', inset: 0 }}><RemoteImage uri={banner} height={108} marginBottom={0} /></View> : <>
        <View style={{ position: 'absolute', width: 175, height: 175, right: -20, top: -60, borderWidth: 28, borderRadius: 90, borderColor: '#ffffff0d' }} />
        <View style={{ position: 'absolute', width: 135, height: 135, right: 110, top: 20, borderWidth: 20, borderRadius: 70, borderColor: '#ffffff09' }} />
      </>}
      <View style={{ padding: 16, backgroundColor: banner ? '#064e3b88' : 'transparent', flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: '#bce0ce', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>TOPDANSATIŞ MAĞAZASI</Text>
          <Text numberOfLines={2} style={{ color: c.surface, fontSize: 16, lineHeight: 21, fontWeight: '700', paddingRight: 12 }}>{store.category?.name ?? 'Biznes üçün təchizat'}</Text>
        </View>
        {store.category && categoryIcon(store.category, '#d3eadc', 30)}
      </View>
    </View>
    <View style={{ position: 'absolute', top: 80, left: 16, padding: 4, backgroundColor: c.surface, borderRadius: 20 }}>
      <StoreAvatar store={store} size={52} />
    </View>
    <View style={{ padding: 16, paddingTop: 38, gap: 10 }}>
      <Text style={{ color: c.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -.4 }}>{store.name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}><MapPin size={13} color={c.muted} /><Text style={{ color: c.muted, fontSize: 12 }}>{store.city ?? 'Ünvan göstərilməyib'}</Text></View>
        {store.productCount != null && <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}><Package size={13} color={c.muted} /><Text style={{ color: c.muted, fontSize: 12 }}>{store.productCount} məhsul</Text></View>}
        {store.verified && <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: c.brandSoft, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}>
          <BadgeCheck size={14} color={c.brand} /><Text style={{ color: c.brand, fontSize: 10, fontWeight: '700' }}>Təsdiqlənmiş</Text>
        </View>}
      </View>
      {!!store.description && <Text numberOfLines={2} style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{store.description}</Text>}
    </View>
  </View>;
}

function StoreProfile({ slug }: { slug: string }) {
  const c = useColors(); const router = useRouter(); const { width, fontScale } = useWindowDimensions();
  const [text, setText] = useState(''); const [q, setQ] = useState(''); const [sort, setSort] = useState<ProductSort>('newest'); const [sortOpen, setSortOpen] = useState(false);
  const list = useRef<FlatList<Product>>(null);
  const query = useQuery({ queryKey: ['store', slug], queryFn: () => api.get<Store>('/stores/' + encodeURIComponent(slug)) });
  const store = query.error instanceof ApiError && [403,404].includes(query.error.status) ? undefined : query.data?.data;
  const { actions } = useLibrary();
  useEffect(() => { if (store) void actions.viewStore(store); }, [store, actions]);
  useEffect(() => { if (store?.id) void track('STORE_VIEW', store.id); }, [store?.id]);
  const products = useInfiniteQuery({
    queryKey: ['store-profile-products', slug, q, sort], initialPageParam: '', enabled: !!store,
    queryFn: ({ pageParam }) => api.get<Product[]>('/products', { store: slug, q, sort, limit: 12, cursor: pageParam }),
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined,
  });
  const items = uniqueProducts(products.data?.pages ?? []);
  const oneColumn = width < 350 || fontScale >= 1.3; const columns = oneColumn ? 1 : 2;
  const cardWidth = oneColumn ? width - 32 : (width - 42) / 2;
  const sortLabel = sortOptions.find((item) => item.value === sort)!.label;
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = products;
  const loadMore = useCallback(() => { if (hasNextPage && !isFetching && !isFetchNextPageError) void fetchNextPage(); }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  const fullCatalog = '/products?store=' + encodeURIComponent(slug);
  const submit = (value = text) => { const next = value.trim().slice(0, 120); setText(next); setQ(next); Keyboard.dismiss(); };
  return <DetailFrame title="Mağaza profili" fallback="/stores" accessory={store ? <SaveButton store={store} /> : undefined}
    footer={store ? <ContactBar store={store} fallbackLabel="Məhsullara bax" onFallback={() => router.push(fullCatalog as never)} /> : undefined}>
    {query.isPending ? <DetailState loading title="Mağaza yüklənir…" /> : query.error && !store ?
      <DetailState title="Mağaza açılmadı" message={query.error.message} onRetry={() => void query.refetch()} /> : store ? <>
      <FlatList ref={list} key={columns} data={items} numColumns={columns} keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CatalogProductCard product={item} width={cardWidth} />}
        columnWrapperStyle={columns === 2 ? { gap: 10 } : undefined} ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        onEndReached={loadMore} onEndReachedThreshold={.4} initialNumToRender={8}
        refreshControl={<RefreshControl refreshing={query.isRefetching || (products.isRefetching && !products.isFetchingNextPage)}
          onRefresh={() => { void query.refetch(); void products.refetch(); }} colors={[c.brand]} tintColor={c.brand} />}
        ListHeaderComponent={<View style={{ gap: 14, paddingBottom: 14 }}>
          <CachedNotice at={query.data?.meta?.cachedAt}/><StoreIdentity store={store} /><DetailActions kind="store" id={store.id} slug={store.slug} name={store.name}/>
          <StoreAbout store={store} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: c.ink, fontSize: 19, fontWeight: '800', flex: 1 }}>Mağazanın məhsulları</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Mağazanın bütün məhsullarına bax" onPress={() => router.push(fullCatalog as never)}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>Hamısı</Text><ArrowRight size={15} color={c.brand} />
            </Pressable>
          </View>
          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.line,
            minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
            <Search size={18} color={c.muted} />
            <TextInput accessibilityLabel="Bu mağazada məhsul axtar" placeholder="Bu mağazada məhsul axtar" placeholderTextColor={c.muted}
              value={text} onChangeText={setText} onSubmitEditing={() => submit()} returnKeyType="search" maxLength={120} autoCorrect={false} autoCapitalize="none"
              style={{ minHeight: 48, flex: 1, fontSize: 13, color: c.ink }} />
            {!!text && <Pressable accessibilityRole="button" accessibilityLabel="Mağaza məhsullarının axtarışını təmizlə" onPress={() => submit('')}
              style={{ minHeight: 44, minWidth: 32, alignItems: 'center', justifyContent: 'center' }}><X size={15} color={c.muted} /></Pressable>}
            <Pressable accessibilityRole="button" accessibilityLabel="Mağazada məhsul axtar" onPress={() => submit()}
              style={{ minHeight: 44, minWidth: 40, alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={18} color={c.brand} /></Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: c.muted, fontSize: 12 }}>
              {products.isPending ? 'Məhsullar yüklənir…' : products.isLoadingError ? 'Məhsullar açılmadı' : (products.data?.pages[0]?.meta?.total ?? items.length) + ' məhsul' + (q ? ' · “' + q + '”' : '')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={'Mağaza məhsullarının sıralaması: ' + sortLabel} onPress={() => { Keyboard.dismiss(); setSortOpen(true); }}
              style={{ minHeight: 42, paddingHorizontal: 10, borderRadius: 11, backgroundColor: c.brandSoft, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ArrowDownUp size={14} color={c.brand} /><Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>{sortLabel}</Text>
            </Pressable>
          </View>
          {products.isRefetchError && !products.isFetchNextPageError && <Text style={{ color: c.danger, fontSize: 12 }}>Yeniləmə alınmadı. Yenidən yoxlamaq üçün aşağı çəkin.</Text>}
        </View>}
        ListEmptyComponent={products.isPending ? <DetailState loading title="Məhsullar yüklənir…" /> : products.isError ?
          <DetailState title="Məhsullar açılmadı" message={products.error.message} onRetry={() => void products.refetch()} /> :
          <View style={{ gap: 10 }}>
            <DetailState title={q ? 'Uyğun məhsul tapılmadı' : 'Hələ məhsul yoxdur'} message={q ? 'Başqa məhsul adı yazın və ya axtarışı təmizləyin.' : 'Mağaza yeni məhsullar əlavə etdikdə burada görünəcək.'} />
            {!!q && <Pressable accessibilityRole="button" onPress={() => submit('')} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: c.brand, fontWeight: '700' }}>Bütün məhsulları göstər</Text></Pressable>}
          </View>}
        ListFooterComponent={items.length ? <View style={{ paddingTop: 16 }}>
          {products.isFetchingNextPage ? <ActivityIndicator color={c.brand} /> : products.isFetchNextPageError ?
            <Pressable accessibilityRole="button" onPress={() => void products.fetchNextPage()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.danger, textAlign: 'center' }}>Davamı yüklənmədi. Yenidən yoxla.</Text></Pressable> :
            products.hasNextPage ? <Pressable accessibilityRole="button" onPress={loadMore} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.brand, textAlign: 'center', fontWeight: '700' }}>Daha çox göstər</Text></Pressable> :
            <Text style={{ color: c.muted, textAlign: 'center', fontSize: 11 }}>Bütün məhsullar göstərildi</Text>}
        </View> : null} />
      {sortOpen && <SortSheet value={sort} onClose={() => setSortOpen(false)} onSelect={(value) => { setSort(value); setSortOpen(false); }} />}
    </> : <DetailState title="Mağaza tapılmadı" message="Mağaza hazırda kataloqda görünmür." />}
  </DetailFrame>;
}
