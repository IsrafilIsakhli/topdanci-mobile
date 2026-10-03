import { BuyerMenu } from '../../../features/buyer/menu';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, HelpCircle, LayoutDashboard, LogIn, ShieldCheck, Store, UserRound } from 'lucide-react-native';
import { useSession } from '../../../features/auth/use-session';
import { PublicPage, IntroCard } from '../../../components/public-page';
import { FormButton, MenuItem } from '../../../components/form-ui';
import { DEMO_CATALOG } from '../../../api/config';
import { useColors } from '../../../theme/colors';
import { valueLabel } from '../../../lib/labels';

export default function More() {
  const c = useColors(); const router = useRouter(); const { user, loading } = useSession();
  return <PublicPage title="Hesab">
    {loading ? <ActivityIndicator color={c.brand} style={{ paddingVertical: 30 }} /> : user ? <>
      <IntroCard eyebrow="HESABINIZ" title={user.email ?? user.phone ?? 'Xoş gəlmisiniz'}
        text={valueLabel(user.role) + ' · Hesab və mağaza idarəetməsi'} icon={<UserRound color="#ffffff" size={22} />} />
      <FormButton title="Hesab məlumatları" onPress={() => router.push('/account')} secondary />
    </> : <>
      <IntroCard eyebrow="TOPDANBAZARA XOŞ GƏLMİSİNİZ" title="Biznesiniz üçün bir yer"
        text="Məhsulları araşdırın, mağazaları tapın və satıcılarla birbaşa əlaqə qurun." icon={<UserRound color="#ffffff" size={22} />} />
      <View style={{ padding: 17, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><LogIn size={20} color={c.brand} />
          <Text style={{ color: c.ink, fontSize: 16, fontWeight: '800' }}>Hesabınıza daxil olun</Text></View>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 19 }}>Satıcı və admin hesabınızla panelə keçin. Kataloqa baxmaq üçün giriş tələb olunmur.</Text>
        <FormButton title="Daxil ol" onPress={() => router.push('/login')} />
      </View>
    </>}
    <Text style={{ color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 2 }}>SİZİN ÜÇÜN</Text>
    <BuyerMenu />
    {user?.role === 'SELLER' && <MenuItem icon={<LayoutDashboard size={21} color={c.brand} />}
      title="Satıcı paneli" text="Mağaza, məhsullar və müraciətlər" onPress={() => router.push('/seller')} />}
    {user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) && <MenuItem icon={<ShieldCheck size={21} color={c.brand} />}
      title="Admin paneli" text="Yoxlama və platforma idarəetməsi" onPress={() => router.push('/admin')} />}
    {user && <MenuItem icon={<Bell size={21} color={c.brand} />} title="Bildirişlər" text="Hesab və mağaza yenilikləri" onPress={() => router.push('/notifications')} />}
    <MenuItem icon={<Store size={21} color={c.brand} />} title="Mağaza aç" text="Topdan təkliflərinizi kataloqda təqdim edin" onPress={() => router.push('/open-store')} />
    <MenuItem icon={<HelpCircle size={21} color={c.brand} />} title="Dəstək və əlaqə" text="Sual, təklif və problemlərinizi bizə yazın" onPress={() => router.push('/support')} />
    <View style={{ padding: 16, gap: 6 }}>
      <Text style={{ color: c.brand, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>TopdanBazar</Text>
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' }}>Biznesdən biznesə. Satıcı ilə birbaşa əlaqə.</Text>
      {DEMO_CATALOG && <Text style={{ color: c.muted, fontSize: 10, textAlign: 'center' }}>Nümunə kataloq · Test məlumatları</Text>}
    </View>
  </PublicPage>;
}
