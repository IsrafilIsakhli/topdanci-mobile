import { useState } from 'react';
import { Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { Store } from '../../../api/types';
import { Body, Button, Loading, Notice } from '../../../components/ui';
import { ManagementPage as Screen, PanelCard as Card, PanelHeading as Heading, DashboardHero } from '../../../features/management/ui';
import { FormInput as Field } from '../../../components/form-ui';
import { uploadStoreImage } from '../../../features/seller/media';
import { valueLabel } from '../../../lib/labels';
import { DEMO_CATALOG } from '../../../api/config';
import { isEmail, isPhone } from '../../../features/account/public-forms';
import { invalidateManagement } from '../../../features/management/queries';

export default function SellerStore() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['seller-stores'], queryFn: () => api.get<Store[]>('/seller/stores') });
  const store = query.data?.data[0];
  type Draft = { name: string; legalName: string; description: string; city: string; district: string;
    address: string; phone: string; whatsappNumber: string; email: string; workdays: string; saturday: string; sunday: string };
  const [draft, setDraft] = useState<Partial<Draft>>({});
  const [busy, setBusy] = useState(false);
  const field = (key: keyof Draft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const name = draft.name ?? store?.name ?? '';
  const legalName = draft.legalName ?? store?.legalName ?? '';
  const description = draft.description ?? store?.description ?? '';
  const city = draft.city ?? store?.city ?? '';
  const district = draft.district ?? store?.district ?? '';
  const address = draft.address ?? store?.address ?? '';
  const phone = draft.phone ?? store?.phone ?? '';
  const whatsappNumber = draft.whatsappNumber ?? store?.whatsappNumber ?? '';
  const email = draft.email ?? store?.email ?? '';
  const workdays = draft.workdays ?? String(store?.workingHours?.workdays ?? '');
  const saturday = draft.saturday ?? String(store?.workingHours?.saturday ?? '');
  const sunday = draft.sunday ?? String(store?.workingHours?.sunday ?? '');
  async function save() {
    if (!store || busy) return;
    if (name.trim().length < 2 || !city.trim()) return Alert.alert('Məlumatları yoxlayın', 'Mağaza adı və şəhər tələb olunur.');
    if (email && !isEmail(email)) return Alert.alert('E-poçtu yoxlayın');
    if (phone && !isPhone(phone) || whatsappNumber && !isPhone(whatsappNumber)) return Alert.alert('Telefon nömrəsini yoxlayın');
    setBusy(true);
    try {
      await api.patch('/seller/stores/' + store.id, { name, legalName, description, city, district, address,
        phone, whatsappNumber, email, workingHours: { workdays, saturday, sunday } });
      await invalidateManagement(qc);
      Alert.alert('Yadda saxlandı', 'Mağaza profili yeniləndi.');
    } catch (e) { Alert.alert('Xəta', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); } finally { setBusy(false); }
  }
  async function upload(kind: 'logo' | 'banner') {
    if (!store) return; setBusy(true);
    try { if (await uploadStoreImage(store.id, kind)) { await qc.invalidateQueries({ queryKey: ['seller-stores'] }); Alert.alert('Yükləndi', 'Şəkil yeniləndi.'); } }
    catch (e) { Alert.alert('Şəkil yüklənmədi', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); } finally { setBusy(false); }
  }
  return <Screen title="Mağaza profili" mode="seller">
    {query.isPending ? <Loading /> : query.error ? <Notice message={query.error.message} /> : !store ? <Notice message="Bu hesab üçün mağaza üzvlüyü görünmür." /> : <>
      <DashboardHero label="MAĞAZA PROFİLİ" title={store.name} text={valueLabel(store.status) + ' · ' + (store.productCount ?? 0) + ' məhsul · ' + (store.city ?? '')} />
      <Card><Heading>Mağaza məlumatları</Heading>
        <Field label="Mağaza adı" value={name} onChangeText={field('name')} />
        <Field label="Rəsmi ad" value={legalName} onChangeText={field('legalName')} />
        <Field label="Təsvir" value={description} onChangeText={field('description')} multiline />
        <Field label="Şəhər" value={city} onChangeText={field('city')} />
        <Field label="Rayon" value={district} onChangeText={field('district')} />
        <Field label="Ünvan" value={address} onChangeText={field('address')} />
      </Card>
      <Card><Heading>Əlaqə</Heading>
        <Field label="Telefon" value={phone} onChangeText={field('phone')} keyboardType="phone-pad" />
        <Field label="WhatsApp" value={whatsappNumber} onChangeText={field('whatsappNumber')} keyboardType="phone-pad" />
        <Field label="E-poçt" value={email} onChangeText={field('email')} keyboardType="email-address" />
      </Card>
      <Card><Heading>İş saatları</Heading>
        <Field label="Bazar ertəsi – Cümə" value={workdays} onChangeText={field('workdays')} />
        <Field label="Şənbə" value={saturday} onChangeText={field('saturday')} />
        <Field label="Bazar" value={sunday} onChangeText={field('sunday')} />
      </Card>
      <Card><Heading>Mağaza şəkilləri</Heading>
        <Button title="Loqo yüklə" variant="outline" onPress={() => void upload('logo')} disabled={busy || DEMO_CATALOG} />
        <Button title="Örtük şəkli yüklə" variant="outline" onPress={() => void upload('banner')} disabled={busy || DEMO_CATALOG} />
        {DEMO_CATALOG && <Body muted>Şəkil yükləmə canlı rejimdə işləyir.</Body>}
      </Card>
      <Button title={busy ? 'Gözləyin…' : 'Profili yadda saxla'} onPress={() => void save()} disabled={busy} />
    </>}
  </Screen>;
}
