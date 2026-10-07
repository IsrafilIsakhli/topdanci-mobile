import { BuyerMenu } from '../../features/buyer/menu';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, HelpCircle, LayoutDashboard, ShieldCheck, UserRound } from 'lucide-react-native';
import { api } from '../../api/client';
import type { SessionUser } from '../../api/types';
import { useSession } from '../../features/auth/use-session';
import { isEmail, isPhone, passwordErrors, type FormErrors } from '../../features/account/public-forms';
import { valueLabel } from '../../lib/labels';
import { PublicPage, IntroCard } from '../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection, MenuItem } from '../../components/form-ui';
import { useColors } from '../../theme/colors';
import { DEMO_CATALOG } from '../../api/config';

export default function Account() {
  const c = useColors(); const router = useRouter(); const session = useSession();
  return <PublicPage title="Hesabım" back>
    {session.loading ? <ActivityIndicator color={c.brand} style={{ paddingVertical: 30 }} /> : !session.user ? <>
      <IntroCard title="Hesabınıza daxil olun" text="Hesab və mağaza idarəetməsi üçün giriş edin." icon={<UserRound color="#ffffff" size={22} />} />
      <FormButton title="Daxil ol" onPress={() => router.push('/login')} />
      <BuyerMenu />
      <MenuItem icon={<HelpCircle color={c.brand} size={21} />} title="Dəstək və əlaqə" text="Girişlə bağlı kömək alın" onPress={() => router.push('/support')} />
    </> : <AccountDetails key={session.user.id} user={session.user} session={session} />}
  </PublicPage>;
}
function AccountDetails({ user, session }: { user: SessionUser; session: ReturnType<typeof useSession> }) {
  const c = useColors(); const router = useRouter();
  const [fullName, setFullName] = useState(''); const [email, setEmail] = useState(user.email ?? '');
  const [phone, setPhone] = useState(user.phone ?? ''); const [currentPassword, setCurrentPassword] = useState('');
  const [securityPassword, setSecurityPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [section, setSection] = useState<'profile' | 'security'>();
  const [errors, setErrors] = useState<FormErrors>({}); const [message, setMessage] = useState(''); const [success, setSuccess] = useState(false);
  async function saveAccount() {
    if (lock.current) return; Keyboard.dismiss(); setMessage('');
    const next: FormErrors = {};
    if (currentPassword.length < 8) next.currentPassword = 'Cari şifrənizi daxil edin; ən azı 8 simvol.';
    if (email.trim() && !isEmail(email)) next.email = 'Düzgün e-poçt ünvanı yazın.';
    if (phone.trim() && !isPhone(phone)) next.phone = 'Düzgün telefon nömrəsi yazın.';
    if (!fullName.trim() && !email.trim() && !phone.trim()) next.currentPassword = 'Yenilənəcək ən azı bir məlumat daxil edin.';
    setErrors(next); if (Object.keys(next).length) return;
    lock.current = true; setBusy(true); setSuccess(false);
    try {
      await api.patch('/auth/me', { currentPassword, ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}), ...(phone.trim() ? { phone: phone.trim() } : {}) });
      setCurrentPassword(''); setSuccess(true); setMessage('Hesab məlumatlarınız yeniləndi.'); await session.retrySession();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Məlumatlar saxlanmadı.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function changePassword() {
    if (lock.current) return; Keyboard.dismiss(); setMessage('');
    const next = passwordErrors(securityPassword, newPassword, again); setErrors(next);
    if (Object.keys(next).length) return;
    lock.current = true; setBusy(true); setSuccess(false);
    try {
      await api.post('/auth/change-password', { currentPassword: securityPassword, newPassword });
      setSecurityPassword(''); setNewPassword(''); setAgain(''); setSuccess(true); setMessage('Şifrəniz yeniləndi.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Şifrə yenilənmədi.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function exit(all: boolean) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { if (all) await session.logoutEverywhere(); else await session.logout(); router.replace('/home'); }
    catch (error) { Alert.alert('Çıxış', error instanceof Error ? error.message : 'Çıxış tamamlanmadı.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const open = (value: 'profile' | 'security') => { if (busy) return; setSection(section === value ? undefined : value); setErrors({}); setMessage(''); };
  return <>
    <BuyerMenu />
    <IntroCard eyebrow="HESABINIZ" title={user.email ?? user.phone ?? 'Hesab'} text={valueLabel(user.role) + ' · ' + valueLabel(user.status)}
      icon={<UserRound color="#ffffff" size={22} />} />
    {user.role === 'SELLER' && <MenuItem icon={<LayoutDashboard size={21} color={c.brand} />} title="Mağaza paneli"
      text="Mağazanızı və məhsullarınızı idarə edin" onPress={() => router.push('/seller')} />}
    {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && <MenuItem icon={<ShieldCheck size={21} color={c.brand} />} title="Admin paneli"
      text="Platformanın idarəetməsinə keçin" onPress={() => router.push('/admin')} />}
    <MenuItem icon={<Bell size={21} color={c.brand} />} title="Bildirişlər" text="Hesabınızın yenilikləri" onPress={() => router.push('/notifications')} />
    {DEMO_CATALOG && <FormNote>Test hesabı ilə panellərə baxa bilərsiniz. Hesab məlumatları və şifrə canlı rejimdə yenilənir.</FormNote>}
    {!DEMO_CATALOG && <MenuItem icon={<UserRound size={21} color={c.brand} />} title="Hesab məlumatları" text="Ad, e-poçt və telefon" onPress={() => open('profile')} />}
    {section === 'profile' && <FormSection title="Məlumatları yenilə" subtitle="Təhlükəsizlik üçün cari şifrəniz tələb olunur.">
      <FormInput label="Ad və soyad" value={fullName} onChangeText={setFullName} placeholder="Ad və soyad" optional maxLength={120} autoCapitalize="words" editable={!busy} />
      <FormInput label="E-poçt" value={email} onChangeText={setEmail} error={errors.email} maxLength={180} keyboardType="email-address" editable={!busy} />
      <FormInput label="Telefon" value={phone} onChangeText={setPhone} error={errors.phone} maxLength={32} keyboardType="phone-pad" editable={!busy} />
      <FormInput label="Cari şifrə" value={currentPassword} onChangeText={setCurrentPassword} error={errors.currentPassword} secureTextEntry maxLength={128} editable={!busy} />
      {!!message && <FormNote success={success} error={!success}>{message}</FormNote>}
      <FormButton title="Məlumatları saxla" busy={busy} onPress={() => void saveAccount()} />
    </FormSection>}
    {!DEMO_CATALOG && <MenuItem icon={<ShieldCheck size={21} color={c.brand} />} title="Təhlükəsizlik" text="Hesab şifrəsini dəyişin" onPress={() => open('security')} />}
    {section === 'security' && <FormSection title="Şifrəni dəyiş">
      <FormInput label="Cari şifrə" value={securityPassword} onChangeText={setSecurityPassword} error={errors.currentPassword} secureTextEntry maxLength={128} editable={!busy} />
      <FormInput label="Yeni şifrə" value={newPassword} onChangeText={setNewPassword} error={errors.newPassword} secureTextEntry maxLength={128} hint="Ən azı 8 simvol" editable={!busy} />
      <FormInput label="Yeni şifrə təkrar" value={again} onChangeText={setAgain} error={errors.again} secureTextEntry maxLength={128} editable={!busy} />
      {!!message && <FormNote success={success} error={!success}>{message}</FormNote>}
      <FormButton title="Şifrəni yenilə" busy={busy} onPress={() => void changePassword()} />
    </FormSection>}
    <FormButton title="Bu cihazdan çıx" secondary busy={busy} onPress={() => void exit(false)} />
    <FormButton title="Bütün cihazlardan çıx" secondary disabled={busy} onPress={() => Alert.alert('Bütün cihazlardan çıxış',
      'Digər cihazlardakı sessiyalar da bağlanacaq.', [{ text: 'Ləğv et', style: 'cancel' }, { text: 'Çıx', style: 'destructive', onPress: () => void exit(true) }])} />
    <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>Şifrənizi heç kimlə paylaşmayın.</Text>
  </>;
}
