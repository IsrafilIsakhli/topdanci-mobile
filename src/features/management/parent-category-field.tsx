import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { AdminRecord, Category } from '../../api/types';
import { flattenCategories } from '../admin/config';
import { categoryBranchIds } from '../home/category-tree';
import { CategoryPicker } from '../home/category-picker';
import { useColors } from '../../theme/colors';
export function ParentCategoryField({ value, currentId, onChange }: { value: string; currentId: string; onChange: (value: string) => void }) {
  const c = useColors(); const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ['admin-category-options'], queryFn: () => api.get<AdminRecord[]>('/admin/categories/tree') });
  const flat = flattenCategories(query.data?.data ?? []) as unknown as Category[];
  const excluded = categoryBranchIds(flat, currentId); const choices = flat.filter((item) => !excluded.has(item.id));
  return <View style={{ gap: 8 }}><Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>Ana kateqoriya</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Ana kateqoriyanı seç" onPress={() => setOpen(true)}
      style={{ minHeight: 50, padding: 12, backgroundColor: c.background, borderWidth: 1, borderColor: c.line, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ flex: 1, color: c.ink, fontSize: 13 }}>{flat.find((item) => item.id === value)?.name ?? 'Əsas kateqoriya · ana bölmə yoxdur'}</Text><ChevronRight size={17} color={c.brand} />
    </Pressable>
    {!!value && <Pressable accessibilityRole="button" onPress={() => onChange('')} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>Əsas kateqoriya kimi təyin et</Text></Pressable>}
    {open && <CategoryPicker selectionOnly visible categories={choices} initialCategoryId={value} loading={query.isPending} error={!!query.error}
      onRetry={() => void query.refetch()} onClose={() => setOpen(false)} onSelect={(slug) => { const item = choices.find((cat) => cat.slug === slug); if (item) { onChange(item.id); setOpen(false); } }} />}
  </View>;
}
