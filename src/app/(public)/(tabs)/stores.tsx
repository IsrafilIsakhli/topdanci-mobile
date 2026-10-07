import { CachedNotice } from '../../../features/catalog/detail-actions';
import { useLibrary } from '../../../features/buyer/library';
import { SearchPanel } from '../../../features/buyer/search-panel';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRight, ChevronDown, LayoutGrid, Search, SlidersHorizontal, Store as StoreIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../api/client';
import { DEMO_CATALOG } from '../../../api/config';
import type { Category, Product, Store } from '../../../api/types';
import { PublicBottomNav } from '../../../components/public-bottom-nav';
import { PublicHeader } from '../../../components/public-page';
import { DirectoryStoreCard, emptyStoreFilters, MainCategorySheet, StoreFiltersSheet, StoreSortSheet, storeSortOptions, type StoreFilters, type StoreSort } from '../../../features/catalog/store-directory';
import { routeText } from '../../../features/catalog/product-filters';
import { useColors } from '../../../theme/colors';

export default function Stores() {
  const params = useLocalSearchParams<{ q?: string | string[]; city?: string | string[]; category?: string | string[] }>();
  const { state, scope } = useLibrary();
  if (!state.ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  const initial = { q: routeText(params.q).trim().slice(0, 120), city: routeText(params.city), category: routeText(params.category) };
  return <StoreDirectory key={scope+JSON.stringify(initial)} initial={initial} />;
}
function StoreDirectory({ initial }: { initial: { q: string; city: string; category: string } }) {
  const c = useColors(); const router = useRouter(); const insets = useSafeAreaInsets();
  const { state: remembered, actions } = useLibrary();
  const hasRouteFilter = !!(initial.q || initial.city || initial.category);
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(initial.q); const [q, setQ] = useState(initial.q);
  const [filters, setFilters] = useState<StoreFilters>(hasRouteFilter ? { city: initial.city, category: initial.category } : remembered.storeFilters);
  const [sort, setSort] = useState<StoreSort>(hasRouteFilter ? 'newest' : remembered.storeSort); const [sheet, setSheet] = useState<'filters' | 'category' | 'sort'>();
  useEffect(() => { void actions.rememberStores({ storeFilters: filters, storeSort: sort }); }, [actions, filters, sort]);
  const list = useRef<FlatList<Store>>(null);
  const previewProducts = useQuery({ queryKey: ['home-products'], queryFn: () => api.get<Product[]>('/products', { limit: 40 }) });
  const previews = useMemo(() => {
    const byStore = new Map<string, Product[]>();
    for (const product of previewProducts.data?.data ?? []) {
      if (!product.store?.id) continue;
      const rows = byStore.get(product.store.id) ?? [];
      if (rows.length < 3) rows.push(product);
      byStore.set(product.store.id, rows);
    }
    return byStore;
  }, [previewProducts.data]);
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories') });
  const allCategories = categories.data?.data ?? [];
  const selected = allCategories.find((item) => item.slug === filters.category);
  const count = Number(!!filters.city) + Number(!!filters.category);
  const query = useInfiniteQuery({
    queryKey: ['store-directory', q, filters, sort], initialPageParam: '',
    queryFn: ({ pageParam }) => api.get<Store[]>('/stores', { q, ...filters, sort, cursor: pageParam, limit: 20 }),
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined,
  });
  const seen = new Set<string>();
  const items = (query.data?.pages.flatMap((page) => page.data) ?? []).filter((item) => {
    if (seen.has(item.id)) return false; seen.add(item.id); return true;
  });
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = query;
  const loadMore = useCallback(() => { if (hasNextPage && !isFetching && !isFetchNextPageError) void fetchNextPage(); },
    [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  const toTop = () => list.current?.scrollToOffset({ offset: 0, animated: false });
  const applyFilters = (next: StoreFilters) => { setFilters(next); setSheet(undefined); toTop(); };
  const submit = (value = text) => { const next = value.trim().slice(0, 120); void actions.search(next); setText(next); setQ(next); setFocused(false); Keyboard.dismiss(); toTop(); };
  const open = (next: 'filters' | 'category' | 'sort') => { Keyboard.dismiss(); setFocused(false); setSheet(next); };
  const reset = () => { applyFilters({ ...emptyStoreFilters }); setSort('newest'); submit(''); };
  const sortLabel = storeSortOptions.find((option) => option.value === sort)!.label;

  return <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: c.background }}>
    <PublicHeader title="Mağazalar" accessory={DEMO_CATALOG && <View style={{ backgroundColor: c.brandSoft, padding: 8, borderRadius: 10 }}>
      <Text style={{ color: c.brand, fontSize: 10, fontWeight: '700' }}>Nümunə kataloq</Text>
      <Text style={{ color: c.muted, fontSize: 9, marginTop: 2 }}>Test məlumatları</Text></View>} />
    <View style={{ backgroundColor: c.surface, padding: 16, gap: 10, borderBottomColor: c.line, borderBottomWidth: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.background,
          flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
          <Search size={18} color={c.muted} /><TextInput value={text} onChangeText={(value) => { setText(value); setFocused(true); }} onFocus={() => setFocused(true)} accessibilityLabel="Mağaza axtar"
            placeholder="Ad və ya fəaliyyət sahəsi" placeholderTextColor={c.muted} autoCorrect={false} autoCapitalize="none" maxLength={120}
            returnKeyType="search" onSubmitEditing={() => submit()} style={{ color: c.ink, flex: 1, minHeight: 48, fontSize: 13 }} />
          {!!text && <Pressable accessibilityRole="button" accessibilityLabel="Mağaza axtarışını təmizlə" onPress={() => submit('')}
            style={{ minWidth: 30, minHeight: 46, justifyContent: 'center', alignItems: 'center' }}><X size={16} color={c.muted} /></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel="Mağazaları axtar" onPress={() => submit()}
            style={{ minWidth: 38, minHeight: 46, justifyContent: 'center', alignItems: 'center' }}><ArrowRight size={19} color={c.brand} /></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Mağaza filtrlərini aç" onPress={() => open('filters')}
          style={{ width: 50, minHeight: 50, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
          <SlidersHorizontal size={21} color={c.surface} />
          {count > 0 && <View style={{ position: 'absolute', right: -3, top: -3, borderRadius: 10, backgroundColor: c.ink, minWidth: 19, minHeight: 19, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.surface, fontSize: 10, fontWeight: '700' }}>{count}</Text></View>}
        </Pressable>
      </View>
      {focused && <SearchPanel kind="stores" maxHeight={220} text={text} onSearch={submit} onCategory={(slug) => { applyFilters({ ...emptyStoreFilters, category: slug }); submit(''); }} />}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mağaza fəaliyyət sahəsini seç" onPress={() => open('category')}
          style={{ flex: 1, minHeight: 44, borderRadius: 12, padding: 10, gap: 5, backgroundColor: c.brandSoft, flexDirection: 'row', alignItems: 'center' }}>
          <LayoutGrid size={15} color={c.brand} /><Text numberOfLines={1} style={{ flex: 1, color: c.brand, fontSize: 12, fontWeight: '700' }}>{selected?.name ?? 'Fəaliyyət sahəsi'}</Text>
          <ChevronDown size={14} color={c.brand} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Mağaza sıralaması: ' + sortLabel} onPress={() => open('sort')}
          style={{ flex: 1, minHeight: 44, borderRadius: 12, padding: 10, gap: 5, backgroundColor: c.background, flexDirection: 'row', alignItems: 'center' }}>
          <ArrowDownUp size={15} color={c.ink} /><Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontSize: 12, fontWeight: '600' }}>{sortLabel}</Text>
          <ChevronDown size={14} color={c.muted} /></Pressable>
      </View>
      {(q || count > 0) && <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 7 }}>
        {[...(q ? [{ label: '“' + q + '”', field: 'q' }] : []), ...(filters.city ? [{ label: filters.city, field: 'city' }] : []),
          ...(filters.category ? [{ label: selected?.name ?? 'Kateqoriya', field: 'category' }] : [])].map((chip) => <Pressable key={chip.field}
          accessibilityRole="button" accessibilityLabel={chip.label + ' seçimini sil'} onPress={() => chip.field === 'q' ? submit('') : applyFilters({ ...filters, [chip.field]: '' })}
          style={{ minHeight: 36, paddingHorizontal: 10, borderRadius: 10, backgroundColor: c.background, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ color: c.ink, fontSize: 11, maxWidth: 150 }}>{chip.label}</Text><X size={13} color={c.muted} /></Pressable>)}
        <Pressable accessibilityRole="button" onPress={reset} style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>Hamısını təmizlə</Text></Pressable>
      </ScrollView>}
    </View>
    <FlatList ref={list} data={items} keyExtractor={(store) => store.id} renderItem={({ item }) => <DirectoryStoreCard store={item} previews={previews.get(item.id)} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} ItemSeparatorComponent={() => <View style={{ height: 14 }} />} showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onEndReached={loadMore} onEndReachedThreshold={.4}
      refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} colors={[c.brand]} tintColor={c.brand} />}
      ListHeaderComponent={<View style={{ paddingVertical: 16, gap: 10 }}><CachedNotice at={query.data?.pages[0]?.meta?.cachedAt}/>
        <View style={{ padding: 15, borderRadius: 18, backgroundColor: c.brandSoft, gap: 5 }}>
          <Text style={{ color: c.brand, fontSize: 17, lineHeight: 23, fontWeight: '800' }}>Doğru təchizatçı, birbaşa əlaqə.</Text>
          <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Mağazaları müqayisə edin, məhsullarını kəşf edin.</Text>
        </View><Text accessibilityLiveRegion="polite" style={{ color: c.ink, fontSize: 17, fontWeight: '800' }}>
        {query.isPending ? 'Mağazalar yüklənir…' : query.isLoadingError ? 'Mağazalar açılmadı' : (query.data?.pages[0]?.meta?.total ?? items.length) + ' mağaza'}</Text>
        
        {query.isRefetchError && !query.isFetchNextPageError && <Text style={{ color: c.danger, fontSize: 12 }}>Yeniləmə alınmadı. Yenidən yoxlamaq üçün aşağı çəkin.</Text>}
      </View>}
      ListEmptyComponent={<View style={{ padding: 25, paddingVertical: 40, alignItems: 'center', gap: 14 }}>
        {query.isPending ? <ActivityIndicator size="large" color={c.brand} /> : <>
          <StoreIcon size={34} color={c.brand} /><Text style={{ color: c.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>{query.isError ? 'Kataloq açılmadı' : 'Uyğun mağaza tapılmadı'}</Text>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>{query.error?.message ?? 'Adı, şəhəri və ya fəaliyyət sahəsini dəyişərək yenidən baxın.'}</Text>
          <Pressable accessibilityRole="button" onPress={() => query.isError ? void query.refetch() : reset()}
            style={{ backgroundColor: c.brand, borderRadius: 13, minHeight: 46, paddingHorizontal: 18, justifyContent: 'center' }}>
            <Text style={{ color: c.surface, fontWeight: '700' }}>{query.isError ? 'Yenidən yoxla' : 'Bütün mağazalara bax'}</Text></Pressable>
        </>}
      </View>}
      ListFooterComponent={items.length ? <View style={{ paddingTop: 18, gap: 12 }}>
        {query.isFetchingNextPage ? <ActivityIndicator color={c.brand} /> : query.isFetchNextPageError
          ? <Pressable accessibilityRole="button" onPress={() => void query.fetchNextPage()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.danger, textAlign: 'center' }}>Davamı yüklənmədi. Yenidən yoxla.</Text></Pressable>
          : query.hasNextPage ? <Pressable accessibilityRole="button" onPress={loadMore} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.brand, textAlign: 'center' }}>Daha çox göstər</Text></Pressable>
          : <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>Bütün mağazalar göstərildi</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.push('/open-store')}
          style={{ backgroundColor: c.brandSoft, borderRadius: 18, padding: 16, gap: 6 }}>
          <Text style={{ color: c.brand, fontSize: 15, fontWeight: '800' }}>Mağazanız da burada olsun</Text>
          <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Topdan təkliflərinizi təqdim etmək üçün müraciət edin.</Text>
          <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700', marginTop: 3 }}>Mağaza aç →</Text></Pressable>
      </View> : null} />
    <PublicBottomNav />
    {sheet === 'filters' && <StoreFiltersSheet initial={filters} categories={allCategories} onApply={applyFilters} onClose={() => setSheet(undefined)}
      loading={categories.isPending} error={categories.isError} onRetry={() => void categories.refetch()} />}
    {sheet === 'category' && <MainCategorySheet categories={allCategories} value={filters.category} onClose={() => setSheet(undefined)}
      loading={categories.isPending} error={categories.isError} onRetry={() => void categories.refetch()}
      onSelect={(category) => applyFilters({ ...filters, category: category?.slug ?? '' })} />}
    {sheet === 'sort' && <StoreSortSheet value={sort} onClose={() => setSheet(undefined)} onSelect={(value) => { setSort(value); setSheet(undefined); toTop(); }} />}
  </View>;
}
