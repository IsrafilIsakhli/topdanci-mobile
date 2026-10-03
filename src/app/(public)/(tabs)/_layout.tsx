import { Easing } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { PublicBottomNav } from '../../../components/public-bottom-nav';
import { PublicTabContext } from '../../../components/public-tab-context';
import { useReducedMotion } from '../../../components/navigation-motion';
import { useColors } from '../../../theme/colors';

export default function CatalogTabs() {
  const c = useColors(); const reduced = useReducedMotion();
  return <PublicTabContext.Provider value>
    <Tabs initialRouteName="home" backBehavior="history"
      tabBar={(props) => <PublicBottomNav navigator={props} />}
      screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true,
        sceneStyle: { backgroundColor: c.background },
        animation: reduced ? 'none' : 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 180, easing: Easing.out(Easing.cubic) } } }}>
      <Tabs.Screen name="home" options={{ title: 'Ana' }} />
      <Tabs.Screen name="products" options={{ title: 'Məhsullar' }} />
      <Tabs.Screen name="stores" options={{ title: 'Mağazalar' }} />
      <Tabs.Screen name="more" options={{ title: 'Hesab' }} />
    </Tabs>
  </PublicTabContext.Provider>;
}
