import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronRight, FileText, Shapes, Users, Store, History } from 'lucide-react-native';
import { api } from '../../../../api/client';
import type { AdminRecord, Product } from '../../../../api/types';
import { Button, Loading, Notice } from '../../../../components/ui';
import { ManagementPage as Screen, PanelCard as Card, PanelChoice as Choice, PanelSearch, SectionTitle, StatusBadge } from '../../../../features/management/ui';
import { FormInput as Field } from '../../../../components/form-ui';
import { useSession } from '../../../../features/auth/use-session';
import { DetailFields } from '../../../../features/admin/detail-fields';
import { flattenCategories, isSection, needsSuper, recordSubtitle, recordTitle, sections, type Section } from '../../../../features/admin/config';
import { useColors } from '../../../../theme/colors';
import { ProductImage } from '../../../../features/catalog/product-image';
import { valueLabel } from '../../../../lib/labels';
import { invalidateManagement } from '../../../../features/management/queries';
import { AdminAnalyticsView } from '../../../../features/management/admin-analytics';
const statusChoices: Partial<Record<Section, string[]>> = { applications: ['PENDING','APPROVED','REJECTED'], products: ['PENDING_REVIEW','ACTIVE','DRAFT','REJECTED','PASSIVE'],
  stores: ['ACTIVE','PENDING','SUSPENDED','REJECTED'], users: ['ACTIVE','SUSPENDED','DELETED'], reports: ['OPEN','IN_REVIEW','RESOLVED','REJECTED'] };
