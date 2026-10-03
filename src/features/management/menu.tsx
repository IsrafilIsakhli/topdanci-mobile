import { useRouter } from 'expo-router';
import { Bell, ChartNoAxesCombined, ClipboardList, Flag, History, LayoutDashboard, MessageCircle, Package, Shapes, Store, Users, Server, UserRound, HelpCircle } from 'lucide-react-native';
import { Text } from 'react-native';
import { ManagementPage, PanelCard, ActionRow, PanelLogout, DashboardHero } from './ui';
import { useSession } from '../auth/use-session';
import { useColors } from '../../theme/colors';
export function ManagementMenu({ mode }: { mode: 'seller' | 'admin' }) {
  const c = useColors(); const router = useRouter(); const { user } = useSession();
  const seller = mode === 'seller';
  const operations = seller ? [
    { title: 'Alıcı tələbləri', text: 'Uyğun tələblərə mağazanızdan təklif verin', href: '/requests', icon: ClipboardList },
    { title: 'Məhsullarım', text: 'Məhsullar, qaralamalar və yoxlanışlar', href: '/seller/products', icon: Package },
    { title: 'Mağaza profili', text: 'Əlaqə, ünvan və iş saatları', href: '/seller/store', icon: Store },
    { title: 'Statistika', text: 'Baxışlar və alıcı marağı', href: '/seller/analytics', icon: ChartNoAxesCombined },
    { title: 'Alıcı hadisələri', text: 'WhatsApp, telefon və baxışlar', href: '/seller/leads', icon: MessageCircle },
  ] : [
    { title: 'Mağaza müraciətləri', text: 'Yeni təchizatçıları yoxlayın', href: '/admin/applications', icon: ClipboardList },
    { title: 'Məhsul yoxlaması', text: 'Dərc, rədd və dayandırma', href: '/admin/products', icon: Package },
    { title: 'Mağazalar', text: 'Platformadakı təchizatçılar', href: '/admin/stores', icon: Store },
    { title: 'Şikayətlər', text: 'Bildirilmiş problemləri həll edin', href: '/admin/reports', icon: Flag },
    { title: 'Statistika', text: 'Platformanın göstəriciləri', href: '/admin/analytics', icon: ChartNoAxesCombined },
  ];
  const system = [
    { title: 'İstifadəçilər', text: 'Rollar və hesab statusları', href: '/admin/users', icon: Users },
    { title: 'Kateqoriyalar', text: 'Sahələr və alt bölmələr', href: '/admin/categories', icon: Shapes },
    { title: 'Audit qeydləri', text: 'İdarəetmə əməliyyatlarının tarixçəsi', href: '/admin/audit', icon: History },
    { title: 'Sistem vəziyyəti', text: 'Xidmətlərin mövcud vəziyyəti', href: '/admin/system', icon: Server },
  ];
  return <ManagementPage title={seller ? 'Mağaza menyusu' : 'İdarəetmə menyusu'} mode={mode}>
    <DashboardHero label={seller ? 'MAĞAZA ADMİNİ' : user?.role === 'SUPER_ADMIN' ? 'SUPERADMİN' : 'ADMİN'} title="İş yeriniz, hər yerdə."
      text={user?.email ?? user?.phone ?? 'Hesabınızın idarəetmə bölmələri'} />
    <PanelCard title={seller ? 'Biznesinizi idarə edin' : 'Platforma əməliyyatları'}>{operations.map(({ title, text, href, icon: Icon }) =>
      <ActionRow key={href} title={title} text={text} icon={<Icon size={20} color={c.brand} />} onPress={() => router.push(href as never)} />)}</PanelCard>
    {!seller && user?.role === 'SUPER_ADMIN' && <PanelCard title="Superadmin alətləri">{system.map(({ title, text, href, icon: Icon }) =>
      <ActionRow key={href} title={title} text={text} icon={<Icon size={20} color={c.brand} />} onPress={() => router.push(href as never)} />)}</PanelCard>}
    <PanelCard title="Hesab və keçidlər">
      <ActionRow title="Bildirişlər" text="Hesabınızın yenilikləri" icon={<Bell size={20} color={c.brand} />} onPress={() => router.push('/notifications')} />
      <ActionRow title="Hesab məlumatları" text="Profil və təhlükəsizlik" icon={<UserRound size={20} color={c.brand} />} onPress={() => router.push('/account')} />
      <ActionRow title="Alıcı kataloqu" text="Məhsulları alıcı kimi nəzərdən keçirin" icon={<LayoutDashboard size={20} color={c.brand} />} onPress={() => router.push('/home')} />
      <ActionRow title="Dəstək" icon={<HelpCircle size={20} color={c.brand} />} onPress={() => router.push('/support')} />
    </PanelCard>
    <PanelLogout /><Text style={{ color: c.muted, fontSize: 10, textAlign: 'center', lineHeight: 16 }}>TopdanBazar · {seller ? 'Mağaza idarəetməsi' : 'Platforma idarəetməsi'}</Text>
  </ManagementPage>;
}
