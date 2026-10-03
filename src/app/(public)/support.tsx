import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { CheckCircle2, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../api/client';
import { DEMO_CATALOG } from '../../api/config';
import { PublicPage } from '../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../components/form-ui';
import { emptySupport, supportErrors, supportPayload, type FormErrors, type SupportForm } from '../../features/account/public-forms';
import { useColors } from '../../theme/colors';

export default function Support() {
  const c = useColors(); const router = useRouter();
  const [form, setForm] = useState({ ...emptySupport }); const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const update = (field: keyof SupportForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value })); setErrors((previous) => ({ ...previous, [field]: '' })); setMessage('');
  };
  async function submit() {
    if (lock.current) return;
    Keyboard.dismiss(); setMessage(''); const next = supportErrors(form); setErrors(next);
    if (Object.keys(next).length) return;
    if (DEMO_CATALOG) { setMessage('Forma düzgündür. Nümunə rejimində mesaj göndərilmir; yazdıqlarınız formadadır.'); return; }
    lock.current = true; setBusy(true);
    try { await api.post('/support/requests', supportPayload(form)); setSent(true); setForm({ ...form, message: '' }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Mesaj göndərilmədi. Yenidən yoxlayın.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <PublicPage title="Dəstək və əlaqə" back scrollKey={sent ? 'sent' : 'form'}>
    {sent ? <FormSection title="Mesajınız qeydə alındı">
      <CheckCircle2 size={42} color={c.brand} /><Text style={{ color: c.muted, fontSize: 13, lineHeight: 20 }}>Müraciətinizi göstərdiyiniz əlaqə məlumatları ilə cavablandıracağıq.</Text>
      <FormButton title="Hesab bölməsinə qayıt" onPress={() => router.replace('/more')} />
      <FormButton title="Yeni mesaj yaz" secondary onPress={() => { setSent(false); setMessage(''); }} />
    </FormSection> : <>
      <View style={{ gap: 9 }}><MessageCircle size={28} color={c.brand} /><Text style={{ color: c.ink, fontSize: 23, fontWeight: '800' }}>Sizi dinləyirik</Text>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 19 }}>Sualınızı, təklifinizi və ya qarşılaşdığınız problemi bizə yazın.</Text></View>
      {DEMO_CATALOG && <FormNote>Nümunə rejimində mesaj serverə göndərilmir. Formanın doldurulmasını yoxlaya bilərsiniz.</FormNote>}
      <FormSection title="Nə ilə bağlı yazırsınız?" subtitle="Mövzu seçin və ya aşağıda öz mövzunuzu yazın.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Hesaba giriş', 'Mağaza müraciəti', 'Məhsulla bağlı', 'Təklif və rəy'].map((subject) => <Pressable key={subject}
          accessibilityRole="button" accessibilityState={{ selected: form.subject === subject }} disabled={busy} onPress={() => update('subject', subject)}
          style={{ minHeight: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: form.subject === subject ? c.brand : c.background, justifyContent: 'center' }}>
          <Text style={{ color: form.subject === subject ? c.surface : c.ink, fontSize: 11, fontWeight: '600' }}>{subject}</Text></Pressable>)}</View>
        <FormInput label="Mövzu" value={form.subject} onChangeText={(value) => update('subject', value)} error={errors.subject} optional
          placeholder="Müraciətinizin mövzusu" maxLength={160} autoCapitalize="sentences" editable={!busy} />
        <FormInput label="Mesaj" value={form.message} onChangeText={(value) => update('message', value)} error={errors.message}
          placeholder="Problemi və ya sualınızı ətraflı yazın…" multiline maxLength={1600} autoCapitalize="sentences" editable={!busy}
          hint={form.message.length + '/1600 simvol · Ən azı 10 simvol'} />
      </FormSection>
      <FormSection title="Sizə necə cavab verək?">
        <FormInput label="Ad və soyad" value={form.name} onChangeText={(value) => update('name', value)} error={errors.name}
          placeholder="Adınızı və soyadınızı yazın" maxLength={120} autoCapitalize="words" autoComplete="name" editable={!busy} />
        <FormInput label="E-poçt" value={form.email} onChangeText={(value) => update('email', value)} error={errors.email}
          placeholder="Cavab üçün e-poçt ünvanınız" maxLength={160} keyboardType="email-address" autoComplete="email" editable={!busy} />
        <FormInput label="Telefon" value={form.phone} onChangeText={(value) => update('phone', value)} error={errors.phone}
          optional placeholder="+994…" maxLength={32} keyboardType="phone-pad" autoComplete="tel" editable={!busy} />
        {Object.values(errors).some(Boolean) && <FormNote error>Qırmızı ilə işarələnmiş xanaları yoxlayın.</FormNote>}
        {!!message && <FormNote error={!DEMO_CATALOG}>{message}</FormNote>}
        <FormButton title={busy ? 'Göndərilir…' : DEMO_CATALOG ? 'Formanı yoxla' : 'Mesajı göndər'} busy={busy} onPress={() => void submit()} />
      </FormSection>
    </>}
  </PublicPage>;
}
