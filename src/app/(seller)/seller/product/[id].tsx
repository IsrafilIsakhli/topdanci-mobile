import { DraftNote, useDraft } from '../../../../features/forms/use-draft';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ChevronRight, Shapes } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../api/client';
import type { Category, Product, Store } from '../../../../api/types';
import { Button, Loading, Notice, RemoteImage, Body } from '../../../../components/ui';
import { ManagementPage as Screen, PanelCard as Card, PanelHeading as Heading, PanelChoice as Choice, StatusBadge } from '../../../../features/management/ui';
import { FormInput as Field } from '../../../../components/form-ui';
import { uploadProductImage } from '../../../../features/seller/media';
import { CategoryPicker } from '../../../../features/home/category-picker';
import { ProductImage } from '../../../../features/catalog/product-image';
import { useColors } from '../../../../theme/colors';
import { DEMO_CATALOG } from '../../../../api/config';
import { invalidateManagement } from '../../../../features/management/queries';
import { normalizeUnit, productDraftErrors } from '../../../../features/management/validation';

export default function ProductEditor() {
  const { id } = useLocalSearchParams<{ id: string }>(); const isNew = id === 'new';
  const router = useRouter(); const qc = useQueryClient();
  const stores = useQuery({ queryKey: ['seller-stores'], queryFn: () => api.get<Store[]>('/seller/stores') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories') });
  const product = useQuery({ queryKey: ['seller-product', id], enabled: !isNew, queryFn: () => api.get<Product>('/seller/products/' + id) });
  type Draft = { storeId: string; categoryId: string; title: string; description: string;
    priceType: string; price: string; unit: string; minOrder: string; stockStatus: string };
  const [draft, setDraft] = useState<Partial<Draft>>({});
  const savedDraft = useDraft('seller-product.' + id, draft, setDraft, {} as Partial<Draft>);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({}); const c = useColors();
  const original = product.data?.data;
  const storeId = draft.storeId ?? original?.store?.id ?? stores.data?.data[0]?.id ?? '';
  const categoryId = draft.categoryId ?? original?.category?.id ?? '';
  const title = draft.title ?? original?.title ?? '';
  const description = draft.description ?? original?.description ?? '';
  const priceType = draft.priceType ?? original?.priceType ?? 'NEGOTIABLE';
  const price = draft.price ?? (original?.price != null ? String(original.price) : '');
  const unit = draft.unit ?? normalizeUnit(original?.unit);
  const minOrder = draft.minOrder ?? (original?.minOrderQuantity != null ? String(original.minOrderQuantity) : '');
  const stockStatus = draft.stockStatus ?? original?.stockStatus ?? 'IN_STOCK';
  const setField = (key: keyof Draft) => (value: string) => { savedDraft.rearm(); setDraft((current) => ({ ...current, [key]: value })); };
  async function save() {
    if (busy) return;
    const next = productDraftErrors({ storeId, categoryId, title, priceType, price, minOrder }); setErrors(next);
    if (Object.keys(next).length) return Alert.alert('Məlumatları yoxlayın', Object.values(next)[0]);
    const parsedPrice = Number(price.replace(',', '.')); const parsedOrder = Number(minOrder.replace(',', '.'));
    const payload = {
      ...(isNew ? { storeId } : {}), ...(categoryId ? { categoryId } : {}),
      title: title.trim(), description: description.trim(), priceType, currency: 'AZN', unit,
      ...(priceType === 'FIXED' ? { price: parsedPrice } : {}),
      ...(minOrder ? { minOrderQuantity: parsedOrder } : {}), stockStatus,
    };
    setBusy(true);
    try {
      const response = isNew ? await api.post<Product>('/seller/products', payload) : await api.patch<Product>('/seller/products/' + id, payload);
      await invalidateManagement(qc);
      Alert.alert('Yadda saxlandı', 'Məhsul qaralama kimi saxlanıldı.');
      await savedDraft.clear(); setDraft({});
      if (isNew) router.replace(('/seller/product/' + response.data.id) as never);
      else void product.refetch();
    } catch (e) { Alert.alert('Xəta', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (busy) return;
    if (Object.keys(draft).length) return Alert.alert('Əvvəl yadda saxlayın', 'Dəyişiklikləri saxlayıb sonra yoxlamaya göndərin.');
    setBusy(true);
    try { await api.post('/seller/products/' + id + '/submit-review', {});
      await invalidateManagement(qc); await product.refetch();
      Alert.alert('Göndərildi', 'Məhsul yoxlamaya göndərildi.');
    } catch (e) { Alert.alert('Xəta', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); } finally { setBusy(false); }
  }
  async function upload() {
    setBusy(true);
    try { if (await uploadProductImage(id)) { await product.refetch(); Alert.alert('Yükləndi', 'Şəkil yoxlanılır.'); } }
    catch (e) { Alert.alert('Şəkil yüklənmədi', e instanceof Error ? e.message : 'Yenidən cəhd edin.'); } finally { setBusy(false); }
  }
  async function remove() {
    if (busy) return;
    Alert.alert('Məhsulu sil?', title, [{ text: 'Ləğv et' }, { text: 'Sil', style: 'destructive', onPress: () => {
      setBusy(true);
      void api.delete('/seller/products/' + id).then(async () => {
        await invalidateManagement(qc);
        router.replace('/seller/products');
      }).catch((e) => Alert.alert('Xəta', e.message)).finally(() => setBusy(false));
    } }]);
  }
  return <Screen title={isNew ? 'Yeni məhsul' : 'Məhsulu redaktə et'} mode="seller" back>
    {!isNew && product.isPending ? <Loading /> : !isNew && product.error ? <Notice message={product.error.message} /> : <>
      {original && <View style={{ gap: 10 }}><ProductImage product={original} height={170} marginBottom={0} /><StatusBadge status={original.status} />
        {!!original.reviewNote && <Notice message={'Yoxlama qeydi: ' + original.reviewNote} />}</View>}
      <DraftNote draft={savedDraft} />
      <Card><Heading>Əsas məlumatlar</Heading>
        <Choice label="Mağaza" value={storeId} onChange={setField('storeId')} options={(stores.data?.data ?? []).map((s) => ({ label: s.name, value: s.id }))} />
        <Pressable accessibilityRole="button" accessibilityLabel="Məhsul kateqoriyasını seç" onPress={() => setPicker(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 54, backgroundColor: c.brandSoft, borderRadius: 13 }}>
          <Shapes size={19} color={c.brand} /><Text style={{ flex: 1, color: c.brand, fontSize: 13, fontWeight: '700' }}>{categories.data?.data.find((item) => item.id === categoryId)?.name ?? 'Kateqoriya seçin'}</Text><ChevronRight size={17} color={c.brand} />
        </Pressable>
        <Field maxLength={160} label="Məhsul adı" value={title} onChangeText={setField('title')} error={errors.title} />
        <Field maxLength={5000} label="Açıqlama" value={description} onChangeText={setField('description')} multiline />
      </Card>
      <Card><Heading>Qiymət və status</Heading>
        <Choice label="Qiymət növü" value={priceType} onChange={setField('priceType')} options={[
          { label: 'Razılaşma yolu ilə', value: 'NEGOTIABLE' }, { label: 'Sabit qiymət', value: 'FIXED' },
        ]} />
        {priceType === 'FIXED' && <Field label="Qiymət (AZN)" value={price} onChangeText={setField('price')} error={errors.price} keyboardType="decimal-pad" />}
        <Choice label="Ölçü vahidi" value={unit} onChange={setField('unit')} options={[
          { label: 'Ədəd', value: 'PIECE' }, { label: 'Qutu', value: 'BOX' }, { label: 'Kq', value: 'KG' },
          { label: 'Ton', value: 'TON' }, { label: 'Metr', value: 'METER' }, { label: 'Paket', value: 'PACKAGE' },
        ]} />
        <Field label="Minimum sifariş" value={minOrder} onChangeText={setField('minOrder')} error={errors.minOrder} keyboardType="decimal-pad" />
        <Choice label="Anbar statusu" value={stockStatus} onChange={setField('stockStatus')} options={[
          { label: 'Stokda', value: 'IN_STOCK' }, { label: 'Az qalıb', value: 'LIMITED' }, { label: 'Bitib', value: 'OUT_OF_STOCK' },
        ]} />
        <Button title={busy ? 'Gözləyin…' : 'Qaralama saxla'} onPress={() => void save()} disabled={busy} />
      </Card>
      {!isNew && <Card><Heading>Şəkillər</Heading>
        {product.data?.data.images?.map((image) => <RemoteImage key={image.id} uri={image.cdnUrl} height={180} />)}
        <Button title="Şəkil seç və yüklə" variant="outline" onPress={() => void upload()} disabled={busy || DEMO_CATALOG} />
        <Body muted>{DEMO_CATALOG ? 'Test panelində yerli nümunə fotoları göstərilir. Şəkil yükləmək canlı rejimdə mümkündür.' : 'JPG, PNG və WebP; ən çox 10 MB.'}</Body>
      </Card>}
      {!isNew && <Button title="Yoxlamaya göndər" onPress={() => void submit()} disabled={busy || original?.status === 'PENDING_REVIEW' || original?.status === 'ACTIVE'} />}
      {!isNew && <Button title="Məhsulu sil" variant="danger" onPress={() => void remove()} disabled={busy} />}
    </>}
    {picker && <CategoryPicker selectionOnly visible categories={categories.data?.data ?? []} initialCategoryId={categoryId} loading={categories.isPending} error={!!categories.error}
      onRetry={() => void categories.refetch()} onClose={() => setPicker(false)} onSelect={(slug) => {
        const selected = categories.data?.data.find((item) => item.slug === slug); if (selected) { setField('categoryId')(selected.id); setPicker(false); }
      }} />}
  </Screen>;
}
