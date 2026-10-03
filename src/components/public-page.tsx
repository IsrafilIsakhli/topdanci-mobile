import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../theme/colors';
import { PublicBottomNav } from './public-bottom-nav';

export function PublicHeader({ title, back = false, accessory }: { title: string; back?: boolean; accessory?: ReactNode }) {
  const c = useColors(); const router = useRouter();
  return <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.surface, borderBottomColor: c.line, borderBottomWidth: 1 }}>
    {back && <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.canGoBack() ? router.back() : router.replace('/more')}
      style={{ width: 44, minHeight: 44, borderRadius: 14, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
      <ArrowLeft size={20} color={c.ink} />
    </Pressable>}
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={{ color: c.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>TOPDANBAZAR</Text>
      <Text style={{ color: c.ink, fontWeight: '800', fontSize: 22, letterSpacing: -.5 }}>{title}</Text>
    </View>
    {accessory}
  </View>;
}
export function PublicPage({ title, back = false, children, scrollKey }: { title: string; back?: boolean; children: ReactNode; scrollKey?: string }) {
  const c = useColors(); const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
    <PublicHeader title={title} back={back} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView key={scrollKey} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}>{children}</ScrollView>
    </KeyboardAvoidingView>
    <PublicBottomNav />
  </View>;
}
export function IntroCard({ eyebrow, title, text, icon }: { eyebrow?: string; title: string; text: string; icon?: ReactNode }) {
  const c = useColors();
  return <View style={{ backgroundColor: c.brand, padding: 20, borderRadius: 22, gap: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' }}>
        {icon ?? <Store color="#ffffff" size={22} />}
      </View>
      {eyebrow && <Text style={{ color: '#d0ede2', fontSize: 10, fontWeight: '700', letterSpacing: .8, flex: 1 }}>{eyebrow}</Text>}
    </View>
    <Text style={{ color: '#ffffff', fontSize: 23, fontWeight: '800', lineHeight: 29, letterSpacing: -.5 }}>{title}</Text>
    <Text style={{ color: '#d0ede2', fontSize: 12, lineHeight: 19 }}>{text}</Text>
  </View>;
}
