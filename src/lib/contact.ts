import { Alert, Linking } from 'react-native';
import { api } from '../api/client';
import { DEMO_CATALOG } from '../api/config';
import { contactUrl, type ContactKind } from './contact-links';

export type ContactType = 'WHATSAPP_CLICK' | 'PHONE_REVEAL' | 'EMAIL_CLICK' | 'STORE_VIEW' | 'PRODUCT_VIEW';
export async function track(type: ContactType, storeId: string, productId?: string) {
  if (DEMO_CATALOG && (storeId.startsWith('demo-') || productId?.startsWith('demo-'))) return;
  try { await api.post('/leads', { type, storeId, productId, source: 'mobile' }); } catch { /* Contact is never blocked. */ }
}
export async function openContact(kind: ContactKind, value: string | null | undefined, storeId: string, productId?: string, message?: string) {
  if (DEMO_CATALOG && storeId.startsWith('demo-')) {
    Alert.alert('Nümunə kataloq', 'Bu mağaza test üçündür. Əlaqə düymələri canlı rejimdə işləyəcək.');
    return;
  }
  const url = contactUrl(kind, value, message);
  if (!url) { Alert.alert('Məlumat yoxdur', 'Satıcı düzgün əlaqə məlumatını əlavə etməyib.'); return; }
  const type = kind === 'whatsapp' ? 'WHATSAPP_CLICK' : kind === 'phone' ? 'PHONE_REVEAL' : 'EMAIL_CLICK';
  void track(type, storeId, productId);
  try { await Linking.openURL(url); } catch { Alert.alert('Açılmadı', 'Bu cihazda əlaqə tətbiqi açılmadı.'); }
}
