import { useContext, useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { House, PackageSearch, Store, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../theme/colors';
import { PublicTabContext } from './public-tab-context';

const links = [
  { name: 'home', label: 'Ana', href: '/home', Icon: House },
  { name: 'products', label: 'Məhsullar', href: '/products', Icon: PackageSearch },
  { name: 'stores', label: 'Mağazalar', href: '/stores', Icon: Store },
  { name: 'more', label: 'Hesab', href: '/more', Icon: UserRound },
];

export function PublicBottomNav({ navigator }: { navigator?: BottomTabBarProps } = {}) {
  const c = useColors(); const router = useRouter(); const path = usePathname();
  const insideTabs = useContext(PublicTabContext); const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if ((insideTabs && !navigator) || keyboard) return null;
  return <View style={{ flexDirection: 'row', paddingTop: 7, paddingBottom: Math.max(insets.bottom, 8),
    paddingHorizontal: 6, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line }}>
    {links.map(({ name, label, href, Icon }) => {
      const route = navigator?.state.routes.find((item) => item.name === name);
      const active = navigator ? navigator.state.routes[navigator.state.index]?.name === name
        : path === href || (href === '/products' && path.startsWith('/product/'))
        || (href === '/stores' && path.startsWith('/store/'))
        || (href === '/more' && ['/account', '/login', '/support', '/open-store', '/notifications'].includes(path));
      const press = () => {
        Keyboard.dismiss();
        if (navigator && route) {
          const event = navigator.navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigator.navigation.navigate(route.name, route.params);
        } else {
          router.dismissTo(href as never);
        }
      };
      return <Pressable key={href} accessibilityRole="tab" accessibilityLabel={label}
        accessibilityState={{ selected: active }} onPress={press}
        onLongPress={() => { if (navigator && route) navigator.navigation.emit({ type: 'tabLongPress', target: route.key }); }}
        style={({ pressed }) => ({ flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: pressed ? .65 : 1 })}>
        <View style={{ width: 48, height: 29, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: active ? c.brandSoft : 'transparent' }}>
          <Icon size={21} color={active ? c.brand : c.muted} strokeWidth={active ? 2.2 : 1.7} />
        </View>
        <Text style={{ color: active ? c.brand : c.muted, fontSize: 10, fontWeight: active ? '800' : '500' }}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}
