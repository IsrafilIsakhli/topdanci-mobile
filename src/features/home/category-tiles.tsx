import { memo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ArrowUpRight, LayoutGrid } from 'lucide-react-native';
import type { Category } from '../../api/types';
import { useColors } from '../../theme/colors';
import { categoryIcon, categoryShortName } from './cards';
import { homeCategoryRoots } from './category-tree';

export function categoryTone(category?: Category) {
  const slug = category?.slug ?? '';
  if (slug.includes('elektron')) return { background: '#edf2fc', ink: '#496aa1' };
  if (slug.includes('qida')) return { background: '#fff3e4', ink: '#956025' };
  if (slug.includes('tikinti')) return { background: '#f1edfa', ink: '#79609f' };
  if (slug.includes('ev-bag') || slug.includes('meiset')) return { background: '#f8eeeb', ink: '#9a6858' };
  return { background: '#e8f5ee', ink: '#246348' };
}

export const HomeCategoryGrid = memo(function HomeCategoryGrid({ categories, onOpen }: {
  categories: Category[]; onOpen: (id?: string) => void;
}) {
  const c = useColors(); const { width, fontScale } = useWindowDimensions();
  const columns = fontScale >= 1.6 ? 1 : width < 350 || fontScale >= 1.2 ? 2 : 3;
  const tileWidth = Math.floor((width - 32 - (columns - 1) * 8) / columns);
  const roots = homeCategoryRoots(categories);
  const tile = (category?: Category) => {
    const tone = categoryTone(category);
    const allSpan = !category ? columns - (roots.length % columns) : 1;
    const wide = !category && allSpan > 1;
    const itemWidth = !category ? allSpan * tileWidth + (allSpan - 1) * 8 : tileWidth;
    return <Pressable key={category?.id ?? 'all'} accessibilityRole="button"
      accessibilityLabel={category ? `${category.name}: alt kateqoriyaları seç` : 'Bütün kateqoriyaları aç'}
      accessibilityHint="Kateqoriya seçim panelini açır"
      onPress={() => onOpen(category?.id)}
      style={({ pressed }) => ({ width: itemWidth, minHeight: columns === 1 ? 64 : 84,
        backgroundColor: pressed ? c.brandSoft : c.surface, borderColor: category ? c.line : '#c8dfd3',
        borderWidth: 1, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 10,
        alignItems: 'center', justifyContent: 'center', gap: 7,
        flexDirection: columns === 1 || wide ? 'row' : 'column', transform: [{ scale: pressed ? .97 : 1 }] })}>
      <View style={{ width: 36, height: 36, borderRadius: 12,
        backgroundColor: category ? tone.background : c.brand, alignItems: 'center', justifyContent: 'center' }}>
        {category ? categoryIcon(category, tone.ink, 22) : <LayoutGrid size={21} color={c.surface} strokeWidth={1.8} />}
      </View>
      <View style={{ alignItems: columns === 1 ? 'flex-start' : 'center', flexShrink: 1, gap: 2 }}>
        <Text style={{ color: category ? c.ink : c.brand, fontSize: 12, lineHeight: 16,
          fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>
          {category ? categoryShortName(category) : wide ? 'Bütün kateqoriyalar' : 'Hamısı'}
        </Text>
      </View>
      {!category && <ArrowUpRight size={12} color={c.brand}
        style={{ position: 'absolute', top: 10, right: 10 }} />}
    </Pressable>;
  };
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {roots.map((category) => tile(category))}{tile()}
  </View>;
});
