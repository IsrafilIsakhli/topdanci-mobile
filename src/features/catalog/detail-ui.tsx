import { SaveButton } from '../buyer/save-button';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, BadgeCheck, ChevronDown, ChevronRight, ChevronUp, Clock3, Mail, MapPin, MessageCircle, Package, Phone, Store as StoreIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Product, Store } from '../../api/types';
import { DEMO_CATALOG } from '../../api/config';
import { RemoteImage } from '../../components/ui';
import { openContact } from '../../lib/contact';
import { type ContactKind } from '../../lib/contact-links';
import { useColors } from '../../theme/colors';
import { availableContacts, storeAddress, storeHours } from './detail-data';

export function DetailFrame({ title, fallback, children, footer, accessory }: { title: string; fallback: '/products' | '/stores'; children: ReactNode; footer?: ReactNode; accessory?: ReactNode }) {
  const c = useColors(); const router = useRouter(); const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: c.background }}>
    <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: c.surface, borderBottomWidth: 1, borderColor: c.line,
      flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.canGoBack() ? router.back() : router.replace(fallback)}
        style={({ pressed }) => ({ width: 44, minHeight: 44, borderRadius: 14, backgroundColor: pressed ? c.brandSoft : c.background, alignItems: 'center', justifyContent: 'center' })}>
        <ArrowLeft size={20} color={c.ink} />
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: c.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>TOPDANBAZAR</Text>
        <Text numberOfLines={1} style={{ color: c.ink, fontSize: 20, fontWeight: '800' }}>{title}</Text>
      </View>
      {accessory}
      {DEMO_CATALOG && <View style={{ borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: c.brandSoft }}>
        <Text style={{ color: c.brand, fontSize: 10, fontWeight: '700' }}>Test kataloqu</Text>
      </View>}
    </View>
    <View style={{ flex: 1 }}>{children}</View>
    {footer ?? <View style={{ height: insets.bottom }} />}
  </View>;
}

export function DetailCard({ title, children }: { title?: string; children: ReactNode }) {
  const c = useColors();
  return <View style={{ padding: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 22, gap: 12 }}>
    {title && <Text style={{ color: c.ink, fontSize: 17, fontWeight: '800' }}>{title}</Text>}
    {children}
  </View>;
}

export function DetailState({ title, message, loading, onRetry }: { title: string; message?: string; loading?: boolean; onRetry?: () => void }) {
  const c = useColors();
  return <View style={{ padding: 24, paddingVertical: 42, gap: 13, alignItems: 'center' }}>
    {loading ? <ActivityIndicator size="large" color={c.brand} /> : <Package size={30} color={c.brand} />}
    <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
    {message && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>{message}</Text>}
    {onRetry && <Pressable accessibilityRole="button" accessibilityLabel="Yenidən yoxla" onPress={onRetry}
      style={{ paddingHorizontal: 18, minHeight: 46, borderRadius: 13, justifyContent: 'center', backgroundColor: c.brand }}>
      <Text style={{ color: c.surface, fontWeight: '700' }}>Yenidən yoxla</Text>
    </Pressable>}
  </View>;
}

