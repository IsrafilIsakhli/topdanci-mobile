import { ChartNoAxesCombined, MessageCircle } from 'lucide-react-native';
import { Metrics, PanelCard, Breakdown } from './ui';
import { leadLabel, numberValue } from './format';
import { useColors } from '../../theme/colors';
export function AdminAnalyticsView({ data }: { data: Record<string, unknown> }) {
  const c = useColors(); const counts = data.leadCounts && typeof data.leadCounts === 'object' ? data.leadCounts as Record<string, unknown> : {};
  const top = Array.isArray(data.topStores) ? data.topStores as Record<string, unknown>[] : [];
  const cities = Array.isArray(data.cityBreakdown) ? data.cityBreakdown as Record<string, unknown>[] : [];
  return <>
    <Metrics items={[{ label: 'Ümumi alıcı hadisələri', value: numberValue(data.totalLeads), icon: <ChartNoAxesCombined size={18} color={c.brand} /> },
      { label: 'WhatsApp klikləri', value: numberValue(counts.WHATSAPP_CLICK), icon: <MessageCircle size={18} color={c.brand} /> }]} />
    <PanelCard title="Platformada alıcı marağı"><Breakdown items={Object.entries(counts).map(([key, value]) => ({ label: leadLabel(key), value: numberValue(value) }))} /></PanelCard>
    {!!top.length && <PanelCard title="Ən çox maraq göstərilən mağazalar"><Breakdown items={top.slice(0, 5).map((store) => ({ label: String(store.name), value: numberValue(store.leadCount) }))} /></PanelCard>}
    {!!cities.length && <PanelCard title="Şəhərlər üzrə aktiv mağazalar"><Breakdown items={cities.map((city) => ({ label: String(city.city), value: numberValue(city.activeStores) }))} /></PanelCard>}
  </>;
}