const AdminRecordCard = memo(function AdminRecordCard({ item, section, selected, onToggle, onOpen }: {
  item: AdminRecord; section: Section; selected: boolean; onToggle: (id: string) => void; onOpen?: (id: string) => void;
}) {
  const c = useColors(); const id = String(item.id);
  const Icon = section === 'stores' ? Store : section === 'users' ? Users : section === 'categories' ? Shapes : section === 'audit' ? History : FileText;
  return <View style={{ borderRadius: 18, padding: 12, borderWidth: 1, borderColor: selected ? c.brand : c.line, backgroundColor: selected ? c.brandSoft : c.surface, flexDirection: 'row', gap: 5 }}>
    {section === 'products' && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }}
      accessibilityLabel={recordTitle(item) + ': seç'} onPress={() => onToggle(id)} style={{ minWidth: 36, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: selected ? c.brand : c.line, backgroundColor: selected ? c.brand : c.surface }}>
        {selected && <Check size={17} color="#fff" />}
      </View>
    </Pressable>}
    <Pressable accessibilityRole={onOpen ? 'button' : undefined} accessibilityLabel={recordTitle(item) + ': məlumatı aç'} disabled={!onOpen}
      onPress={() => onOpen?.(id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {section === 'products' ? <View style={{ width: 56 }}><ProductImage product={item as unknown as Product} height={66} marginBottom={0} /></View> :
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={c.brand} /></View>}
      <View style={{ flex: 1, gap: 7 }}><Text numberOfLines={2} style={{ color: c.ink, fontSize: 13, fontWeight: '800', lineHeight: 18 }}>{recordTitle(item)}</Text>
        {item.status && <StatusBadge status={item.status} />}
        <Text numberOfLines={2} style={{ color: c.muted, fontSize: 10, lineHeight: 15 }}>{recordSubtitle({ ...item, status: undefined })}</Text>
      </View>{onOpen && <ChevronRight size={16} color={c.muted} />}
    </Pressable>
  </View>;
});
export default function AdminSection() {
  const { section: raw } = useLocalSearchParams<{ section: string }>(); const router = useRouter(); const c = useColors();
  const { user } = useSession(); const qc = useQueryClient();
  const section = isSection(raw) ? raw : null; const config = section ? sections[section] : null;
  const allowed = !!section && (!needsSuper(section) || user?.role === 'SUPER_ADMIN');
  const [search, setSearch] = useState(''); const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]); const [reviewNote, setReviewNote] = useState('');
  const [range, setRange] = useState('30d'); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const isObject = section === 'analytics' || section === 'system';
  const serverSearch = section === 'products' || section === 'stores' || section === 'users';
  const data = useInfiniteQuery({ queryKey: ['admin-list', section, status, serverSearch ? q : ''], initialPageParam: '',
    enabled: !!config && allowed && !isObject,
    queryFn: ({ pageParam }) => api.get<AdminRecord[]>(config!.path, section === 'categories' ? undefined : { cursor: pageParam, limit: 20, status, ...(serverSearch ? { q } : {}) }),
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined });
  const single = useQuery({ queryKey: ['admin-single', section, range], enabled: !!config && allowed && isObject,
    queryFn: () => api.get<Record<string, unknown>>(config!.path, section === 'analytics' ? { range } : undefined) });
  const rows = useMemo(() => section === 'categories' ? flattenCategories(data.data?.pages[0]?.data ?? []) as AdminRecord[] : data.data?.pages.flatMap((page) => page.data) ?? [], [section, data.data]);
  const filtered = useMemo(() => serverSearch ? rows : rows.filter((item) => (recordTitle(item) + ' ' + recordSubtitle(item)).toLocaleLowerCase('az').includes(search.toLocaleLowerCase('az'))), [rows, search, serverSearch]);
  const toggleSelected = useCallback((id: string) => setSelected((previous) => previous.includes(id) ? previous.filter((v) => v !== id) : [...previous, id]), []);
  const openRecord = useCallback((id: string) => router.push(('/admin/' + section + '/' + id) as never), [router, section]);
  const renderRow = useCallback((item: AdminRecord) => <AdminRecordCard item={item} section={section!} selected={selected.includes(String(item.id))} onToggle={toggleSelected}
    onOpen={section === 'audit' ? undefined : openRecord} />, [section, selected, toggleSelected, openRecord]);
  if (!section || !config) return <Screen title="Admin" mode="admin"><Notice message="Bölmə tapılmadı." /></Screen>;
  if (!allowed) return <Screen title="Giriş qadağandır" mode="admin"><Notice message="Bu bölmə yalnız superadmin üçündür." /></Screen>;
  function bulk(action: 'approve' | 'reject') {
    if (lock.current || !selected.length) return;
    if (action === 'reject' && reviewNote.trim().length < 3) return Alert.alert('Səbəb yazın', 'Rədd səbəbi ən az 3 simvol olmalıdır.');
    Alert.alert('Əməliyyatı təsdiqlə', selected.length + ' məhsula tətbiq edilsin?', [{ text: 'Ləğv et', style: 'cancel' }, { text: 'Təsdiqlə', onPress: () => {
      if (lock.current) return; lock.current = true; setBusy(true);
      void api.post('/admin/products/bulk/' + action, { ids: selected, ...(action === 'reject' ? { reviewNote: reviewNote.trim() } : {}) })
        .then(async () => { setSelected([]); setReviewNote(''); await invalidateManagement(qc); })
        .catch((e) => Alert.alert('Xəta', e.message)).finally(() => { lock.current = false; setBusy(false); });
    } }]);
  }
  return <Screen title={config.title} mode="admin" back list={{ data: isObject ? [] : filtered, renderItem: renderRow, extraData: selected,
    keyExtractor: (item, i) => String(item.id ?? i), empty: isObject ? null : data.isPending ? <Loading /> : data.error ? <Notice message={data.error.message} /> : <Notice message="Nəticə tapılmadı." />,
    footer: data.hasNextPage ? <Button title={data.isFetchingNextPage ? 'Yüklənir…' : 'Daha çox göstər'} disabled={data.isFetchingNextPage} onPress={() => void data.fetchNextPage()} /> : null }}>
    {section === 'analytics' && <Choice label="Göstərilən dövr" value={range} onChange={setRange} options={[{ label: '7 gün', value: '7d' }, { label: '30 gün', value: '30d' }, { label: '90 gün', value: '90d' }]} />}
    {isObject ? single.isPending ? <Loading /> : single.error ? <Notice message={single.error.message} /> : single.data && (section === 'analytics' ? <AdminAnalyticsView data={single.data.data} /> : <DetailFields value={single.data.data} />) : <>
      <PanelSearch value={search} onChange={setSearch} placeholder={serverSearch ? 'Ad və məlumatlarla axtar' : 'Yüklənmiş qeydlərdə axtar'} onSubmit={serverSearch ? () => { setQ(search.trim()); setSelected([]); } : undefined} />
      {statusChoices[section] && <Choice label="Status" value={status} onChange={(value) => { setStatus(value); setSelected([]); }}
        options={[{ label: 'Hamısı', value: '' }, ...statusChoices[section]!.map((value) => ({ value, label: valueLabel(value) }))]} />}
      {section === 'products' && !!selected.length && <Card title={selected.length + ' məhsul seçildi'}><Field label="Rədd səbəbi" value={reviewNote} onChangeText={setReviewNote} multiline />
        <Button title="Seçilənləri təsdiqlə" disabled={busy} onPress={() => bulk('approve')} />
        <Button title="Seçilənləri rədd et" variant="danger" disabled={busy} onPress={() => bulk('reject')} />
        <Pressable onPress={() => setSelected([])} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ textAlign: 'center', color: c.muted, fontSize: 12 }}>Seçimi ləğv et</Text></Pressable>
      </Card>}
      <SectionTitle title={(section === 'categories' || !serverSearch && search ? filtered.length : data.data?.pages[0]?.meta?.total ?? rows.length) + ' qeyd'}
        action={section === 'categories' ? '+ Əlavə et' : undefined} onPress={() => router.push('/admin/categories/new')} />
    </>}
  </Screen>;
}
