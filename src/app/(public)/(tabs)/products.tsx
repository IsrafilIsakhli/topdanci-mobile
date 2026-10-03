import { SearchPanel } from '../../../features/buyer/search-panel';
import { useLibrary } from '../../../features/buyer/library';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, RefreshControl, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ArrowDownUp, ArrowRight, ChevronDown, LayoutGrid, List, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../api/client';
import { DEMO_CATALOG } from '../../../api/config';
import type { Category, Product } from '../../../api/types';
import { PublicBottomNav } from '../../../components/public-bottom-nav';
import { CatalogProductCard } from '../../../features/catalog/catalog-product-card';
import { FiltersSheet, SortSheet } from '../../../features/catalog/catalog-sheets';
import { emptyFilters, filterCount, productParams, routeText, sortOptions, stockOptions, uniqueProducts, type ProductFilters, type ProductSort } from '../../../features/catalog/product-filters';
import { CategoryPicker } from '../../../features/home/category-picker';
import { categoryRoots } from '../../../features/home/category-tree';
import { categoryShortName } from '../../../features/home/cards';
import { useColors } from '../../../theme/colors';

export default function Products() {
  const params = useLocalSearchParams<{ q?: string | string[]; category?: string | string[]; store?: string | string[] }>();
  const { state, scope } = useLibrary();
  if (!state.ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  const initial = { q: routeText(params.q).trim().slice(0, 120), category: routeText(params.category), store: routeText(params.store) };
  return <ProductCatalog key={scope+JSON.stringify(initial)} initial={initial} />;
}

function ProductCatalog({ initial }: { initial: { q: string; category: string; store: string } }) {
  const c = useColors(); const insets = useSafeAreaInsets(); const dimensions = useWindowDimensions();
  const { state: remembered, actions } = useLibrary();
  const hasRouteFilter = !!(initial.q || initial.category || initial.store);
  const [text, setText] = useState(initial.q); const [q, setQ] = useState(initial.q);
  const [focused, setFocused] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(hasRouteFilter ? { ...emptyFilters, category: initial.category, store: initial.store } : remembered.filters);
  const [sort, setSort] = useState<ProductSort>(hasRouteFilter ? 'newest' : remembered.sort);
  const [sheet, setSheet] = useState<'filters' | 'sort' | 'category'>();
  const [layout, setLayout] = useState<'grid' | 'list'>(remembered.layout);
  useEffect(() => { void actions.remember({ filters, sort, layout }); }, [actions, filters, sort, layout]);
  const list = useRef<FlatList<Product>>(null);
  const singleColumn = layout === 'list' || dimensions.width < 350 || dimensions.fontScale >= 1.3;
  const columns = singleColumn ? 1 : 2;
  const cardWidth = (dimensions.width - 32 - (columns === 2 ? 10 : 0)) / columns;
  const count = filterCount(filters);

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories'), staleTime: 60_000 });
  const allCategories = categories.data?.data ?? [];
  const selectedCategory = allCategories.find((item) => item.slug === filters.category);
  const queryParams = productParams(q, filters, sort);
  const query = useInfiniteQuery({
    queryKey: ['product-catalog', queryParams], initialPageParam: '',
    queryFn: ({ pageParam }) => api.get<Product[]>('/products', { ...queryParams, cursor: pageParam, limit: 20 }),
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined,
  });
  const items = uniqueProducts(query.data?.pages ?? []);
  const total = query.data?.pages[0]?.meta?.total ?? items.length;
  const storeName = items[0]?.store?.name ?? filters.store;
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchNextPageError) void fetchNextPage();
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  const toTop = () => list.current?.scrollToOffset({ offset: 0, animated: false });
  const submit = (value = text) => {
    const next = value.trim().slice(0, 120); void actions.search(next); setText(next); setQ(next); setFocused(false); Keyboard.dismiss(); toTop();
  };
  const changeFilters = (value: ProductFilters) => { setFilters(value); setSheet(undefined); toTop(); };
  const openSheet = (value: 'filters' | 'sort' | 'category') => { Keyboard.dismiss(); setFocused(false); setSheet(value); };
  const clearAll = () => { setFilters({ ...emptyFilters }); setSort('newest'); toTop(); };
  const chips: { label: string; fields?: (keyof ProductFilters)[] }[] = [];
  const clearFields = (...fields: (keyof ProductFilters)[]) => {
    const next = { ...filters }; fields.forEach((field) => { if (field === 'verified') next.verified = false; else next[field] = ''; });
    changeFilters(next);
  };
  if (q) chips.push({ label: '“' + q + '”' });
  if (filters.category) chips.push({ label: selectedCategory?.name ?? 'Kateqoriya', fields: ['category'] });
  if (filters.city) chips.push({ label: filters.city, fields: ['city'] });
  if (filters.stock) chips.push({ label: stockOptions.find((option) => option.value === filters.stock)?.label ?? 'Stok', fields: ['stock'] });
  if (filters.priceMin || filters.priceMax) chips.push({
    label: filters.priceMin && filters.priceMax ? filters.priceMin + '–' + filters.priceMax + ' AZN'
      : filters.priceMax ? '≤ ' + filters.priceMax + ' AZN' : '≥ ' + filters.priceMin + ' AZN',
    fields: ['priceMin', 'priceMax'],
  });
  if (filters.minOrderMax) chips.push({ label: 'Min. sifariş ≤ ' + filters.minOrderMax, fields: ['minOrderMax'] });
  if (filters.verified) chips.push({ label: 'Təsdiqlənmiş', fields: ['verified'] });
  if (filters.store) chips.push({ label: storeName, fields: ['store'] });
  const sortLabel = sortOptions.find((option) => option.value === sort)!.label;
  const renderProduct = useCallback(({ item }: { item: Product }) =>
    <CatalogProductCard product={item} width={cardWidth} list={singleColumn} />, [cardWidth, singleColumn]);

  return <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
    <View style={{ backgroundColor: c.surface, borderBottomWidth: 1, borderColor: c.line, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: c.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>TOPDANBAZAR</Text>
          <Text style={{ color: c.ink, fontSize: 23, fontWeight: '800', letterSpacing: -.6 }}>Məhsullar</Text>
        </View>
        {DEMO_CATALOG && <View style={{ backgroundColor: c.brandSoft, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 8, gap: 2 }}>
          <Text style={{ color: c.brand, fontSize: 10, fontWeight: '800' }}>Nümunə kataloq</Text>
          <Text style={{ color: c.muted, fontSize: 9 }}>Test məlumatları</Text>
        </View>}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: focused ? c.brand : c.line,
          backgroundColor: c.background, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, gap: 8 }}>
          <Search size={18} color={c.muted} />
          <TextInput value={text} onChangeText={(value) => { setText(value); setFocused(true); }}
            onFocus={() => setFocused(true)} onSubmitEditing={() => submit()} returnKeyType="search"
            placeholder="Məhsul və ya mağaza axtar" placeholderTextColor={c.muted} accessibilityLabel="Məhsul və mağaza axtar"
            maxLength={120} autoCapitalize="none" autoCorrect={false}
            style={{ flex: 1, minHeight: 48, color: c.ink, fontSize: 13, paddingVertical: 8 }} />
          {!!text && <Pressable accessibilityRole="button" accessibilityLabel="Axtarışı təmizlə" onPress={() => submit('')}
            style={{ width: 32, minHeight: 46, justifyContent: 'center', alignItems: 'center' }}><X size={16} color={c.muted} /></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel="Axtar" onPress={() => submit()}
            style={{ width: 38, minHeight: 46, alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={19} color={c.brand} /></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={'Filtrləri aç, ' + count + ' seçilmiş filtr'} onPress={() => openSheet('filters')}
          style={{ width: 50, minHeight: 50, borderRadius: 14, backgroundColor: c.brand, justifyContent: 'center', alignItems: 'center' }}>
          <SlidersHorizontal size={21} color={c.surface} />
          {count > 0 && <View style={{ position: 'absolute', top: -4, right: -3, borderRadius: 10, minWidth: 19, minHeight: 19,
            backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <Text style={{ color: c.surface, fontSize: 10, fontWeight: '800' }}>{count}</Text>
          </View>}
        </Pressable>
      </View>
      {focused && <SearchPanel maxHeight={220} text={text} onSearch={submit} onCategory={(slug) => { changeFilters({ ...emptyFilters, category: slug }); submit(''); }} />}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kateqoriya və alt kateqoriya seç" onPress={() => openSheet('category')}
          style={{ flex: 1, minHeight: 44, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.brandSoft,
            flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <LayoutGrid size={16} color={c.brand} />
          <Text numberOfLines={1} style={{ color: c.brand, fontSize: 12, fontWeight: '700', flex: 1 }}>{selectedCategory?.name ?? 'Kateqoriyalar'}</Text>
          <ChevronDown size={14} color={c.brand} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Sıralama: ' + sortLabel} onPress={() => openSheet('sort')}
          style={{ flex: 1, minHeight: 44, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.background,
            flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <ArrowDownUp size={16} color={c.ink} /><Text numberOfLines={1} style={{ color: c.ink, fontSize: 12, fontWeight: '600', flex: 1 }}>{sortLabel}</Text>
          <ChevronDown size={14} color={c.muted} />
        </Pressable>
      </View>
      {chips.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ alignItems: 'center', gap: 7 }}>
        {chips.map((chip, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={chip.label + ' seçimini sil'}
          onPress={() => { if (chip.fields) clearFields(...chip.fields); else submit(''); }}
          style={{ minHeight: 36, borderRadius: 10, paddingHorizontal: 10, gap: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: c.background }}>
          <Text numberOfLines={1} style={{ color: c.ink, fontSize: 11, maxWidth: 160 }}>{chip.label}</Text><X size={13} color={c.muted} />
        </Pressable>)}
        {count > 0 && <Pressable accessibilityRole="button" onPress={clearAll} style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>Filtrləri sıfırla</Text>
        </Pressable>}
      </ScrollView>}
    </View>
    <FlatList ref={list} key={columns} numColumns={columns} data={items} renderItem={renderProduct} keyExtractor={(item) => item.id}
      columnWrapperStyle={columns === 2 ? { gap: 10 } : undefined} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={() => setFocused(false)} onEndReached={loadMore} onEndReachedThreshold={.4}
      refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={c.brand} colors={[c.brand]} />}
      ListHeaderComponent={<View style={{ paddingVertical: 12, gap: 12 }}>
        {!filters.category && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {categoryRoots(allCategories).map((category) => <Pressable key={category.id} accessibilityRole="button"
            onPress={() => changeFilters({ ...filters, category: category.slug })} style={{ minHeight: 36, borderRadius: 11,
              paddingHorizontal: 11, justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>{categoryShortName(category)}</Text>
          </Pressable>)}
        </ScrollView>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text accessibilityLiveRegion="polite" style={{ color: c.ink, fontSize: 16, fontWeight: '800' }}>
              {query.isPending ? 'Məhsullar yüklənir…' : query.isLoadingError ? 'Məhsullar yüklənmədi' : total + ' məhsul'}
            </Text>
            <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11 }}>{q ? '“' + q + '” üçün nəticələr' : filters.store ? storeName : 'Topdan təklifləri kəşf edin'}</Text>
          </View>
          <View style={{ flexDirection: 'row', borderRadius: 11, backgroundColor: c.surface, padding: 3, gap: 2 }}>
            {(['grid', 'list'] as const).map((value) => <Pressable key={value} accessibilityRole="button"
              accessibilityLabel={value === 'grid' ? 'İki sütunlu görünüş' : 'Siyahı görünüşü'} accessibilityState={{ selected: layout === value }}
              onPress={() => setLayout(value)} style={{ width: 40, minHeight: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 9,
                backgroundColor: layout === value ? c.brandSoft : c.surface }}>
              {value === 'grid' ? <LayoutGrid size={17} color={layout === value ? c.brand : c.muted} /> : <List size={18} color={layout === value ? c.brand : c.muted} />}
            </Pressable>)}
          </View>
        </View>
        {query.isRefetchError && !query.isFetchNextPageError && <Text style={{ color: c.danger, fontSize: 12 }}>
          Yeniləmə alınmadı. Əvvəlki nəticələr göstərilir; yenidən yoxlamaq üçün aşağı çəkin.
        </Text>}
      </View>}
      ListEmptyComponent={<View style={{ paddingVertical: 38, paddingHorizontal: 20, alignItems: 'center', gap: 14 }}>
        {query.isPending ? <ActivityIndicator size="large" color={c.brand} /> : <>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
            <PackageSearch size={30} color={c.brand} />
          </View>
          <Text style={{ color: c.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>
            {query.isError ? 'Kataloq açılmadı' : 'Uyğun məhsul tapılmadı'}
          </Text>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            {query.error?.message ?? 'Axtarış sözünü dəyişin və ya bir neçə filtri silərək yenidən baxın.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => {
            if (query.isError) void query.refetch();
            else { clearAll(); submit(''); }
          }} style={{ backgroundColor: c.brand, borderRadius: 13, paddingHorizontal: 20, minHeight: 46, justifyContent: 'center' }}>
            <Text style={{ color: c.surface, fontWeight: '700' }}>{query.isError ? 'Yenidən yoxla' : 'Bütün məhsullara bax'}</Text>
          </Pressable>
        </>}
      </View>}
      ListFooterComponent={items.length > 0 ? <View style={{ alignItems: 'center', paddingTop: 18, gap: 10 }}>
        {query.isFetchingNextPage ? <ActivityIndicator color={c.brand} /> : query.isFetchNextPageError ? <>
          <Text style={{ color: c.danger, fontSize: 12 }}>Davamı yüklənmədi. Görünən məhsullar saxlanılıb.</Text>
          <Pressable accessibilityRole="button" onPress={() => void query.fetchNextPage()} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: c.brand, fontWeight: '700' }}>Yenidən yüklə</Text>
          </Pressable>
        </> : query.hasNextPage ? <Pressable accessibilityRole="button" onPress={loadMore} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: c.brand, fontWeight: '700' }}>Daha çox göstər</Text>
        </Pressable> : <Text style={{ color: c.muted, fontSize: 11 }}>{items.length} məhsulun hamısı göstərildi</Text>}
      </View> : null} />
    <PublicBottomNav />
    {sheet === 'filters' && <FiltersSheet initial={filters} categories={allCategories} categoriesLoading={categories.isPending}
      categoriesError={categories.isError} onClose={() => setSheet(undefined)} onApply={changeFilters} />}
    {sheet === 'sort' && <SortSheet value={sort} onClose={() => setSheet(undefined)}
      onSelect={(value) => { setSort(value); setSheet(undefined); toTop(); }} />}
    {sheet === 'category' && <CategoryPicker visible categories={allCategories} initialCategoryId={selectedCategory?.id}
      loading={categories.isPending} error={categories.isError} onClose={() => setSheet(undefined)}
      onSelect={(slug) => changeFilters({ ...filters, category: slug ?? '' })} />}
  </View>;
}
