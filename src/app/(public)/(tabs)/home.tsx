import { CachedNotice } from '../../../features/catalog/detail-actions';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowRight, BadgeCheck, Search, Store as StoreIcon, UserRound, X } from 'lucide-react-native';
import { api } from '../../../api/client';
import type { Category, Product, Store } from '../../../api/types';
import { Loading, Notice, Screen } from '../../../components/ui';
import { categoryProductsPath } from '../../../features/catalog/navigation';
import { categoryBranchIds } from '../../../features/home/category-tree';
import { CategoryPicker } from '../../../features/home/category-picker';
import { HomeProductCard, HomeStoreCard } from '../../../features/home/cards';
import { HomeCategoryGrid } from '../../../features/home/category-tiles';
import { HomeHero } from '../../../features/home/hero';
import { CityStrip, FilterChips, ProductRail, SectionError, SectionHeading } from '../../../features/home/sections';
import { useColors } from '../../../theme/colors';

/** Sahə karuselləri — saytın ana səhifəsindəki kateqoriya zolaqları ilə eynidir. */
const stripDefinitions = [
  { slug: 'geyim-ayaqqabi-ve-tekstil', eyebrow: 'Geyim və ayaqqabı', title: 'Topdan geyim partiyaları' },
  { slug: 'elektronika-ve-aksesuarlar', eyebrow: 'Elektronika', title: 'Topdan elektronika aksesuarları' },
  { slug: 'qida-ve-icki', eyebrow: 'Qida və içki', title: 'Topdan qida partiyaları' },
  { slug: 'tikinti-ve-temir', eyebrow: 'Tikinti və təmir', title: 'Topdan tikinti materialları' },
] as const;

const vitrinFilters = [
  { key: 'all', label: 'Hamısı' },
  { key: 'stock', label: 'Stokda olanlar' },
  { key: 'priced', label: 'Qiyməti göstərilən' },
] as const;
type HomeFilter = typeof vitrinFilters[number]['key'];

/**
 * Filtr serverdə tətbiq olunur. Əvvəl siyahı yalnız yüklənmiş ilk 20 məhsulun
 * içində süzülürdü və real kataloqda yanlış nəticə verirdi.
 */
function filterParams(filter: HomeFilter) {
  if (filter === 'stock') return { stock: 'IN_STOCK' };
  if (filter === 'priced') return { priceMin: 0.01 };
  return {};
}

const VITRIN_LIMIT = 6;
const RAIL_LIMIT = 6;
const STORE_LIMIT = 8;

