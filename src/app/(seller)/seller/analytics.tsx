import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartNoAxesCombined, Eye } from 'lucide-react-native';
import { api } from '../../../api/client';
import { Loading, Notice } from '../../../components/ui';
import { ManagementPage, PanelCard, Metrics, Breakdown, PanelChoice } from '../../../features/management/ui';
import { useColors } from '../../../theme/colors';
type Analytics = { totalLeads: number; leadCounts: Record<string, number>; productCounts: Record<string, number> };
const labels: Record<string, string> = { productViews: 'Məhsul baxışları', storeViews: 'Mağaza baxışları', whatsappClicks: 'WhatsApp klikləri',
  phoneReveals: 'Telefon göstərilmələri', emailClicks: 'E-poçt klikləri', draft: 'Qaralama', pendingReview: 'Yoxlamada', active: 'Aktiv', passive: 'Passiv', rejected: 'Rədd edildi' };
export default function SellerAnalytics() {
  const c = useColors(); const [range, setRange] = useState('30d');
  const query = useQuery({ queryKey: ['seller-analytics', range], queryFn: () => api.get<Analytics>('/seller/analytics', { range }) });
  const data = query.data?.data;
  return <ManagementPage title="Biznes statistikası" mode="seller" back>
    <PanelChoice label="Göstərilən dövr" value={range} onChange={setRange} options={[{ label: '7 gün', value: '7d' }, { label: '30 gün', value: '30d' }, { label: '90 gün', value: '90d' }]} />
    {query.isPending ? <Loading /> : query.error ? <Notice message={query.error.message} /> : data && <>
      <Metrics items={[{ label: 'Ümumi alıcı hadisələri', value: data.totalLeads, icon: <ChartNoAxesCombined size={18} color={c.brand} /> },
        { label: 'Məhsul baxışları', value: data.leadCounts.productViews ?? 0, icon: <Eye size={18} color={c.brand} /> }]} />
      <PanelCard title="Alıcıların marağı" text="Baxışlar və əlaqə yaratmaq üçün edilən kliklər">
        <Breakdown items={Object.entries(data.leadCounts).map(([key, value]) => ({ label: labels[key] ?? key, value }))} />
      </PanelCard>
      <PanelCard title="Məhsulların vəziyyəti"><Breakdown items={Object.entries(data.productCounts).map(([key, value]) => ({ label: labels[key] ?? key, value }))} /></PanelCard>
    </>}
  </ManagementPage>;
}
