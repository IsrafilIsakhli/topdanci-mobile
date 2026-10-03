import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MessageCircle, Eye, Phone } from 'lucide-react-native';
import { api } from '../../../api/client';
import type { Lead } from '../../../api/types';
import { Button, Loading, Notice } from '../../../components/ui';
import { ManagementPage, PanelCard, ActionRow, PanelChoice, SectionTitle } from '../../../features/management/ui';
import { leadLabels, leadLabel, dateLabel } from '../../../features/management/format';
import { useColors } from '../../../theme/colors';
export default function SellerLeads() {
  const c = useColors(); const [range, setRange] = useState('30d'); const [type, setType] = useState('');
  const query = useInfiniteQuery({ queryKey: ['seller-leads', range, type], initialPageParam: '',
    queryFn: ({ pageParam }) => api.get<Lead[]>('/seller/leads', { range, type, cursor: pageParam, limit: 20 }),
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined });
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  return <ManagementPage title="Alıcı marağı" mode="seller" back list={{ data: items, keyExtractor: (item) => item.id,
    renderItem: (lead) => <PanelCard><ActionRow title={leadLabel(lead.type)} text={[lead.product?.title ?? lead.store?.name, dateLabel(lead.createdAt)].filter(Boolean).join('\n')}
      icon={lead.type === 'WHATSAPP_CLICK' ? <MessageCircle size={19} color={c.brand} /> : lead.type === 'PHONE_REVEAL' ? <Phone size={19} color={c.brand} /> : <Eye size={19} color={c.brand} />} /></PanelCard>,
    empty: query.isPending ? <Loading /> : query.error ? <Notice message={query.error.message} /> : <Notice message="Bu dövr üçün alıcı hadisəsi tapılmadı." />,
    footer: query.hasNextPage ? <Button title="Daha çox göstər" disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} /> : null }}>
    <PanelChoice label="Dövr" value={range} onChange={setRange} options={[{ label: '7 gün', value: '7d' }, { label: '30 gün', value: '30d' }, { label: '90 gün', value: '90d' }]} />
    <PanelChoice label="Hadisə növü" value={type} onChange={setType} options={[{ label: 'Hamısı', value: '' }, ...Object.entries(leadLabels).map(([value, label]) => ({ value, label }))]} />
    <SectionTitle title={(query.data?.pages[0]?.meta?.total ?? items.length) + ' hadisə'} />
  </ManagementPage>;
}