function HomeHeader() {
  const c = useColors(); const router = useRouter();
  return <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
    <View style={{ width: 35, height: 35, borderRadius: 12, backgroundColor: c.brand,
      alignItems: 'center', justifyContent: 'center' }}><StoreIcon size={20} color={c.surface} strokeWidth={1.8} /></View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.brand, fontSize: 20, fontWeight: '800', letterSpacing: -.6 }}>TopdanBazar</Text>
      <Text style={{ color: c.muted, fontSize: 10, marginTop: 1 }}>Biznesdən biznesə. Birbaşa.</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Hesab və digər seçimlər"
      onPress={() => router.push('/more')} style={{ width: 44, height: 44, borderRadius: 15,
        backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
      <UserRound size={20} color={c.ink} strokeWidth={1.7} />
    </Pressable>
  </View>;
}

const HomeSearchBar = memo(function HomeSearchBar({ onSubmit }: { onSubmit: (value: string) => void }) {
  const c = useColors(); const [value, setValue] = useState('');
  return <View style={{ backgroundColor: c.surface, borderRadius: 16, borderColor: c.line, borderWidth: 1,
    minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingLeft: 14 }}>
    <Search size={20} color={c.muted} strokeWidth={1.8} />
    <TextInput value={value} onChangeText={setValue} onSubmitEditing={() => onSubmit(value)}
      placeholder="Məhsul və ya mağaza axtar" placeholderTextColor={c.muted}
      returnKeyType="search" accessibilityLabel="Məhsul və mağaza axtarışı"
      style={{ color: c.ink, fontSize: 13, flex: 1, paddingHorizontal: 10, minHeight: 50 }} />
    {!!value && <Pressable accessibilityRole="button" accessibilityLabel="Axtarışı təmizlə" onPress={() => setValue('')}
      style={{ minWidth: 32, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><X size={15} color={c.muted} /></Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel="Axtar" onPress={() => onSubmit(value)}
      style={{ backgroundColor: c.brand, borderRadius: 12, width: 42, minHeight: 42,
        marginRight: 5, alignItems: 'center', justifyContent: 'center' }}>
      <ArrowRight size={20} color={c.surface} />
    </Pressable>
  </View>;
});

/** Ana səhifə bölmələri — uzun siyahı virtualizasiya olunsun deyə ayrı elementlər kimi verilir. */
type HomeSection =
  | { kind: 'vitrin'; key: string }
  | { kind: 'rail'; key: string; slug: string; eyebrow: string; title: string; products: Product[] }
  | { kind: 'stores'; key: string }
  | { kind: 'cta'; key: string };

type Rail = { key: string; slug: string; eyebrow: string; title: string; products: Product[] };

export default function Home() {
  const router = useRouter(); const c = useColors(); const { width, fontScale } = useWindowDimensions();
  const [picker, setPicker] = useState<{ initialId?: string } | null>(null);
  const [filter, setFilter] = useState<HomeFilter>('all');
  const oneColumn = width < 350 || fontScale >= 1.3;
  const gridWidth = width - 32;
  const cardWidth = oneColumn ? gridWidth : (gridWidth - 10) / 2;
  const imageHeight = oneColumn ? 150 : 120;
  const storeWidth = Math.min(gridWidth - 28, 320);

  const catalog = useQuery({ queryKey: ['home-products'], queryFn: () => api.get<Product[]>('/products', { limit: 40 }) });
  const stores = useQuery({ queryKey: ['home-stores'], queryFn: () => api.get<Store[]>('/stores', { limit: 12 }) });
  const categories = useQuery({ queryKey: ['home-categories'], queryFn: () => api.get<Category[]>('/categories') });
  const vitrin = useQuery({
    queryKey: ['home-products', filter], enabled: filter !== 'all',
    queryFn: () => api.get<Product[]>('/products', { limit: VITRIN_LIMIT * 2, ...filterParams(filter) }),
  });

  const allCategories = useMemo(() => categories.data?.data ?? [], [categories.data]);
  const allProducts = useMemo(() => catalog.data?.data ?? [], [catalog.data]);
  const allStores = useMemo(() => stores.data?.data ?? [], [stores.data]);
  const vitrinProducts = (filter === 'all' ? allProducts : vitrin.data?.data ?? []).slice(0, VITRIN_LIMIT);
  const vitrinPending = filter === 'all' ? catalog.isPending : vitrin.isPending;
  const vitrinError = filter === 'all' ? catalog.error : vitrin.error;

  /** Şəhərlər yüklənmiş mağazalardan götürülür — belə seçim heç vaxt boş nəticə vermir. */
  const cities = useMemo(() => [...new Set(allStores.map((store) => store.city)
    .filter((city): city is string => !!city))].slice(0, 8), [allStores]);

  /** Sahə karuselləri: kök kateqoriyanın bütün alt ağacına uyğun məhsullar. */
  const rails = useMemo(() => stripDefinitions.flatMap((definition): Rail[] => {
    const root = allCategories.find((item) => item.slug === definition.slug);
    if (!root) return [];
    const branch = categoryBranchIds(allCategories, root.id);
    const products = allProducts.filter((product) => product.category && branch.has(product.category.id))
      .slice(0, RAIL_LIMIT);
    return products.length ? [{ key: 'rail-' + definition.slug, slug: definition.slug,
      eyebrow: definition.eyebrow, title: definition.title, products }] : [];
  }), [allCategories, allProducts]);

  const sections = useMemo<HomeSection[]>(() => [
    { kind: 'vitrin', key: 'vitrin' },
    ...rails.map((rail): HomeSection => ({ kind: 'rail', ...rail })),
    { kind: 'stores', key: 'stores' },
    { kind: 'cta', key: 'cta' },
  ], [rails]);

  const openSearch = useCallback((value: string) => router.push('/search?q='+encodeURIComponent(value) as never), [router]);
  const openStores = useCallback((city?: string) =>
    router.push((city ? '/stores?city=' + encodeURIComponent(city) : '/stores') as never), [router]);
  const retryVitrin = () => void (filter === 'all' ? catalog.refetch() : vitrin.refetch());

  const renderSection = (section: HomeSection) => {
    if (section.kind === 'vitrin') return <View style={{ gap: 10 }}>
      <SectionHeading title="Vitrindəki məhsullar" onPress={() => router.push('/products')} />
      <FilterChips options={vitrinFilters} value={filter} onChange={(key) => setFilter(key as HomeFilter)} />
      {vitrinPending ? <Loading /> : vitrinError ? <SectionError message="Məhsullar yüklənmədi." retry={retryVitrin} /> :
        vitrinProducts.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {vitrinProducts.map((product) => <HomeProductCard key={product.id} product={product}
            width={cardWidth} imageHeight={imageHeight} />)}
        </View> : <Notice message={allProducts.length ? 'Bu seçimdə məhsul yoxdur. Digər seçimi yoxlayın.' : 'Hələ məhsul yoxdur.'} />}
      {!vitrinPending && !vitrinError && <Pressable accessibilityRole="button" onPress={() => router.push('/products')}
        style={{ minHeight: 45, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Text style={{ color: c.brand, fontWeight: '700', fontSize: 12 }}>Bütün məhsullara bax</Text>
        <ArrowRight size={16} color={c.brand} />
      </Pressable>}
    </View>;
    if (section.kind === 'rail') return <ProductRail eyebrow={section.eyebrow} title={section.title}
      products={section.products} cardWidth={cardWidth} imageHeight={imageHeight}
      onOpenAll={() => router.push(categoryProductsPath(section.slug) as never)} />;
    if (section.kind === 'stores') return <View style={{ gap: 10 }}>
      <SectionHeading eyebrow="SATICILARLA TANIŞ OLUN" title="Mağazalar" onPress={() => openStores()} />
      {cities.length > 0 && <CityStrip cities={cities} onSelect={openStores} />}
      {stores.isPending ? <Loading /> : stores.error ?
        <SectionError message="Mağazalar yüklənmədi." retry={() => void stores.refetch()} /> :
        allStores.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false}
          snapToInterval={storeWidth + 10} decelerationRate="fast" style={{ marginRight: -16 }}
          contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
          {allStores.slice(0, STORE_LIMIT).map((store) => <HomeStoreCard key={store.id} store={store}
            width={storeWidth} products={allProducts} />)}
        </ScrollView> : <Notice message="Hələ mağaza yoxdur." />}
    </View>;
    return <View style={{ backgroundColor: c.brandSoft, padding: 15, borderRadius: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <BadgeCheck size={17} color={c.brand} />
        <Text style={{ color: c.brand, fontSize: 12, fontWeight: '800' }}>Öz biznesiniz də burada olsun</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Mağazanızı təqdim edin, topdan təkliflərinizi alıcılara çatdırın.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/open-store')}
        style={{ minHeight: 44, backgroundColor: c.brand, borderRadius: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <StoreIcon size={16} color={c.surface} />
        <Text style={{ color: c.surface, fontSize: 12, fontWeight: '800' }}>Mağaza aç</Text>
        <ArrowRight size={16} color={c.surface} />
      </Pressable>
    </View>;
  };

  return <Screen<HomeSection> title="Ana səhifə" showDemoBanner={false} headerContent={<HomeHeader />}
    contentStyle={{ padding: 16, paddingBottom: 26, gap: 22 }}
    list={{ data: sections, keyExtractor: (section) => section.key,
      renderItem: (section) => renderSection(section), empty: null }}>
    <View style={{ gap: 14 }}>
    <HomeSearchBar onSubmit={openSearch} />
    <Pressable accessibilityRole="button" accessibilityLabel="Axtardığım məhsul bölməsini aç" onPress={() => router.push('/requests')} style={{ backgroundColor: c.brandSoft, borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.brand, fontSize: 14, fontWeight: '800' }}>Axtardığınız məhsulu tapa bilmirsiniz?</Text><Text style={{ color: c.muted, fontSize: 11, lineHeight: 17 }}>Tələb yerləşdirin, satıcı təkliflərini bir yerdə görün.</Text></View><ArrowRight color={c.brand} size={20}/></Pressable>
    <CachedNotice at={catalog.data?.meta?.cachedAt}/>
    <HomeHero onStores={() => openStores()} />
    <View style={{ gap: 8 }}>
      <SectionHeading title="Kateqoriyalar" onPress={() => setPicker({})} />
      {categories.isPending ? <Loading /> : categories.error ?
        <SectionError message="Kateqoriyalar yüklənmədi." retry={() => void categories.refetch()} /> :
        allCategories.length ? <HomeCategoryGrid categories={allCategories}
          onOpen={(initialId) => setPicker({ initialId })} /> : <Notice message="Hələ kateqoriya yoxdur." />}
    </View>
    </View>
    {picker && <CategoryPicker visible categories={allCategories} initialCategoryId={picker.initialId}
      loading={categories.isPending} error={categories.isError} onRetry={() => void categories.refetch()}
      onClose={() => setPicker(null)} onSelect={(slug) => {
        setPicker(null); router.push((slug ? categoryProductsPath(slug) : '/products') as never);
      }} />}
  </Screen>;
}
