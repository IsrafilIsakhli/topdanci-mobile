import { PushBridge } from '../features/buyer/push';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useReducedMotion } from '../components/navigation-motion';
import { useColors } from '../theme/colors';
import { getAuthSnapshot, subscribeAuth } from '../api/auth-store';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });
export default function RootLayout() {
  const reduced = useReducedMotion(); const c = useColors();
  useEffect(() => { Appearance.setColorScheme('light'); }, []);
  useEffect(() => {
    const identity = () => { const user = getAuthSnapshot(); return user ? user.id + ':' + user.role : ''; };
    let id = identity();
    return subscribeAuth(() => { const next = identity(); if (next !== id) { id = next; queryClient.clear(); } });
  }, []);
  return <SafeAreaProvider><QueryClientProvider client={queryClient}>
    <PushBridge />
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade', animationDuration: 180, contentStyle: { backgroundColor: c.background } }} />
  </QueryClientProvider></SafeAreaProvider>;
}
