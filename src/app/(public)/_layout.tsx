import { Stack } from 'expo-router';
import { useReducedMotion } from '../../components/navigation-motion';
import { useColors } from '../../theme/colors';

export default function PublicLayout() {
  const c = useColors(); const reduced = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background },
    animation: reduced ? 'none' : 'slide_from_right', animationDuration: 240, gestureEnabled: true }}>
    <Stack.Screen name="(tabs)" options={{ animation: reduced ? 'none' : 'fade', animationDuration: 180 }} />
  </Stack>;
}
