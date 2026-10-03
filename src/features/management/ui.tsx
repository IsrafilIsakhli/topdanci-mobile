import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ArrowLeft, ArrowRight, ChevronRight, LayoutDashboard, LogOut, Search, ShieldCheck, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen, type ScreenList } from '../../components/ui';
import { useSession } from '../auth/use-session';
import { DEMO_CATALOG } from '../../api/config';
import { useColors } from '../../theme/colors';
import { valueLabel } from '../../lib/labels';

export function ManagementPage<T>({ title, mode, back = false, children, list }: {
  title: string; mode: 'seller' | 'admin'; back?: boolean; children: ReactNode; list?: ScreenList<T>;
}) {
  const c = useColors(); const router = useRouter();
  const label = mode === 'seller' ? 'MAĞAZA ADMİNİ' : 'İDARƏETMƏ';
  return <Screen title={title} mode={mode} back={back} list={list} contentStyle={{ padding: 16, gap: 14 }}
    headerContent={<>
      <Pressable accessibilityRole="button" accessibilityLabel={back ? 'Geri' : 'Panelin əsas səhifəsi'}
        onPress={() => back && router.canGoBack() ? router.back() : router.replace(mode === 'seller' ? '/seller' : '/admin')}
        style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: back ? c.background : c.brand, alignItems: 'center', justifyContent: 'center' }}>
        {back ? <ArrowLeft size={20} color={c.ink} /> : mode === 'seller' ? <Store size={22} color="#fff" /> : <ShieldCheck size={22} color="#fff" />}
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}><Text style={{ color: c.muted, fontSize: 9, letterSpacing: 1, fontWeight: '800' }}>{label}</Text>
        <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800', lineHeight: 26 }}>{title}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Panel menyusu" onPress={() => router.push(mode === 'seller' ? '/seller/more' : '/admin/more')}
        style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
        <LayoutDashboard size={19} color={c.brand} />
      </Pressable>
    </>}>
    <View style={{ gap: 14 }}>{DEMO_CATALOG && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.warning }} />
      <Text style={{ color: c.muted, fontSize: 10, flex: 1, lineHeight: 15 }}>Test paneli · Dəyişikliklər yalnız bu sınaq üçündür</Text>
    </View>}
    {children}</View>
  </Screen>;
}
export function PanelCard({ title, text, children }: { title?: string; text?: string; children?: ReactNode }) {
  const c = useColors();
  return <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 16, gap: 12 }}>
    {title && <View style={{ gap: 4 }}><Text style={{ color: c.ink, fontSize: 15, fontWeight: '800' }}>{title}</Text>
      {text && <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{text}</Text>}</View>}{children}
  </View>;
}
export function PanelHeading({ children }: { children: ReactNode }) {
  const c = useColors(); return <Text style={{ color: c.ink, fontSize: 16, fontWeight: '800', lineHeight: 23 }}>{children}</Text>;
}
export function PanelChoice({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  const c = useColors();
  return <View style={{ gap: 8 }}><Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
      {options.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: item.value === value }}
        onPress={() => onChange(item.value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12,
          borderWidth: 1, borderColor: item.value === value ? c.brand : c.line, backgroundColor: item.value === value ? c.brand : c.surface }}>
        <Text style={{ color: item.value === value ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{item.label}</Text>
      </Pressable>)}
    </ScrollView>
  </View>;
}
export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const c = useColors();
  return <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 }}>
    <Text style={{ flex: 1, color: c.ink, fontSize: 17, fontWeight: '800' }}>{title}</Text>
    {action && <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ color: c.brand, fontSize: 11, fontWeight: '800' }}>{action}</Text><ChevronRight size={15} color={c.brand} />
    </Pressable>}
  </View>;
}
export function DashboardHero({ label, title, text, action, onPress }: { label: string; title: string; text: string; action?: string; onPress?: () => void }) {
  const c = useColors();
  return <View style={{ padding: 20, borderRadius: 23, backgroundColor: c.brand, gap: 11, overflow: 'hidden' }}>
    <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -45, width: 160, height: 160, borderRadius: 80, borderWidth: 24, borderColor: '#ffffff08' }} />
    <Text style={{ color: '#b8ddcf', fontSize: 10, letterSpacing: 1, fontWeight: '800' }}>{label}</Text>
    <Text style={{ color: '#fff', fontSize: 23, lineHeight: 29, fontWeight: '800' }}>{title}</Text>
    <Text style={{ color: '#d0e6de', fontSize: 12, lineHeight: 19 }}>{text}</Text>
    {action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 46, borderRadius: 13, padding: 12, marginTop: 2, backgroundColor: '#e5f1b9', opacity: pressed ? .8 : 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 })}>
      <Text style={{ color: c.brand, fontSize: 13, fontWeight: '800' }}>{action}</Text><ArrowRight size={17} color={c.brand} />
    </Pressable>}
  </View>;
}
export function Metrics({ items }: { items: { label: string; value: number | string; icon: ReactNode; note?: string; onPress?: () => void }[] }) {
  const c = useColors(); const { width, fontScale } = useWindowDimensions(); const single = width < 340 || fontScale >= 1.5;
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{items.map((item) => <Pressable key={item.label}
    accessibilityRole={item.onPress ? 'button' : undefined} accessibilityLabel={item.label + ': ' + item.value} disabled={!item.onPress} onPress={item.onPress}
    style={{ width: single ? '100%' : '48%', flexGrow: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 18, padding: 14, gap: 9 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>{item.icon}</View>
      {item.onPress && <ChevronRight color={c.muted} size={14} />}
    </View>
    <Text style={{ color: c.ink, fontSize: 26, fontWeight: '800' }}>{item.value}</Text>
    <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>{item.label}</Text>
    {item.note && <Text style={{ color: c.brand, fontSize: 10 }}>{item.note}</Text>}
  </Pressable>)}</View>;
}
export function StatusBadge({ status }: { status?: string }) {
  const c = useColors(); const danger = ['REJECTED','SUSPENDED','DELETED'].includes(status ?? '');
  const pending = ['PENDING','PENDING_REVIEW','IN_REVIEW','DRAFT','OPEN'].includes(status ?? '');
  return <View style={{ alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: danger ? '#fff0ee' : pending ? '#fff4df' : c.brandSoft }}>
    <Text style={{ color: danger ? c.danger : pending ? c.warning : c.brand, fontSize: 10, fontWeight: '700' }}>{valueLabel(status ?? 'ACTIVE')}</Text>
  </View>;
}
export function PanelSearch({ value, onChange, placeholder, onSubmit }: { value: string; onChange: (text: string) => void; placeholder: string; onSubmit?: () => void }) {
  const c = useColors();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: c.line, borderRadius: 15, backgroundColor: c.surface, paddingLeft: 13 }}>
    <Search size={19} color={c.muted} /><TextInput accessibilityLabel={placeholder} placeholder={placeholder} value={value} onChangeText={onChange}
      onSubmitEditing={onSubmit} returnKeyType="search" autoCorrect={false} placeholderTextColor={c.muted}
      style={{ flex: 1, minHeight: 50, fontSize: 13, color: c.ink, paddingVertical: 12 }} />
    {onSubmit && <Pressable accessibilityRole="button" accessibilityLabel="Axtar" onPress={onSubmit}
      style={{ minWidth: 46, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={19} color={c.brand} /></Pressable>}
  </View>;
}
export function ActionRow({ title, text, icon, onPress, trailing }: { title: string; text?: string; icon: ReactNode; onPress?: () => void; trailing?: ReactNode }) {
  const c = useColors();
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress}
    style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 64, paddingVertical: 9, opacity: pressed ? .7 : 1 })}>
    <View style={{ width: 39, height: 39, borderRadius: 13, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
    <View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.ink, fontSize: 13, fontWeight: '700', lineHeight: 18 }}>{title}</Text>
      {text && <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>{text}</Text>}</View>
    {trailing ?? (onPress && <ChevronRight size={17} color={c.muted} />)}
  </Pressable>;
}
export function Breakdown({ items }: { items: { label: string; value: number }[] }) {
  const c = useColors(); const max = Math.max(1, ...items.map((i) => i.value));
  return <View style={{ gap: 15 }}>{items.map(({ label, value }) => <View key={label} style={{ gap: 7 }}>
    <View style={{ flexDirection: 'row', gap: 8 }}><Text style={{ flex: 1, color: c.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.ink, fontWeight: '800', fontSize: 13 }}>{value}</Text></View>
    <View style={{ height: 6, backgroundColor: c.background, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ height: 6, width: `${Math.max(0, value / max * 100)}%`, backgroundColor: c.brand, borderRadius: 3 }} />
    </View>
  </View>)}</View>;
}
export function PanelLogout() {
  const c = useColors(); const router = useRouter(); const { logout } = useSession();
  const [busy, setBusy] = useState(false);
  return <Pressable accessibilityRole="button" disabled={busy} onPress={() => Alert.alert('Hesabdan çıxış', 'Bu cihazdakı sessiya bağlansın?', [
    { text: 'Ləğv et', style: 'cancel' }, { text: 'Çıx', style: 'destructive', onPress: () => { setBusy(true); void logout().then(() => router.replace('/login')).catch((error) => Alert.alert('Çıxış alınmadı', error.message)).finally(() => setBusy(false)); } },
  ])} style={{ minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: '#edccc8', backgroundColor: '#fff5f3', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
    <LogOut size={17} color={c.danger} /><Text style={{ color: c.danger, fontSize: 13, fontWeight: '700' }}>{busy ? 'Çıxılır…' : 'Hesabdan çıx'}</Text>
  </Pressable>;
}
