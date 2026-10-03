import { memo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronRight, MapPin } from 'lucide-react-native';
import type { Product } from '../../api/types';
import { useColors } from '../../theme/colors';
import { HomeProductCard } from './cards';

/** Bölmə başlığı: solda ad (istəyə görə kiçik etiket), sağda siyahıya keçid. */
export function SectionHeading({ title, eyebrow, action = 'Hamısı', onPress }: {
  title: string; eyebrow?: string; action?: string; onPress: () => void;
}) {
  const c = useColors();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <View style={{ flex: 1, gap: 3 }}>
      {eyebrow && <Text style={{ color: c.muted, fontSize: 9, letterSpacing: 1.5, fontWeight: '700' }}>{eyebrow}</Text>}
      <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', letterSpacing: -.4 }}>{title}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${action}`} onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 44 }}>
      <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>{action}</Text>
      <ChevronRight size={16} color={c.brand} />
    </Pressable>
  </View>;
}

export function SectionError({ message, retry }: { message: string; retry: () => void }) {
  const c = useColors();
  return <View style={{ gap: 5 }}>
    <Text style={{ color: c.muted, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line,
      borderRadius: 16, padding: 16, textAlign: 'center', lineHeight: 22 }}>{message}</Text>
    <Pressable accessibilityRole="button" onPress={retry} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: c.brand, fontWeight: '700', textAlign: 'center' }}>Yenidən yüklə</Text>
    </Pressable>
  </View>;
}

/** Şəhər zolağı — şəhərlər yüklənmiş mağazalardan götürülür ki, seçim həmişə nəticə versin. */
export const CityStrip = memo(function CityStrip({ cities, onSelect }: {
  cities: string[]; onSelect: (city: string) => void;
}) {
  const c = useColors();
  return <View style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <MapPin size={13} color={c.brand} strokeWidth={1.8} />
      <Text style={{ color: c.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}>ŞƏHƏR ÜZRƏ BAZAR</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginRight: -16 }}
      contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
      {cities.map((city) => <Pressable key={city} accessibilityRole="button"
        accessibilityLabel={city + ' şəhərindəki mağazalar'} onPress={() => onSelect(city)}
        style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 14, borderRadius: 13,
          backgroundColor: pressed ? c.brandSoft : c.surface, borderWidth: 1, borderColor: c.line,
          flexDirection: 'row', alignItems: 'center', gap: 5 })}>
        <Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>{city}</Text>
        <ChevronRight size={13} color={c.brand} />
      </Pressable>)}
    </ScrollView>
  </View>;
});

/** Üfüqi məhsul karuseli — ana səhifədəki sahə bölmələri üçün. */
export const ProductRail = memo(function ProductRail({ eyebrow, title, products, cardWidth, imageHeight, onOpenAll }: {
  eyebrow: string; title: string; products: Product[]; cardWidth: number; imageHeight: number; onOpenAll: () => void;
}) {
  return <View style={{ gap: 9 }}>
    <SectionHeading eyebrow={eyebrow} title={title} onPress={onOpenAll} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginRight: -16 }}
      contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
      {products.map((product) => <HomeProductCard key={product.id} product={product}
        width={cardWidth} imageHeight={imageHeight} />)}
    </ScrollView>
  </View>;
});

export function FilterChips({ options, value, onChange }: {
  options: readonly { key: string; label: string }[]; value: string; onChange: (key: string) => void;
}) {
  const c = useColors();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
    {options.map((option) => <Pressable key={option.key} accessibilityRole="button"
      accessibilityState={{ selected: value === option.key }} onPress={() => onChange(option.key)}
      style={{ minHeight: 38, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 12,
        backgroundColor: value === option.key ? c.brand : c.surface,
        borderWidth: 1, borderColor: value === option.key ? c.brand : c.line }}>
      <Text style={{ color: value === option.key ? c.surface : c.muted, fontWeight: '700', fontSize: 11 }}>
        {option.label}
      </Text>
    </Pressable>)}
  </ScrollView>;
}
