import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { BadgeCheck, Check, ChevronRight, MapPin, RotateCcw, SlidersHorizontal, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Category } from '../../api/types';
import { useColors } from '../../theme/colors';
import { CategoryPicker } from '../home/category-picker';
import { categoryTrail } from '../home/category-tree';
import { emptyFilters, filterCount, sortOptions, stockOptions, validateFilters, type ProductFilters, type ProductSort } from './product-filters';

export function Sheet({ title, subtitle, onClose, children, footer, visible = true }: {
  title: string; subtitle: string; onClose: () => void; children: ReactNode; footer?: ReactNode; visible?: boolean;
}) {
  const c = useColors(); const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,25,22,.55)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Seçim pəncərəsini bağla" onPress={onClose}
        style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={{ maxHeight: '90%', backgroundColor: c.surface,
        borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12) }}>
        <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, paddingBottom: 16 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: c.ink, fontSize: 22, fontWeight: '800' }}>{title}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{subtitle}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Bağla" onPress={onClose}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color={c.ink} />
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 22 }}>{children}</ScrollView>
        {footer}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export function SortSheet({ value, onSelect, onClose }: { value: ProductSort; onSelect: (sort: ProductSort) => void; onClose: () => void }) {
  const c = useColors();
  return <Sheet title="Sıralama" subtitle="Məhsullar hansı ardıcıllıqla görünsün?" onClose={onClose}>
    <View style={{ gap: 8 }}>{sortOptions.map((option) => <Pressable key={option.value} accessibilityRole="radio"
      accessibilityState={{ checked: value === option.value }} onPress={() => onSelect(option.value)}
      style={{ minHeight: 64, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: value === option.value ? c.brandSoft : c.background }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.ink, fontSize: 14, fontWeight: '700' }}>{option.label}</Text>
        <Text style={{ color: c.muted, fontSize: 11 }}>{option.detail}</Text>
      </View>
      {value === option.value && <Check color={c.brand} size={20} />}
    </Pressable>)}</View>
  </Sheet>;
}

