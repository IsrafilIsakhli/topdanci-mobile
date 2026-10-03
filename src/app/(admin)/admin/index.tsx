import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ClipboardList, PackageCheck, Store, Flag, Users, Shapes, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { api } from '../../../api/client';
import type { AdminRecord } from '../../../api/types';
import { Loading, Notice } from '../../../components/ui';
import { ManagementPage, DashboardHero, Metrics, PanelCard, SectionTitle, ActionRow, StatusBadge } from '../../../features/management/ui';
import { numberValue } from '../../../features/management/format';
import { recordTitle } from '../../../features/admin/config';
import { useColors } from '../../../theme/colors';
import { useSession } from '../../../features/auth/use-session';
export default function AdminHome() {
  const c = useColors(); const router = useRouter(); const { user } = useSession();
  const query = useQuery({ queryKey: ['admin-overview'], queryFn: () => api.get<Record<string, unknown>>('/admin/overview') });
  const o = query.data?.data; const pending = numberValue(o?.pendingStores) + numberValue(o?.pendingProducts);
  const recent = Array.isArray(o?.recentStoreApplications) ? o.recentStoreApplications as AdminRecord[] : [];
  return <ManagementPage title={user?.role === 'SUPER_ADMIN' ? 'Superadmin paneli' : 'Admin paneli'} mode="admin">
    {query.isPending ? <Loading /> : query.error ? <Notice message={query.error.message} /> : o && <>
      <DashboardHero label="PLATFORMAYA ÜMUMİ BAXIŞ" title="Hər şey nəzarətinizdə."
        text={pending ? pending + ' müraciət və məhsul yoxlanış gözləyir. Qərarlarınızı mobil paneldən verin.' : 'Gözləyən yoxlanış yoxdur. Mağazaları və platformanın vəziyyətini izləyin.'}
        action="Müraciətləri yoxla" onPress={() => router.push('/admin/applications')} />
      <Metrics items={[
        { label: 'Mağaza müraciətləri', value: numberValue(o.pendingStores), icon: <ClipboardList size={18} color={c.brand} />, onPress: () => router.push('/admin/applications') },
        { label: 'Məhsul yoxlaması', value: numberValue(o.pendingProducts), icon: <PackageCheck size={18} color={c.brand} />, onPress: () => router.push('/admin/products') },
        { label: 'Aktiv mağazalar', value: numberValue(o.activeStores), icon: <Store size={18} color={c.brand} />, onPress: () => router.push('/admin/stores') },
        { label: 'Açıq şikayətlər', value: numberValue(o.openReports), icon: <Flag size={18} color={c.brand} />, onPress: () => router.push('/admin/reports') },
      ]} />
      <SectionTitle title="Son mağaza müraciətləri" action="Hamısı" onPress={() => router.push('/admin/applications')} />
      <PanelCard>{recent.length ? recent.slice(0, 3).map((item) => <Pressable key={String(item.id)} accessibilityRole="button"
        onPress={() => router.push(('/admin/applications/' + item.id) as never)} style={{ paddingVertical: 8, gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Text style={{ flex: 1, color: c.ink, fontSize: 13, fontWeight: '800' }}>{recordTitle(item)}</Text><ChevronRight size={16} color={c.muted} /></View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><StatusBadge status={item.status} /><Text style={{ color: c.muted, fontSize: 11 }}>{String(item.city ?? '')}</Text></View>
      </Pressable>) : <Text style={{ color: c.muted, fontSize: 12 }}>Yeni müraciət yoxdur.</Text>}</PanelCard>
      <SectionTitle title="Platforma idarəetməsi" />
      <PanelCard>
        {user?.role === 'SUPER_ADMIN' && <><ActionRow icon={<Users size={19} color={c.brand} />} title="İstifadəçilər" text="Hesablar, rollar və giriş statusları" onPress={() => router.push('/admin/users')} />
          <ActionRow icon={<Shapes size={19} color={c.brand} />} title="Kateqoriyalar" text="Sahələr və alt bölmələrin idarəetməsi" onPress={() => router.push('/admin/categories')} /></>}
        <ActionRow icon={<Store size={19} color={c.brand} />} title="Mağazalar" text="Mağaza məlumatlarını və statuslarını yoxlayın" onPress={() => router.push('/admin/stores')} />
      </PanelCard>
    </>}
  </ManagementPage>;
}
