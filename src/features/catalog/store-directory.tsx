import { SaveButton } from '../buyer/save-button';
import { memo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, BadgeCheck, Check, ChevronRight, MapPin, Package, RotateCcw, Store as StoreIcon } from 'lucide-react-native';
import type { Category, Product, Store } from '../../api/types';
import { RemoteImage } from '../../components/ui';
import { useColors } from '../../theme/colors';
import { categoryIcon } from '../home/cards';
import { categoryRoots } from '../home/category-tree';
import { Sheet } from './catalog-sheets';
import { ProductImage } from './product-image';

export type StoreFilters = { city: string; category: string };
export const emptyStoreFilters: StoreFilters = { city: '', category: '' };
export const storeSortOptions = [
  { value: 'newest', label: 'Ən yenilər', text: 'Son əlavə olunan mağazalar' },
  { value: 'popular', label: 'Populyar', text: 'Ən çox maraq göstərilən mağazalar' },
  { value: 'products', label: 'Məhsul sayı', text: 'Daha geniş kataloqu olan mağazalar' },
] as const;
export type StoreSort = typeof storeSortOptions[number]['value'];

export const DirectoryStoreCard = memo(function DirectoryStoreCard({ store, previews = [] }: { store: Store; previews?: Product[] }) {
  const c = useColors(); const router = useRouter();
  const initials = store.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('az');
  return <View style={{ borderRadius: 22, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityLabel={store.name + ' mağazasına bax'}
      onPress={() => router.push(('/store/' + store.slug) as never)}
      style={({ pressed }) => ({ padding: 14, gap: 9, backgroundColor: pressed ? c.background : c.surface })}>
      <View style={{ flexDirection: 'row', gap: 11, alignItems: 'center' }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {store.logoUrl || store.logoKey ? <RemoteImage uri={store.logoUrl ?? store.logoKey} height={48} marginBottom={0} />
            : <Text style={{ color: c.brand, fontSize: 15, fontWeight: '800' }}>{initials}</Text>}
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontSize: 16, fontWeight: '800', lineHeight: 21 }}>{store.name}</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <MapPin size={12} color={c.muted} />
            <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12, flex: 1 }}>{store.city ?? 'Ünvan göstərilməyib'}</Text>
          </View>
        </View>
        <SaveButton store={store} />
        {store.verified && <View accessibilityLabel="Təsdiqlənmiş mağaza" style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
          <BadgeCheck size={19} color={c.brand} />
        </View>}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        <View style={{ backgroundColor: c.background, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, maxWidth: '100%' }}>
          <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>{store.category?.name ?? 'Topdansatış təchizatçısı'}</Text>
        </View>
        {store.productCount != null && <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 }}>
          <Package size={12} color={c.brand} /><Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>{store.productCount} məhsul</Text>
        </View>}
      </View>
      {!!store.description && <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{store.description}</Text>}
      {previews.length > 0 && <View style={{ flexDirection: 'row', gap: 7 }}>
        {previews.slice(0, 3).map((product) => <View key={product.id} style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}>
          <ProductImage product={product} height={56} marginBottom={0} />
        </View>)}
      </View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700', flex: 1 }}>Mağazanı kəşf et</Text>
        <ChevronRight size={17} color={c.brand} />
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={store.name + ' məhsullarına bax'}
      onPress={() => router.push(('/products?store=' + encodeURIComponent(store.slug)) as never)}
      style={({ pressed }) => ({ backgroundColor: pressed ? c.background : c.brandSoft, borderTopWidth: 1, borderColor: c.line,
        minHeight: 45, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 7 })}>
      <StoreIcon size={15} color={c.brand} /><Text style={{ color: c.brand, fontSize: 12, fontWeight: '700', flex: 1 }}>Məhsul kataloqu</Text><ArrowRight size={16} color={c.brand} />
    </Pressable>
  </View>;
});

