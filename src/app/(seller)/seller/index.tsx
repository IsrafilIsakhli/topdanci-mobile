import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Eye, FilePenLine, MessageCircle, Package, Store, Clock3, ArrowUpRight } from 'lucide-react-native';
import { api } from '../../../api/client';
import { Loading, Notice } from '../../../components/ui';
import { ManagementPage, DashboardHero, Metrics, PanelCard, SectionTitle, ActionRow, StatusBadge } from '../../../features/management/ui';
import { useColors } from '../../../theme/colors';
import type { Lead, Store as StoreType } from '../../../api/types';
import { leadLabel, dateLabel } from '../../../features/management/format';
type Overview = { totalProducts: number; activeProducts: number; pendingProducts: number; draftProducts: number;
  whatsappClicksToday: number; storeViewsToday: number; stores: StoreType[]; recentLeads: Lead[] };
export default function SellerHome() {
  const c = useColors(); const router = useRouter();
  const query = useQuery({ queryKey: ['seller-overview'], queryFn: () => api.get<Overview>('/seller/overview') });
  const o = query.data?.data;
  return <ManagementPage title="Mağaza paneli" mode="seller">
    {query.isPending ? <Loading /> : query.error ? <Notice message={query.error.message} /> : o ? <>
      <DashboardHero label="BİZNESİNİZƏ ÜMUMİ BAXIŞ" title={o.stores[0]?.name ?? 'Mağazanızı idarə edin'}
        text="Məhsulları yeniləyin, alıcı marağını izləyin və yeni təkliflərinizi paylaşın." action="Yeni məhsul əlavə et" onPress={() => router.push('/seller/product/new')} />
      <Metrics items={[
        { label: 'Aktiv məhsullar', value: o.activeProducts, icon: <Package size={18} color={c.brand} />, onPress: () => router.push('/seller/products') },
        { label: 'Yoxlamada', value: o.pendingProducts, icon: <Clock3 size={18} color={c.brand} />, onPress: () => router.push('/seller/products') },
        { label: 'Mağaza baxışları · bu gün', value: o.storeViewsToday, icon: <Eye size={18} color={c.brand} />, onPress: () => router.push('/seller/analytics') },
        { label: 'WhatsApp klikləri · bu gün', value: o.whatsappClicksToday, icon: <MessageCircle size={18} color={c.brand} />, onPress: () => router.push('/seller/leads') },
      ]} />
      <SectionTitle title="İşlərinizi tamamlayın" />
      <PanelCard>
        <ActionRow icon={<FilePenLine size={19} color={c.brand} />} title="Qaralama məhsullar" text={o.draftProducts + ' məhsul dərc üçün hazırlanır'} onPress={() => router.push('/seller/products')} trailing={<StatusBadge status="DRAFT" />} />
        <ActionRow icon={<Store size={19} color={c.brand} />} title="Mağaza profili" text="Əlaqə məlumatı, ünvan və iş saatları" onPress={() => router.push('/seller/store')} />
      </PanelCard>
      <SectionTitle title="Son alıcı marağı" action="Hamısı" onPress={() => router.push('/seller/leads')} />
      <PanelCard>{o.recentLeads?.length ? o.recentLeads.slice(0, 3).map((lead) => <ActionRow key={lead.id} title={leadLabel(lead.type)}
        text={dateLabel(lead.createdAt)} icon={<ArrowUpRight size={19} color={c.brand} />} onPress={() => router.push('/seller/leads')} />)
        : <Notice message="Alıcı baxışları və əlaqə klikləri burada görünəcək." />}</PanelCard>
    </> : <Notice message="Panel məlumatı tapılmadı." />}
  </ManagementPage>;
}
