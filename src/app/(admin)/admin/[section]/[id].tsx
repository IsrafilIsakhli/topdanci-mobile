import { useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../api/client';
import type { AdminRecord, Product } from '../../../../api/types';
import { Button, Loading, Notice } from '../../../../components/ui';
import { ManagementPage as Screen, PanelCard as Card, PanelHeading as Heading, PanelChoice as Choice, DashboardHero, StatusBadge } from '../../../../features/management/ui';
import { FormInput as Field } from '../../../../components/form-ui';
import { DetailFields } from '../../../../features/admin/detail-fields';
import { flattenCategories, isSection, needsSuper, sections, recordTitle } from '../../../../features/admin/config';
import { useSession } from '../../../../features/auth/use-session';
import { ParentCategoryField } from '../../../../features/management/parent-category-field';
import { invalidateManagement } from '../../../../features/management/queries';
import { valueLabel } from '../../../../lib/labels';
import { ProductImage } from '../../../../features/catalog/product-image';

export default function AdminDetail() {
  const { section: raw, id } = useLocalSearchParams<{ section: string; id: string }>();
  const section = isSection(raw) ? raw : null; const isNew = section === 'categories' && id === 'new';
  const { user } = useSession(); const router = useRouter(); const qc = useQueryClient();
  const allowed = !!section && (!needsSuper(section) || user?.role === 'SUPER_ADMIN');
  const [reviewNote, setReviewNote] = useState(''); const [reason, setReason] = useState('');
  type Draft = { name: string; slug: string; description: string; icon: string; parentId: string;
    sortOrder: string; role: string; status: string };
  const [draft, setDraft] = useState<Partial<Draft>>({});
  const [busy, setBusy] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');
  const field = (key: keyof Draft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const query = useQuery({
    queryKey: ['admin-detail', section, id], enabled: allowed && !isNew,
    queryFn: async () => {
      if (section === 'categories') {
        const response = await api.get<AdminRecord[]>('/admin/categories/tree');
        return { data: flattenCategories(response.data).find((item) => item.id === id) as AdminRecord | undefined };
      }
      return api.get<AdminRecord>(sections[section!].path + '/' + encodeURIComponent(id));
    },
  });
  const record = query.data?.data;
  const name = draft.name ?? String(record?.name ?? '');
  const slug = draft.slug ?? String(record?.slug ?? '');
  const description = draft.description ?? String(record?.description ?? '');
  const icon = draft.icon ?? String(record?.icon ?? '');
  const parentId = draft.parentId ?? String(record?.parentId ?? '');
  const sortOrder = draft.sortOrder ?? String(record?.sortOrder ?? 0);
  const role = draft.role ?? String(record?.role ?? 'SELLER');
  const status = draft.status ?? String(record?.status ?? 'ACTIVE');
  async function action(label: string, endpoint: string, body: unknown = {}) {
    if (busy) return;
    Alert.alert('Təsdiqləyin', label + ' əməliyyatı tətbiq edilsin?', [
      { text: 'Ləğv et' },
      { text: 'Təsdiqlə', onPress: () => {
        setBusy(true);
        void api.post<{ setup?: { url?: string } }>(endpoint, body).then(async (response) => {
          if (section === 'applications' && response.data?.setup?.url) setSetupUrl(response.data.setup.url);
          Alert.alert('Hazırdır', 'Əməliyyat qeydə alındı.');
          await invalidateManagement(qc);
          await qc.invalidateQueries({ queryKey: ['admin-list', section] });
          await qc.invalidateQueries({ queryKey: ['admin-detail', section, id] });
        }).catch((e) => Alert.alert('Xəta', e.message)).finally(() => setBusy(false));
      } },
    ]);
  }
  async function patch(endpoint: string, body: unknown) {
    setBusy(true);
    try {
      await api.patch(endpoint, body);
      await invalidateManagement(qc);
      await qc.invalidateQueries({ queryKey: ['admin-list', section] });
      await qc.invalidateQueries({ queryKey: ['admin-detail', section, id] });
      Alert.alert('Yadda saxlandı');
    } catch (e) { Alert.alert('Xəta', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); }
    finally { setBusy(false); }
  }
  async function saveCategory() {
    if (name.trim().length < 2) return Alert.alert('Kateqoriya adını yazın');
    if (!Number.isFinite(Number(sortOrder)) || Number(sortOrder) < 0) return Alert.alert('Sıralama sıfır və ya müsbət rəqəm olmalıdır.');
    const body = { name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(icon.trim() ? { icon: icon.trim() } : {}),
      parentId: parentId.trim() || null,
      sortOrder: Number(sortOrder) || 0 };
    setBusy(true);
    try {
      if (isNew) await api.post('/admin/categories', body);
      else await api.patch('/admin/categories/' + id, body);
      await invalidateManagement(qc);
      await qc.invalidateQueries({ queryKey: ['admin-list', 'categories'] });
      Alert.alert('Yadda saxlandı');
      if (isNew) router.back();
      else void query.refetch();
    } catch (e) { Alert.alert('Xəta', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); }
    finally { setBusy(false); }
  }
  if (!section) return <Screen title="Admin" mode="admin"><Notice message="Bölmə tapılmadı." /></Screen>;
  if (needsSuper(section) && user?.role !== 'SUPER_ADMIN') return <Screen title="Giriş qadağandır" mode="admin"><Notice message="Bu bölmə yalnız baş admin üçündür." /></Screen>;
  const base = section === 'categories' ? '/admin/categories/' + id : sections[section].path + '/' + id;
  return <Screen title={isNew ? 'Yeni kateqoriya' : sections[section].title} mode="admin" back>
    {!isNew && query.isPending ? <Loading /> : !isNew && query.error ? <Notice message={query.error.message} /> : !isNew && !record ? <Notice message="Qeyd tapılmadı." /> : <>
      {record && <><DashboardHero label={sections[section].title.toLocaleUpperCase('az')} title={recordTitle(record)} text="Məlumatları yoxlayın və uyğun əməliyyatı seçin." />
        <StatusBadge status={record.status} />
        {section === 'products' && <View><ProductImage product={record as unknown as Product} height={160} marginBottom={0} /></View>}
        <DetailFields value={record} /></>}
      {section === 'categories' && <Card><Heading>Kateqoriya məlumatı</Heading>
        <Field label="Ad" value={name} onChangeText={field('name')} />
        <Field label="Slug" value={slug} onChangeText={field('slug')} />
        <ParentCategoryField value={parentId} currentId={id} onChange={field('parentId')} />
        <Field label="Təsvir" value={description} onChangeText={field('description')} multiline />
        <Field label="İkon" value={icon} onChangeText={field('icon')} />
        <Field label="Sıralama" value={sortOrder} onChangeText={field('sortOrder')} keyboardType="numeric" />
        <Button title="Yadda saxla" onPress={() => void saveCategory()} disabled={busy} />
        {!isNew && <><Button title="Deaktiv et" variant="danger" onPress={() => void action('Kateqoriyanı deaktiv et', base + '/deactivate')} disabled={busy} />
          <Button title="Aktiv et" variant="outline" onPress={() => void action('Kateqoriyanı aktiv et', base + '/reactivate')} disabled={busy} /></>}
      </Card>}
      {section === 'applications' && <Card><Heading>Müraciətə qərar ver</Heading>
        {!!setupUrl && <View style={{ gap: 8 }}><Heading>Hesabın qurulma keçidi</Heading><Text selectable style={{ lineHeight: 20 }}>{setupUrl}</Text></View>}
        <Field label="İcmal qeydi / rədd səbəbi" value={reviewNote} onChangeText={setReviewNote} multiline />
        <Button title="Mağazanı təsdiqlə" onPress={() => void action('Mağazanı təsdiqlə', base + '/approve', reviewNote.trim() ? { reviewNote: reviewNote.trim() } : {})} disabled={busy || record?.status !== 'PENDING'} />
        <Button title="Rədd et" variant="danger" onPress={() => reviewNote.trim().length >= 3
          ? void action('Müraciəti rədd et', base + '/reject', { reviewNote: reviewNote.trim() })
          : Alert.alert('Səbəb yazın', 'Ən az 3 simvol lazımdır.')} disabled={busy || record?.status !== 'PENDING'} />
      </Card>}
      {section === 'products' && <Card><Heading>Məhsul yoxlaması</Heading>
        <Field label="Rədd və dayandırma qeydi" value={reviewNote} onChangeText={setReviewNote} multiline />
        <Button title="Təsdiqlə" onPress={() => void action('Məhsulu təsdiqlə', base + '/approve')} disabled={busy} />
        <Button title="Rədd et" variant="danger" onPress={() => reviewNote.trim().length >= 3
          ? void action('Məhsulu rədd et', base + '/reject', { reviewNote: reviewNote.trim() })
          : Alert.alert('Rədd səbəbini yazın')} disabled={busy} />
        <Button title="Dayandır" variant="outline" onPress={() => void action('Məhsulu dayandır', base + '/suspend', { reviewNote: reviewNote.trim() })} disabled={busy} />
        <Field label="Şikayət səbəbi" value={reason} onChangeText={setReason} multiline />
        <Button title="İşarələ" variant="outline" onPress={() => reason.trim().length >= 3
          ? void action('Məhsulu işarələ', base + '/flag', { reason: reason.trim() }) : Alert.alert('Səbəb yazın')} disabled={busy} />
      </Card>}
      {section === 'stores' && user?.role === 'SUPER_ADMIN' && <Card><Heading>Mağaza statusu</Heading>
        <Field label="Qeyd" value={reviewNote} onChangeText={setReviewNote} multiline />
        <Button title="Dayandır" variant="danger" onPress={() => void action('Mağazanı dayandır', base + '/suspend', { reviewNote: reviewNote.trim() })} disabled={busy} />
        <Button title="Yenidən aktiv et" variant="outline" onPress={() => void action('Mağazanı aktiv et', base + '/reactivate')} disabled={busy} />
      </Card>}
      {section === 'users' && <Card><Heading>İstifadəçini idarə et</Heading>
        <Choice label="Rol" value={role} onChange={field('role')} options={['BUYER','SELLER','ADMIN','SUPER_ADMIN'].map((v) => ({ label: valueLabel(v), value: v }))} />
        <Button title="Rolu yenilə" onPress={() => void patch(base + '/role', { role })} disabled={busy || id === user?.id} />
        <Choice label="Status" value={status} onChange={field('status')} options={['ACTIVE','SUSPENDED','DELETED'].map((v) => ({ label: valueLabel(v), value: v }))} />
        <Button title="Statusu yenilə" variant="outline" onPress={() => void patch(base + '/status', { status })} disabled={busy || id === user?.id} />
      </Card>}
      {section === 'reports' && <Card><Heading>Şikayətin statusu</Heading>
        <Button title="Yoxlamaya götür" onPress={() => void action('Şikayəti yoxlamaya götür', base + '/in-review')} disabled={busy} />
        <Button title="Həll edildi" variant="outline" onPress={() => void action('Şikayəti həll et', base + '/resolve')} disabled={busy} />
        <Button title="Rədd et" variant="danger" onPress={() => void action('Şikayəti rədd et', base + '/reject')} disabled={busy} />
      </Card>}
    </>}
  </Screen>;
}
