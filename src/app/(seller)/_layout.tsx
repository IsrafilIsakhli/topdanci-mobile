import { Redirect, Stack } from 'expo-router';
import { Loading } from '../../components/ui';
import { useReducedMotion } from '../../components/navigation-motion';
import { useColors } from '../../theme/colors';
import { useSession } from '../../features/auth/use-session';
export default function SellerLayout() {
  const { user, loading } = useSession();
  const reduced = useReducedMotion(); const c = useColors();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (!['SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Redirect href="/home" />;
  return <Stack screenOptions={({ route }) => ({ headerShown: false, contentStyle: { backgroundColor: c.background }, animation: reduced ? 'none' : route.name.includes('[id]') ? 'slide_from_right' : 'fade', animationDuration: 220, gestureEnabled: true })} />;
}