export function MainCategorySheet({ categories, value, onSelect, onClose, loading, error, onRetry, emptyLabel = 'Bütün kateqoriyalar' }: {
  categories: Category[]; value: string; onSelect: (category?: Category) => void; onClose: () => void;
  loading?: boolean; error?: boolean; onRetry?: () => void; emptyLabel?: string;
}) {
  const c = useColors();
  return <Sheet title="Əsas kateqoriya" subtitle="Mağazanın fəaliyyət sahəsini seçin" onClose={onClose}>
    <View style={{ gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={() => onSelect()} style={{ backgroundColor: c.brandSoft, minHeight: 54,
        padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: c.brand, fontWeight: '700', flex: 1 }}>{emptyLabel}</Text>{!value && <Check size={18} color={c.brand} />}
      </Pressable>
      {loading && <Text style={{ color: c.muted, paddingVertical: 16 }}>Kateqoriyalar yüklənir…</Text>}
      {error && <Pressable accessibilityRole="button" onPress={onRetry} style={{ minHeight: 48, justifyContent: 'center' }}>
        <Text style={{ color: c.danger }}>Kateqoriyalar açılmadı. Yenidən yoxla.</Text>
      </Pressable>}
      {categoryRoots(categories).map((category) => <Pressable key={category.id} accessibilityRole="radio"
        accessibilityState={{ checked: value === category.slug }} accessibilityLabel={category.name} onPress={() => onSelect(category)}
        style={{ borderRadius: 15, borderWidth: 1, borderColor: value === category.slug ? c.brand : c.line, minHeight: 62,
          padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: value === category.slug ? c.brandSoft : c.surface }}>
        {categoryIcon(category, c.brand, 20)}<Text style={{ color: c.ink, fontSize: 13, fontWeight: '700', flex: 1 }}>{category.name}</Text>
        {value === category.slug ? <Check size={18} color={c.brand} /> : <ChevronRight size={16} color={c.muted} />}
      </Pressable>)}
    </View>
  </Sheet>;
}

export function StoreFiltersSheet({ initial, categories, onApply, onClose, loading, error, onRetry }: {
  initial: StoreFilters; categories: Category[]; onApply: (value: StoreFilters) => void; onClose: () => void;
  loading?: boolean; error?: boolean; onRetry?: () => void;
}) {
  const c = useColors(); const [draft, setDraft] = useState({ ...initial }); const [categoryOpen, setCategoryOpen] = useState(false);
  return <>
    <Sheet visible={!categoryOpen} title="Mağaza filtrləri" subtitle="Təchizatçını şəhər və sahə üzrə tapın" onClose={onClose}
      footer={<View style={{ paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: c.line, flexDirection: 'row', gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mağaza filtrlərini sıfırla" onPress={() => setDraft({ ...emptyStoreFilters })}
          style={{ minHeight: 50, width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: c.background }}><RotateCcw size={20} color={c.ink} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Mağaza filtrlərini tətbiq et" onPress={() => onApply({ ...draft, city: draft.city.trim() })}
          style={{ flex: 1, minHeight: 50, backgroundColor: c.brand, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: c.surface, fontSize: 14, fontWeight: '800' }}>Nəticələri göstər</Text></Pressable>
      </View>}>
      <View style={{ gap: 10 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: '700' }}>Şəhər</Text>
        <TextInput value={draft.city} onChangeText={(city) => setDraft({ ...draft, city })} maxLength={80} accessibilityLabel="Mağaza şəhəri"
          placeholder="Bütün şəhərlər" placeholderTextColor={c.muted} style={{ minHeight: 50, backgroundColor: c.background, color: c.ink,
            borderWidth: 1, borderColor: c.line, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Bakı', 'Sumqayıt', 'Gəncə', 'Mingəçevir'].map((city) => <Pressable key={city}
          accessibilityRole="button" accessibilityState={{ selected: draft.city === city }} onPress={() => setDraft({ ...draft, city: draft.city === city ? '' : city })}
          style={{ minHeight: 42, paddingHorizontal: 12, borderRadius: 12, justifyContent: 'center', backgroundColor: draft.city === city ? c.brandSoft : c.background }}>
          <Text style={{ color: draft.city === city ? c.brand : c.muted, fontSize: 12, fontWeight: '600' }}>{city}</Text></Pressable>)}</View>
      </View>
      <View style={{ gap: 10 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: '700' }}>Fəaliyyət sahəsi</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Mağaza kateqoriyası seç" onPress={() => setCategoryOpen(true)}
          style={{ minHeight: 54, backgroundColor: c.brandSoft, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: c.brand, flex: 1, fontSize: 13, fontWeight: '700' }}>{categories.find((item) => item.slug === draft.category)?.name ?? 'Bütün kateqoriyalar'}</Text>
          <ChevronRight size={18} color={c.brand} /></Pressable>
        <Text style={{ color: c.muted, fontSize: 11, lineHeight: 17 }}>Seçim mağazanın qeydiyyatdakı əsas kateqoriyasına görə aparılır.</Text>
      </View>
    </Sheet>
    {categoryOpen && <MainCategorySheet categories={categories} value={draft.category} loading={loading} error={error} onRetry={onRetry}
      onClose={() => setCategoryOpen(false)} onSelect={(category) => { setDraft({ ...draft, category: category?.slug ?? '' }); setCategoryOpen(false); }} />}
  </>;
}
export function StoreSortSheet({ value, onSelect, onClose }: { value: StoreSort; onSelect: (value: StoreSort) => void; onClose: () => void }) {
  const c = useColors();
  return <Sheet title="Sıralama" subtitle="Mağazaların görünmə ardıcıllığı" onClose={onClose}>
    <View style={{ gap: 8 }}>{storeSortOptions.map((option) => <Pressable key={option.value} accessibilityRole="radio"
      accessibilityState={{ checked: value === option.value }} accessibilityLabel={option.label} onPress={() => onSelect(option.value)}
      style={{ backgroundColor: value === option.value ? c.brandSoft : c.background, borderRadius: 15, minHeight: 66,
        padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: '700' }}>{option.label}</Text>
        <Text style={{ color: c.muted, fontSize: 11 }}>{option.text}</Text></View>{value === option.value && <Check size={19} color={c.brand} />}
    </Pressable>)}</View>
  </Sheet>;
}
