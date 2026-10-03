import { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogIn, Store, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { PublicPage, IntroCard } from '../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../components/form-ui';
import { useSession } from '../../features/auth/use-session';
import { getAuthSnapshot } from '../../api/auth-store';
import { DEMO_CATALOG } from '../../api/config';
import { loginErrors, type FormErrors } from '../../features/account/public-forms';
import { useColors } from '../../theme/colors';
import { demoAccounts } from '../../features/auth/demo-accounts';

export default function LoginScreen() {
  const c = useColors(); const router = useRouter(); const { login } = useSession();
  const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [errors, setErrors] = useState<FormErrors>({}); const [message, setMessage] = useState('');
  async function submit() {
    if (lock.current) return;
    Keyboard.dismiss(); setMessage('');
    const next = loginErrors(identifier, password); setErrors(next);
    if (Object.keys(next).length) return;
    lock.current = true; setBusy(true);
    try {
      await login(identifier.trim(), password);
      const role = getAuthSnapshot()?.role;
      router.replace(role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin' : role === 'SELLER' ? '/seller' : '/home');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Giriş alınmadı. Yenidən yoxlayın.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <PublicPage title="Daxil ol" back>
    <IntroCard eyebrow="HESABINIZA XOŞ GƏLMİSİNİZ" title="Biznesinizi idarə edin"
      text="Satıcı və admin hesabınızla məhsullara, müraciətlərə və hesab məlumatlarına keçin." icon={<LogIn size={22} color="#ffffff" />} />
    {DEMO_CATALOG && <View style={{ gap: 10 }}>
      <FormNote>Test panellərinə baxın. Bu hesablar yalnız nümunə rejimində işləyir; dəyişikliklər real kataloqa göndərilmir.</FormNote>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{demoAccounts.map((account) => <Pressable key={account.id}
        accessibilityRole="button" accessibilityLabel={account.title + ': test girişini doldur'} disabled={busy}
        onPress={() => { setIdentifier(account.email); setPassword(account.password); setErrors({}); setMessage(''); }}
        style={({ pressed }) => ({ flex: 1, minWidth: 135, padding: 14, borderRadius: 16, gap: 8,
          borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.brandSoft : c.surface })}>
        {account.role === 'SELLER' ? <Store size={21} color={c.brand} /> : <ShieldCheck size={21} color={c.brand} />}
        <Text style={{ color: c.ink, fontSize: 13, fontWeight: '800' }}>{account.title}</Text>
        <Text style={{ color: c.muted, fontSize: 11 }}>{account.email}</Text>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>Girişi doldur</Text><ArrowRight size={14} color={c.brand} /></View>
      </Pressable>)}</View>
    </View>}
    <FormSection title="Giriş məlumatları">
      <FormInput label="E-poçt və ya telefon" value={identifier} onChangeText={(value) => { setIdentifier(value); setErrors({ ...errors, identifier: '' }); setMessage(''); }}
        error={errors.identifier} placeholder="E-poçt və ya +994…" maxLength={180} autoComplete="username" textContentType="username" editable={!busy} />
      <FormInput label="Şifrə" value={password} onChangeText={(value) => { setPassword(value); setErrors({ ...errors, password: '' }); setMessage(''); }}
        error={errors.password} placeholder="Şifrənizi yazın" secureTextEntry maxLength={128} autoComplete="current-password"
        textContentType="password" returnKeyType="go" onSubmitEditing={() => void submit()} editable={!busy} />
      {!!message && <FormNote error>{message}</FormNote>}
      <Pressable accessibilityRole="button" onPress={() => router.push('/forgot-password')} disabled={busy} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.brand, fontSize: 13, fontWeight: '700' }}>Şifrəni unutdum</Text></Pressable>
      <FormButton title={busy ? 'Daxil olunur…' : 'Daxil ol'} busy={busy} onPress={() => void submit()} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/support')} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>Girişlə bağlı kömək lazımdır?</Text>
      </Pressable>
    </FormSection>
    <View style={{ backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.line, padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Store size={19} color={c.brand} />
        <Text style={{ color: c.ink, fontSize: 14, fontWeight: '700' }}>Hələ mağazanız yoxdur?</Text></View>
      <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Müraciət edin. Təsdiqdən sonra hesabınıza giriş üçün məlumat veriləcək.</Text>
      <FormButton title="Mağaza açmaq üçün müraciət et" secondary onPress={() => router.push('/open-store')} />
    </View>
  </PublicPage>;
}
