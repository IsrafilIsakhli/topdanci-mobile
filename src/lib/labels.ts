const labels: Record<string, string> = {
  id: 'ID', name: 'Ad', title: 'Başlıq', slug: 'Keçid adı', status: 'Status',
  email: 'E-poçt', phone: 'Telefon', fullName: 'Ad və soyad', role: 'Rol',
  contactName: 'Əlaqə şəxsi', contactPhone: 'Əlaqə telefonu', contactEmail: 'Əlaqə e-poçtu',
  companyName: 'Şirkət adı', legalName: 'Rəsmi ad', taxNumber: 'VÖEN',
  city: 'Şəhər', district: 'Rayon', address: 'Ünvan', description: 'Təsvir',
  store: 'Mağaza', stores: 'Mağazalar', product: 'Məhsul', products: 'Məhsullar',
  category: 'Kateqoriya', categoryId: 'Kateqoriya ID', parentId: 'Ana kateqoriya',
  price: 'Qiymət', priceLabel: 'Qiymət', priceType: 'Qiymət növü',
  currency: 'Valyuta', unit: 'Ölçü vahidi', minOrderQuantity: 'Minimum sifariş',
  stockStatus: 'Anbar statusu', reviewNote: 'Yoxlama qeydi',
  createdAt: 'Yaradılma vaxtı', updatedAt: 'Yenilənmə vaxtı',
  reviewedAt: 'Yoxlanma vaxtı', publishedAt: 'Dərc vaxtı',
  lastLoginAt: 'Son giriş', verifiedAt: 'Təsdiq vaxtı',
  logoKey: 'Mağaza loqosu', bannerKey: 'Örtük şəkli',
  whatsappNumber: 'WhatsApp', ownerUser: 'Sahib', counts: 'Saylar',
  openReportCount: 'Açıq şikayətlər', sortOrder: 'Sıralama', icon: 'İkon',
  pendingStores: 'Gözləyən mağazalar', pendingProducts: 'Gözləyən məhsullar',
  reports: 'Şikayətlər', openReports: 'Açıq şikayətlər',
  activeStores: 'Aktiv mağazalar', activeProducts: 'Aktiv məhsullar',
  todayLeadEvents: 'Bugünkü müraciət hadisələri', whatsappClicksToday: 'Bugünkü WhatsApp klikləri',
  recentStoreApplications: 'Son mağaza müraciətləri', recentPendingProducts: 'Son yoxlanan məhsullar',
  recentReports: 'Son şikayətlər', recentAuditLogs: 'Son audit qeydləri',
  range: 'Dövr', totalLeads: 'Ümumi hadisələr', leadCounts: 'Hadisə sayları',
  trend: 'Günlük dəyişmə', topStores: 'Ən çox baxılan mağazalar',
  topProducts: 'Ən çox baxılan məhsullar', cityBreakdown: 'Şəhərlər',
  categoryBreakdown: 'Kateqoriyalar', dependencies: 'Xidmətlər',
  metrics: 'Göstəricilər', timestamp: 'Yoxlama vaxtı',
  productViews: 'Məhsul baxışları', storeViews: 'Mağaza baxışları',
  whatsappClicks: 'WhatsApp klikləri', phoneReveals: 'Telefon göstərilmələri',
  emailClicks: 'E-poçt klikləri',
};
const values: Record<string, string> = {
  DRAFT: 'Qaralama', PENDING_REVIEW: 'Yoxlamada', ACTIVE: 'Aktiv',
  PASSIVE: 'Passiv', REJECTED: 'Rədd edildi', DELETED: 'Silindi',
  PENDING: 'Gözləyir', SUSPENDED: 'Dayandırılıb', IN_REVIEW: 'Yoxlamada',
  OPEN: 'Açıq', APPROVED: 'Təsdiqləndi',
  RESOLVED: 'Həll edildi', SUPER_ADMIN: 'Baş admin', ADMIN: 'Admin',
  SELLER: 'Satıcı', BUYER: 'Alıcı', FIXED: 'Sabit qiymət',
  NEGOTIABLE: 'Razılaşma yolu ilə', IN_STOCK: 'Stokda var',
  LIMITED: 'Az qalıb', OUT_OF_STOCK: 'Stokda yoxdur',
  ok: 'İşləyir', healthy: 'İşləyir', degraded: 'Məhdud işləyir',
};
export function fieldLabel(key: string) { return labels[key] ?? key; }
export function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Bəli' : 'Xeyr';
  return values[String(value)] ?? String(value);
}