export function FiltersSheet({ initial, categories, categoriesLoading, categoriesError, onApply, onClose }: {
  initial: ProductFilters; categories: Category[]; categoriesLoading: boolean; categoriesError: boolean;
  onApply: (filters: ProductFilters) => void; onClose: () => void;
}) {
  const c = useColors(); const [draft, setDraft] = useState({ ...initial });
  const [categoryOpen, setCategoryOpen] = useState(false); const [error, setError] = useState<string>();
  const update = (field: keyof ProductFilters, value: string | boolean) => { setDraft((previous) => ({ ...previous, [field]: value })); setError(undefined); };
  const category = categories.find((item) => item.slug === draft.category);
  const categoryLabel = category ? categoryTrail(categories, category).map((item) => item.name).join(' › ') : 'Bütün kateqoriyalar';
  const heading = (text: string) => <Text style={{ color: c.ink, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>{text}</Text>;
  const inputStyle = { backgroundColor: c.background, borderColor: c.line, borderWidth: 1, borderRadius: 13,
    paddingHorizontal: 13, minHeight: 48, color: c.ink, fontSize: 14 };
  const apply = () => {
    const problem = validateFilters(draft);
    if (problem) { setError(problem); return; }
    onApply({ ...draft, city: draft.city.trim(), priceMin: draft.priceMin.trim(), priceMax: draft.priceMax.trim(), minOrderMax: draft.minOrderMax.trim() });
  };
  return <>
    <Sheet visible={!categoryOpen} title="Filtrlər" subtitle="İstədiyiniz topdan təklifi daha tez tapın" onClose={onClose}
      footer={<View style={{ borderTopWidth: 1, borderColor: c.line, paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
        {error && <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 12 }}>{error}</Text>}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Seçilən filtrləri sıfırla" onPress={() => { setDraft({ ...emptyFilters }); setError(undefined); }}
            style={{ minHeight: 50, width: 50, backgroundColor: c.background, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={20} color={c.ink} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={apply} style={{ flex: 1, minHeight: 50, padding: 12, borderRadius: 14,
            backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <SlidersHorizontal size={17} color={c.surface} />
            <Text style={{ color: c.surface, fontSize: 14, fontWeight: '800' }}>Nəticələri göstər{filterCount(draft) > 0 ? ` · ${filterCount(draft)} filtr` : ''}</Text>
          </Pressable>
        </View>
      </View>}>
      <View>{heading('Kateqoriya və alt kateqoriya')}
        <Pressable accessibilityRole="button" accessibilityLabel="Kateqoriya seç" onPress={() => setCategoryOpen(true)}
          style={{ backgroundColor: c.brandSoft, padding: 14, minHeight: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text numberOfLines={3} style={{ color: c.brand, fontSize: 13, fontWeight: '700', flex: 1 }}>{categoryLabel}</Text>
          <ChevronRight size={18} color={c.brand} />
        </Pressable>
      </View>
      <View>{heading('Şəhər')}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle }}>
          <MapPin size={17} color={c.muted} />
          <TextInput value={draft.city} onChangeText={(value) => update('city', value)} placeholder="Bütün şəhərlər"
            maxLength={80} accessibilityLabel="Mağazanın şəhəri" placeholderTextColor={c.muted}
            style={{ flex: 1, minHeight: 46, fontSize: 14, color: c.ink }} />
          {!!draft.city && <Pressable accessibilityRole="button" accessibilityLabel="Şəhəri təmizlə" onPress={() => update('city', '')}
            style={{ minHeight: 44, minWidth: 30, justifyContent: 'center', alignItems: 'center' }}><X size={16} color={c.muted} /></Pressable>}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
          {['Bakı', 'Sumqayıt', 'Gəncə', 'Mingəçevir'].map((city) => <Pressable key={city} accessibilityRole="button"
            accessibilityState={{ selected: draft.city === city }} onPress={() => update('city', draft.city === city ? '' : city)}
            style={{ minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: draft.city === city ? c.brandSoft : c.background }}>
            <Text style={{ color: draft.city === city ? c.brand : c.muted, fontSize: 12, fontWeight: '600' }}>{city}</Text>
          </Pressable>)}
        </View>
      </View>
      <View>{heading('Qiymət aralığı · AZN')}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['priceMin', 'priceMax'] as const).map((field, index) => <View key={field} style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>{index === 0 ? 'Minimum' : 'Maksimum'}</Text>
            <TextInput value={draft[field]} onChangeText={(value) => update(field, value)} keyboardType="decimal-pad" maxLength={12}
              accessibilityLabel={index === 0 ? 'Minimum qiymət AZN' : 'Maksimum qiymət AZN'}
              placeholder={index === 0 ? '0' : 'Limit yoxdur'} placeholderTextColor={c.muted} style={inputStyle} />
          </View>)}
        </View>
        <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }}>Qiymət seçildikdə yalnız qiyməti göstərilən məhsullar çıxır.</Text>
      </View>
      <View>{heading('Stok vəziyyəti')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{stockOptions.map((option) => <Pressable key={option.value}
          accessibilityRole="radio" accessibilityState={{ checked: draft.stock === option.value }} onPress={() => update('stock', option.value)}
          style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 13, justifyContent: 'center',
            backgroundColor: draft.stock === option.value ? c.brand : c.background }}>
          <Text style={{ color: draft.stock === option.value ? c.surface : c.ink, fontSize: 12, fontWeight: '600' }}>{option.label}</Text>
        </Pressable>)}</View>
      </View>
      <View>{heading('Minimum sifariş üçün limit')}
        <TextInput value={draft.minOrderMax} onChangeText={(value) => update('minOrderMax', value)} keyboardType="decimal-pad" maxLength={12}
          accessibilityLabel="Minimum sifariş miqdarının maksimumu" placeholder="Məsələn, 100" placeholderTextColor={c.muted} style={inputStyle} />
        <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }}>Minimum sifarişi bu miqdardan çox olmayan elanlar. Vahid məhsuldan asılıdır: ədəd, kisə, metr və s.</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: c.background, padding: 12 }}>
        <BadgeCheck size={23} color={c.brand} />
        <View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.ink, fontSize: 13, fontWeight: '700' }}>Təsdiqlənmiş mağazalar</Text>
          <Text style={{ color: c.muted, fontSize: 11 }}>Yalnız yoxlanılmış satıcılar</Text></View>
        <Switch accessibilityLabel="Yalnız təsdiqlənmiş mağazalar" value={draft.verified} onValueChange={(value) => update('verified', value)}
          trackColor={{ false: c.line, true: c.brand }} thumbColor={c.surface} />
      </View>
      {!!draft.store && <View style={{ gap: 8 }}>{heading('Mağaza üzrə seçim')}
        <Text style={{ color: c.muted, fontSize: 12 }}>Nəticələr seçilmiş mağazaya aiddir.</Text>
        <Pressable accessibilityRole="button" onPress={() => update('store', '')} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: c.brand, fontWeight: '700' }}>Bütün mağazaların məhsullarını göstər</Text>
        </Pressable>
      </View>}
    </Sheet>
    {categoryOpen && <CategoryPicker visible categories={categories} initialCategoryId={category?.id}
      loading={categoriesLoading} error={categoriesError} onClose={() => setCategoryOpen(false)}
      onSelect={(slug) => { update('category', slug ?? ''); setCategoryOpen(false); }} />}
  </>;
}
