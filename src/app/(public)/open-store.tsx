import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../api/client';
import { DEMO_CATALOG } from '../../api/config';
import type { Category } from '../../api/types';
import { PublicPage } from '../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../components/form-ui';
import { MainCategorySheet } from '../../features/catalog/store-directory';
import { applicationErrors, applicationPayload, emptyApplication, type FormErrors, type StoreApplicationForm } from '../../features/account/public-forms';
import { useColors } from '../../theme/colors';

export default function OpenStore() {
  const c = useColors(); const router = useRouter();
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories') });
  const [form, setForm] = useState({ ...emptyApplication }); const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({}); const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [sent, setSent] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const selectedCategory = categories.data?.data.find((item) => item.id === form.categoryId);
  const update = (field: keyof StoreApplicationForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value })); setErrors((previous) => ({ ...previous, [field]: '' })); setMessage('');
  };
  const nextStep = () => { Keyboard.dismiss(); const next = applicationErrors(form, true); setErrors(next); if (!Object.keys(next).length) setStep(2); };
  async function submit() {
    if (lock.current) return;
    Keyboard.dismiss(); setMessage(''); const next = applicationErrors(form); setErrors(next);
    if (Object.keys(next).length) {
      if (next.contactName || next.contactPhone || next.contactEmail) setStep(1);
      return;
    }
    if (DEMO_CATALOG) { setMessage('Forma düzgündür. Nümunə rejimində müraciət göndərilmir; məlumatlarınız formadadır.'); return; }
    lock.current = true; setBusy(true);
    try { await api.post('/stores/applications', applicationPayload(form)); setSent(true); setForm({ ...emptyApplication }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Müraciət göndərilmədi. Yenidən yoxlayın.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <PublicPage title="Mağaza aç" back scrollKey={sent ? 'sent' : String(step)}>
    {sent ? <FormSection title="Müraciətiniz göndərildi">
      <CheckCircle2 size={42} color={c.brand} /><Text style={{ color: c.muted, fontSize: 13, lineHeight: 20 }}>Komandamız mağaza məlumatlarını yoxlayacaq və göstərdiyiniz əlaqə vasitəsi ilə sizinlə əlaqə saxlayacaq.</Text>
      <FormButton title="Mağazalara bax" onPress={() => router.replace('/stores')} />
    </FormSection> : <>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><Store size={22} color={c.brand} />
          <Text style={{ color: c.ink, fontSize: 21, fontWeight: '800', flex: 1 }}>Biznesinizi təqdim edin</Text></View>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 19 }}>Mağaza məlumatlarını göndərin. Təsdiqdən sonra topdan təkliflərinizi kataloqa əlavə edə bilərsiniz.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{['Əlaqə məlumatları', 'Mağaza məlumatları'].map((title, index) => <View key={title}
          style={{ flex: 1, backgroundColor: step === index + 1 ? c.brandSoft : c.surface, padding: 10, borderRadius: 13, gap: 6 }}>
          <Text style={{ color: step === index + 1 ? c.brand : c.muted, fontSize: 11, fontWeight: '700' }}>{index + 1}. {title}</Text>
          <View style={{ height: 3, borderRadius: 2, backgroundColor: step >= index + 1 ? c.brand : c.line }} />
        </View>)}</View>
      </View>
      {DEMO_CATALOG && <FormNote>Nümunə rejimində formanı doldurub yoxlaya bilərsiniz. Müraciət serverə göndərilmir.</FormNote>}
      {step === 1 ? <FormSection title="Sizinlə necə əlaqə saxlayaq?" subtitle="Bu məlumatlar mağaza müraciətinin yoxlanması üçün istifadə edilir.">
        <FormInput label="Ad və soyad" value={form.contactName} onChangeText={(value) => update('contactName', value)} error={errors.contactName}
          placeholder="Adınızı və soyadınızı yazın" autoCapitalize="words" maxLength={120} autoComplete="name" />
        <FormInput label="Telefon" value={form.contactPhone} onChangeText={(value) => update('contactPhone', value)} error={errors.contactPhone}
          placeholder="+994…" keyboardType="phone-pad" maxLength={32} autoComplete="tel" />
        <FormInput label="E-poçt" value={form.contactEmail} onChangeText={(value) => update('contactEmail', value)} error={errors.contactEmail}
          optional placeholder="E-poçt ünvanınız" keyboardType="email-address" maxLength={180} autoComplete="email" />
        <FormButton title="Mağaza məlumatlarına keç" onPress={nextStep} />
      </FormSection> : <>
        <FormSection title="Mağazanız haqqında">
          <FormInput label="Mağaza və ya şirkət adı" value={form.companyName} onChangeText={(value) => update('companyName', value)} error={errors.companyName}
            placeholder="Biznesinizin adı" maxLength={160} autoCapitalize="words" editable={!busy} />
          <FormInput label="Şəhər" value={form.city} onChangeText={(value) => update('city', value)} error={errors.city}
            placeholder="Məsələn, Bakı" maxLength={80} autoCapitalize="words" editable={!busy} />
          <View style={{ gap: 7 }}><Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>Əsas kateqoriya <Text style={{ color: c.muted, fontWeight: '400' }}>· İstəyə bağlı</Text></Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Əsas mağaza kateqoriyasını seç" disabled={busy} onPress={() => { Keyboard.dismiss(); setCategoryOpen(true); }}
              style={{ minHeight: 50, borderRadius: 13, backgroundColor: c.background, borderWidth: 1, borderColor: c.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, color: selectedCategory ? c.ink : c.muted, fontSize: 13 }}>{selectedCategory?.name ?? 'Fəaliyyət sahəsini seçin'}</Text><ChevronRight size={18} color={c.brand} />
            </Pressable>
          </View>
          <FormInput label="Rayon" value={form.district} onChangeText={(value) => update('district', value)} error={errors.district}
            optional placeholder="Rayon və ya qəsəbə" maxLength={80} autoCapitalize="words" editable={!busy} />
          <FormInput label="VÖEN" value={form.taxNumber} onChangeText={(value) => update('taxNumber', value)} error={errors.taxNumber}
            optional placeholder="Vergi ödəyicisinin nömrəsi" maxLength={40} keyboardType="numeric" editable={!busy} />
          <FormInput label="Qısa təsvir" value={form.description} onChangeText={(value) => update('description', value)} error={errors.description}
            optional placeholder="Hansı məhsulların topdansatışı ilə məşğulsunuz?" multiline maxLength={1200} autoCapitalize="sentences"
            hint={form.description.length + '/1200 simvol'} editable={!busy} />
          {Object.values(errors).some(Boolean) && <FormNote error>Qırmızı ilə işarələnmiş xanaları yoxlayın.</FormNote>}
          {!!message && <FormNote error={!DEMO_CATALOG}>{message}</FormNote>}
          <FormButton title={busy ? 'Göndərilir…' : DEMO_CATALOG ? 'Formanı yoxla' : 'Müraciəti göndər'} busy={busy} onPress={() => void submit()} />
          <FormButton title="Əlaqə məlumatlarına qayıt" secondary disabled={busy} onPress={() => { setStep(1); setMessage(''); }} />
        </FormSection>
      </>}
    </>}
    {categoryOpen && <MainCategorySheet categories={categories.data?.data ?? []} value={selectedCategory?.slug ?? ''} loading={categories.isPending} emptyLabel="Kateqoriya seçmədən davam et"
      error={categories.isError} onRetry={() => void categories.refetch()} onClose={() => setCategoryOpen(false)}
      onSelect={(category) => { update('categoryId', category?.id ?? ''); setCategoryOpen(false); }} />}
  </PublicPage>;
}