export function StoreAvatar({ store, size = 46 }: { store: Store; size?: number }) {
  const c = useColors();
  const initials = store.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('az');
  return <View style={{ width: size, height: size, backgroundColor: c.brandSoft, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
    {store.logoUrl || store.logoKey ? <RemoteImage uri={store.logoUrl ?? store.logoKey} height={size} marginBottom={0} />
      : <Text style={{ color: c.brand, fontSize: size * .3, fontWeight: '800' }}>{initials}</Text>}
  </View>;
}

export function SupplierCard({ store }: { store: Store }) {
  const c = useColors(); const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel={store.name + ' mağazasına bax'} onPress={() => router.push(('/store/' + store.slug) as never)}
    style={({ pressed }) => ({ backgroundColor: pressed ? c.brandSoft : c.surface, padding: 15, borderRadius: 21, borderWidth: 1, borderColor: c.line, gap: 10 })}>
    <Text style={{ color: c.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>SATICI MAĞAZASI</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <StoreAvatar store={store} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text numberOfLines={2} style={{ color: c.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>{store.name}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
          <MapPin size={12} color={c.muted} /><Text style={{ color: c.muted, fontSize: 11 }}>{store.city ?? 'Ünvan göstərilməyib'}</Text>
          {store.verified && <BadgeCheck size={15} color={c.brand} accessibilityLabel="Təsdiqlənmiş mağaza" />}
        </View>
      </View>
      <SaveButton store={store} /><ChevronRight size={20} color={c.brand} />
    </View>
    <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>Mağaza profili və bütün məhsullar →</Text>
  </Pressable>;
}

const contactIcons = { whatsapp: MessageCircle, phone: Phone, email: Mail };

export function ContactBar({ store, product, onFallback, fallbackLabel }: { store: Store; product?: Product; onFallback: () => void; fallbackLabel: string }) {
  const c = useColors(); const insets = useSafeAreaInsets();
  const contacts = availableContacts(store, DEMO_CATALOG);
  const primary = contacts[0]; const secondary = contacts[1];
  const PrimaryIcon = primary ? contactIcons[primary.kind] : StoreIcon;
  const SecondaryIcon = secondary ? contactIcons[secondary.kind] : undefined;
  const message = product ? 'Salam, «' + product.title + '» məhsulu ilə maraqlanıram. Sifariş şərtlərini dəqiqləşdirmək istəyirəm.' : undefined;
  const press = (kind: ContactKind, value?: string | null) => void openContact(kind, value, store.id, product?.id, message);
  return <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line, gap: 7 }}>
    {!primary && <Text style={{ color: c.muted, fontSize: 11 }}>Satıcı əlaqə məlumatlarını hələ əlavə etməyib.</Text>}
    <View style={{ flexDirection: 'row', gap: 9 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={primary?.label ?? fallbackLabel}
        onPress={() => primary ? press(primary.kind, primary.value) : onFallback()}
        style={({ pressed }) => ({ flex: 1, minHeight: 50, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 15, backgroundColor: c.brand, opacity: pressed ? .8 : 1,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 })}>
        <PrimaryIcon size={20} color={c.surface} />
        <Text style={{ color: c.surface, fontSize: 14, fontWeight: '800', flexShrink: 1 }}>{primary?.label ?? fallbackLabel}</Text>
      </Pressable>
      {secondary && SecondaryIcon && <Pressable accessibilityRole="button" accessibilityLabel={secondary.label} onPress={() => press(secondary.kind, secondary.value)}
        style={({ pressed }) => ({ width: 54, minHeight: 50, backgroundColor: pressed ? c.line : c.brandSoft, borderRadius: 15, alignItems: 'center', justifyContent: 'center' })}>
        <SecondaryIcon size={21} color={c.brand} />
      </Pressable>}
    </View>
  </View>;
}

export function StoreAbout({ store }: { store: Store }) {
  const c = useColors(); const [expanded, setExpanded] = useState(false);
  const address = storeAddress(store); const hours = storeHours(store);
  const contacts = availableContacts(store);
  const demo = DEMO_CATALOG && store.id.startsWith('demo-');
  return <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Mağaza haqqında məlumat" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}
      style={{ padding: 15, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <StoreIcon size={18} color={c.brand} /><View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.ink, fontSize: 15, fontWeight: '800' }}>Mağaza haqqında</Text>
        <Text style={{ color: c.muted, fontSize: 11 }}>Ünvan, iş saatları və əlaqə</Text>
      </View>
      {expanded ? <ChevronUp size={18} color={c.brand} /> : <ChevronDown size={18} color={c.brand} />}
    </Pressable>
    {expanded && <View style={{ padding: 15, paddingTop: 0, gap: 14 }}>
      {!!store.description && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20 }}>{store.description}</Text>}
      <View style={{ flexDirection: 'row', gap: 9 }}><MapPin size={18} color={c.brand} /><View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>Ünvan</Text>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{address || 'Ünvan əlavə edilməyib.'}</Text>
      </View></View>
      <View style={{ flexDirection: 'row', gap: 9 }}><Clock3 size={18} color={c.brand} /><View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>İş saatları</Text>
        {hours.length ? hours.map((item) => <View key={item.label} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 5 }}>
          <Text style={{ color: c.muted, fontSize: 12 }}>{item.label}</Text><Text style={{ color: c.ink, fontSize: 12, fontWeight: '600' }}>{item.value}</Text>
        </View>) : <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>İş saatlarını satıcı ilə dəqiqləşdirin.</Text>}
      </View></View>
      {demo ? <Text style={{ color: c.brand, backgroundColor: c.brandSoft, padding: 11, borderRadius: 12, fontSize: 12, lineHeight: 18 }}>
        Bu mağaza test üçündür. Əlaqə düymələri canlı kataloqda satıcıya aparacaq.
      </Text> : contacts.length ? <View style={{ gap: 2 }}>
        {contacts.map(({ kind, label, value }) => { const Icon = contactIcons[kind]; return <Pressable key={kind} accessibilityRole="button" accessibilityLabel={label}
          onPress={() => void openContact(kind, value, store.id)} style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Icon size={17} color={c.brand} /><Text style={{ color: c.ink, fontSize: 12, flex: 1 }}>{value}</Text><ArrowRight size={15} color={c.brand} />
        </Pressable>; })}
      </View> : <Text style={{ color: c.muted, fontSize: 12 }}>Əlaqə məlumatı əlavə edilməyib.</Text>}
    </View>}
  </View>;
}
