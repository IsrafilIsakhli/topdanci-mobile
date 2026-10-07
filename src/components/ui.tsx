import { OfflineBanner } from '../features/network/connectivity';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { LayoutDashboard, Package, Store, Menu, ClipboardList, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../theme/colors';
import { mediaUrl, warnUnresolvedMedia } from '../lib/media';
import { reportImageLoadFailure } from '../lib/remote-image';
import { DEMO_CATALOG } from '../api/config';
import { PublicBottomNav } from './public-bottom-nav';

export type ScreenList<T> = {
  /** Uzun siyahılar üçün virtualizasiya olunan məlumat. */
  data: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  empty?: ReactNode;
  footer?: ReactNode;
  extraData?: unknown;
  onEndReached?: () => void;
};

export function Screen<T>({ title, eyebrow, children, mode = 'public', back = false, showDemoBanner = true, list, headerContent, contentStyle }: {
  title: string; eyebrow?: string; children: ReactNode; mode?: 'public' | 'seller' | 'admin'; back?: boolean;
  showDemoBanner?: boolean; list?: ScreenList<T>;
  headerContent?: ReactNode; contentStyle?: ViewStyle;
}) {
  const c = useColors(); const router = useRouter(); const insets = useSafeAreaInsets();
  const listRenderItem = list?.renderItem;
  const renderItem = useCallback(({ item, index }: { item: T; index: number }) =>
    <>{listRenderItem?.(item, index)}</>, [listRenderItem]);
  const header = <>
    {mode === 'public' && DEMO_CATALOG && showDemoBanner &&
      <Text style={{ color: c.brand, backgroundColor: c.brandSoft, borderRadius: 8, padding: 9, fontWeight: '700' }}>
        Nümunə kataloq · Məlumatlar test üçündür
      </Text>}
    {eyebrow && <Text style={{ color: c.muted, marginBottom: 8 }}>{eyebrow}</Text>}
    {children}
  </>;
  return <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
    <OfflineBanner />
    <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
      {headerContent ?? <>
      {back && <Pressable accessibilityRole="button" accessibilityLabel="Geri"
        onPress={() => router.canGoBack() ? router.back() : router.replace(mode === 'admin' ? '/admin' : mode === 'seller' ? '/seller' : '/home')}
        style={({ pressed }) => ({ width: 44, minHeight: 44, borderRadius: 14, backgroundColor: pressed ? c.brandSoft : c.background,
          alignItems: 'center', justifyContent: 'center' })}><ArrowLeft size={20} color={c.ink} /></Pressable>}
      <View style={{ flex: 1 }}><Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>TOPDANBAZAR</Text>
        <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800' }}>{title}</Text></View></>}
    </View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{list
      ? <FlatList
          data={list.data as T[]}
          renderItem={renderItem}
          keyExtractor={(item, index) => list.keyExtractor(item, index)}
          extraData={list.extraData}
          ListHeaderComponent={<>{header}</>}
          ListEmptyComponent={list.empty ? <>{list.empty}</> : null}
          ListFooterComponent={list.footer ? <>{list.footer}</> : null}
          onEndReached={list.onEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, contentStyle]}
        />
      : <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{header}</ScrollView>}</KeyboardAvoidingView>
    {mode === 'public' ? <PublicBottomNav /> : <BottomNav mode={mode} />}
  </View>;
}
function BottomNav({ mode }: { mode: 'public' | 'seller' | 'admin' }) {
  const c = useColors(); const router = useRouter(); const path = usePathname(); const insets = useSafeAreaInsets();
  const links = mode === 'seller'
    ? [['Panel', '/seller'], ['Məhsullar', '/seller/products'], ['Mağazam', '/seller/store'], ['Menyu', '/seller/more']]
    : mode === 'admin'
      ? [['Panel', '/admin'], ['Müraciətlər', '/admin/applications'], ['Məhsullar', '/admin/products'], ['Menyu', '/admin/more']]
      : [['Ana', '/home'], ['Məhsullar', '/products'], ['Mağazalar', '/stores'], ['Daha çox', '/more']];
  const icons = mode === 'seller' ? [LayoutDashboard, Package, Store, Menu] : [LayoutDashboard, ClipboardList, Package, Menu];
  return <View style={[styles.nav, { backgroundColor: c.surface, borderTopColor: c.line, paddingTop: 7, paddingBottom: Math.max(insets.bottom, 10) }]}>
    {links.map(([label, href], index) => {
      const active = path === href || (index !== 0 && path.startsWith(href + '/'));
      const Icon = icons[index];
      return <Pressable key={href} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}
        style={{ flex: 1, minHeight: 48, alignItems: 'center', gap: 4 }} onPress={() => { if (path !== href) router.navigate(href as never); }}>
        <View style={{ width: 44, height: 29, borderRadius: 11, backgroundColor: active ? c.brandSoft : 'transparent', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={active ? c.brand : c.muted} /></View>
        <Text style={{ color: active ? c.brand : c.muted, fontSize: 10, fontWeight: active ? '800' : '500' }}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}
export function Card({ children }: { children: ReactNode }) {
  const c = useColors(); return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>{children}</View>;
}
export function Heading({ children }: { children: ReactNode }) {
  const c = useColors(); return <Text style={{ color: c.ink, fontWeight: '800', fontSize: 22, marginBottom: 12 }}>{children}</Text>;
}
export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  const c = useColors(); return <Text style={{ color: muted ? c.muted : c.ink, lineHeight: 22 }}>{children}</Text>;
}
export function Button({ title, onPress, variant = 'primary', disabled = false }: {
  title: string; onPress: () => void; variant?: 'primary' | 'outline' | 'danger'; disabled?: boolean;
}) {
  const c = useColors();
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, {
    backgroundColor: variant === 'primary' ? c.brand : c.surface,
    borderColor: variant === 'danger' ? c.danger : c.brand, opacity: disabled ? .5 : 1,
  }]}>
    <Text style={{ color: variant === 'primary' ? c.surface : variant === 'danger' ? c.danger : c.brand, textAlign: 'center', fontWeight: '800' }}>{title}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, secureTextEntry, multiline, keyboardType }: {
  label: string; value: string; onChangeText: (text: string) => void; placeholder?: string;
  secureTextEntry?: boolean; multiline?: boolean; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}) {
  const c = useColors(); return <View style={{ marginBottom: 14 }}>
    <Text style={{ color: c.ink, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? label} placeholderTextColor={c.muted}
      secureTextEntry={secureTextEntry} multiline={multiline} keyboardType={keyboardType} autoCapitalize="none"
      style={[styles.input, { color: c.ink, backgroundColor: c.surface, borderColor: c.line, minHeight: multiline ? 100 : 46 }]} />
  </View>;
}
export function Choice({ label, options, value, onChange }: { label: string; options: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  const c = useColors(); return <View style={{ marginBottom: 14 }}>
    <Text style={{ color: c.ink, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {options.map((o) => <Pressable key={o.value} onPress={() => onChange(o.value)}
        style={[styles.chip, { backgroundColor: value === o.value ? c.brand : c.surface, borderColor: c.line }]}>
        <Text style={{ color: value === o.value ? c.surface : c.ink }}>{o.label}</Text>
      </Pressable>)}
    </ScrollView>
  </View>;
}
export function Row({ title, subtitle, onPress, divider = true }: { title: string; subtitle?: string; onPress?: () => void; divider?: boolean }) {
  const c = useColors(); return <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, { borderBottomColor: c.line }, !divider && { borderBottomWidth: 0 }]}>
    <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontWeight: '700' }}>{title}</Text>
      {subtitle && <Text style={{ color: c.muted, marginTop: 4 }}>{subtitle}</Text>}</View>
    {onPress && <Text style={{ color: c.brand, fontSize: 20 }}>›</Text>}
  </Pressable>;
}
export function RemoteImage({ uri, height = 160, marginBottom = 12, recyclingKey }: {
  uri?: string | null; height?: number; marginBottom?: number; recyclingKey?: string;
}) {
  const resolved = mediaUrl(uri);
  return <RemoteImageSource key={resolved ?? 'empty'} uri={uri} resolved={resolved}
    height={height} marginBottom={marginBottom} recyclingKey={recyclingKey} />;
}
function RemoteImageSource({ uri, resolved, height, marginBottom, recyclingKey }: {
  uri?: string | null; resolved: string | null; height: number; marginBottom: number; recyclingKey?: string;
}) {
  const c = useColors();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  // Ünvan dəyişəndə komponentin key-i dəyişir və köhnə şəkil xətası sıfırlanır.
  // Ünvan heç qurula bilmirsə səbəbi development log-una yazırıq (xəta sükutla udulmur).
  useEffect(() => { if (!resolved) warnUnresolvedMedia(uri); }, [resolved, uri]);
  const usableUri = resolved && resolved !== failedUri ? resolved : null;
  return usableUri
    ? <Image source={{ uri: usableUri }} contentFit="cover" cachePolicy="memory-disk" transition={0}
        recyclingKey={recyclingKey ?? usableUri}
        onError={(event) => {
          setFailedUri(usableUri);
          // Dekoderin xətasını araşdır: HTTP status, Content-Type və ilk baytlar log-a düşür.
          void reportImageLoadFailure(usableUri, event.error, 'RemoteImage');
        }}
        style={{ width: '100%', height, borderRadius: 12, marginBottom }} />
    : <View style={{ height, borderRadius: 12, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom }}>
        <Text style={{ color: c.brand, fontSize: 30, fontWeight: '800' }}>TB</Text>
      </View>;
}
export function Loading() { const c = useColors(); return <ActivityIndicator color={c.brand} style={{ marginVertical: 30 }} />; }
export function Notice({ message }: { message: string }) {
  const c = useColors(); return <Card><Text style={{ color: c.muted, textAlign: 'center', lineHeight: 22 }}>{message}</Text></Card>;
}
const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', gap: 14, alignItems: 'center' },
  content: { padding: 18, paddingBottom: 35, gap: 12 },
  nav: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 11 },
  navItem: { flex: 1, alignItems: 'center', padding: 4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  row: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1 },
  button: { padding: 13, borderRadius: 11, borderWidth: 1, minHeight: 46, justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9, marginRight: 7 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: 'top' },
});
