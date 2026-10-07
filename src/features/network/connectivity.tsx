import NetInfo from '@react-native-community/netinfo';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { focusManager, onlineManager, useQueryClient } from '@tanstack/react-query';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { DEMO_CATALOG } from '../../api/config';
import { useColors } from '../../theme/colors';
import { isConnected, setConnected, subscribeConnection } from './network-state';
export function useConnected() { return useSyncExternalStore(subscribeConnection, isConnected, () => true); }
export function ConnectivityBridge() {
 const qc = useQueryClient();
 useEffect(() => {
  const stop = NetInfo.addEventListener(state => {
   const next = state.isConnected !== false && state.isInternetReachable !== false, returned = !isConnected() && next; setConnected(next);
   // Keşdəki açıq kataloq internet olmadan da oxuna bilir.
   if (next) onlineManager.setOnline(true);
   if (returned) void qc.invalidateQueries();
  });
  const foreground = AppState.addEventListener('change', state => { focusManager.setFocused(state === 'active'); if (state === 'active') void NetInfo.refresh(); });
  return () => { stop(); foreground.remove(); };
 }, [qc]); return null;
}
export function OfflineBanner() {
 const connected = useConnected(), c = useColors();
 if (connected || DEMO_CATALOG) return null;
 return <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff3d9' }}>
 <WifiOff size={17} color="#896016"/><Text accessibilityLiveRegion="polite" style={{ color: '#75521b', flex: 1, fontSize: 11, lineHeight: 16 }}>İnternet yoxdur · Son yüklənmiş kataloq göstərilə bilər</Text>
 <Pressable accessibilityRole="button" accessibilityLabel="Bağlantını yenidən yoxla" style={{ minHeight: 36, minWidth: 40, alignItems: 'center', justifyContent: 'center' }} onPress={() => void NetInfo.refresh()}><RefreshCw size={17} color={c.brand}/></Pressable>
 </View>;
}