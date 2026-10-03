import type { AdminRecord, ApiEnvelope, Category, Lead, Product, SessionUser, Store } from '../../api/types';
import { demoCategories, demoProducts, demoStores } from '../catalog/demo-data';
import { isDemoUser } from '../auth/demo-accounts';
import { normalizeUnit } from './validation';
type Options = { method?: string; body?: unknown; params?: Record<string, string | number | boolean | null | undefined> };
export class PreviewError extends Error { constructor(message: string, public status = 400) { super(message); } }
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const stamp = (days = 0) => new Date(Date.now() - days * 86400000).toISOString();
let stores: Store[]; let products: Product[]; let applications: AdminRecord[]; let reports: AdminRecord[];
let users: AdminRecord[]; let categories: Category[]; let audit: AdminRecord[];
let categoryStatuses: Record<string, string>;
export function resetManagementPreview() {
  stores = clone(demoStores).map((store) => ({ ...store, phone: '+994501234567', whatsappNumber: '+994501234567',
    email: 'info@demo.az', address: 'Nümunə biznes mərkəzi, 12', workingHours: { workdays: '09:00–18:00', saturday: '10:00–15:00', sunday: 'Bağlı' } }));
  products = clone(demoProducts).map((product) => ({ ...product, unit: normalizeUnit(product.unit), store: stores.find((s) => s.id === product.store?.id), priceType: product.price == null ? 'NEGOTIABLE' : 'FIXED' }));
  products.push({ ...clone(products[0]), id: 'preview-product-draft', title: 'Yeni mövsüm gödəkçələri', status: 'DRAFT' },
    { ...clone(products[1]), id: 'preview-product-pending', title: 'Pambıq köynəklər · yeni partiya', status: 'PENDING_REVIEW' });
  applications = [{ id: 'preview-application-1', companyName: 'Sumqayıt Tekstil', contactName: 'Aysel Məmmədova',
    contactPhone: '+994501234567', contactEmail: 'aysel@demo.az', city: 'Sumqayıt', status: 'PENDING', createdAt: stamp(), description: 'Geyim və tekstil məhsullarının topdan satışı.' },
    { id: 'preview-application-2', companyName: 'Gəncə Market Təchizat', contactName: 'Elvin Əliyev', contactEmail: 'elvin@demo.az', city: 'Gəncə', status: 'PENDING', createdAt: stamp(1) }];
  reports = [{ id: 'preview-report-1', title: 'Məhsul məlumatının yoxlanması', status: 'OPEN', reason: 'Təsvir və minimum sifariş məlumatı dəqiqləşdirilməlidir.', product: clone(products[3]), createdAt: stamp() },
    { id: 'preview-report-2', title: 'Mağaza əlaqə məlumatı', status: 'IN_REVIEW', reason: 'İş saatları barədə məlumatın yoxlanması istənilir.', store: clone(stores[2]), createdAt: stamp(1) }];
  users = [{ id: 'preview-seller', email: 'magaza@demo.az', fullName: 'Mağaza admini', role: 'SELLER', status: 'ACTIVE' },
    { id: 'preview-super', email: 'superadmin@demo.az', fullName: 'Superadmin', role: 'SUPER_ADMIN', status: 'ACTIVE' },
    { id: 'preview-buyer', email: 'alici@demo.az', fullName: 'Nümunə alıcı', role: 'BUYER', status: 'ACTIVE' }];
  categories = clone(demoCategories);
  categoryStatuses = {};
  audit = [{ id: 'preview-audit-1', action: 'Nümunə paneli hazırlandı', createdAt: stamp(), actor: { email: 'superadmin@demo.az' } }];
}
resetManagementPreview();
function page(items: (AdminRecord | Product | Store | Lead | Category)[], options: Options) {
  const q = String(options.params?.q ?? '').toLocaleLowerCase('az').trim(); const status = options.params?.status;
  const filtered = items.filter((item) => (!q || JSON.stringify(item).toLocaleLowerCase('az').includes(q)) && (!status || ('status' in item && item.status === status)));
  const start = Math.max(0, Number(options.params?.cursor) || 0); const limit = Math.min(50, Math.max(1, Number(options.params?.limit) || 20));
  return { data: clone(filtered.slice(start, start + limit)), meta: { total: filtered.length, nextCursor: start + limit < filtered.length ? String(start + limit) : null } };
}
function ownProducts() { return products.filter((p) => p.store?.id === stores[0].id && p.status !== 'DELETED'); }
function counts(items: Product[]) {
  return { draft: items.filter((p) => p.status === 'DRAFT').length, pendingReview: items.filter((p) => p.status === 'PENDING_REVIEW').length,
    active: items.filter((p) => p.status === 'ACTIVE').length, passive: items.filter((p) => p.status === 'PASSIVE').length, rejected: items.filter((p) => p.status === 'REJECTED').length };
}
function leads(): Lead[] {
  return ['WHATSAPP_CLICK', 'PRODUCT_VIEW', 'PHONE_REVEAL', 'STORE_VIEW', 'WHATSAPP_CLICK', 'EMAIL_CLICK'].map((type, i) =>
    ({ id: 'preview-lead-' + i, type, createdAt: stamp(i), source: 'MOBILE', store: stores[0], product: type === 'STORE_VIEW' ? null : ownProducts()[i % ownProducts().length] }));
}
function categoryTree(parentId?: string): AdminRecord[] {
  return categories.filter((c) => (c.parentId ?? undefined) === parentId).map((c) => ({ ...c, status: categoryStatuses[c.id] ?? 'ACTIVE', children: categoryTree(c.id) }));
}
function log(user: SessionUser, action: string) { audit.unshift({ id: 'preview-audit-' + Date.now(), action, createdAt: stamp(), actor: { email: user.email } }); }
function found<T>(item: T | undefined): T { if (!item) throw new PreviewError('Qeyd tapılmadı.', 404); return item; }
export function managementPreview<T>(path: string, options: Options, user: SessionUser | null): ApiEnvelope<T> | null {
  if (!path.startsWith('/seller') && !path.startsWith('/admin') && path !== '/notifications') return null;
  if (!isDemoUser(user)) throw new PreviewError('Panelə baxmaq üçün test hesabı ilə daxil olun.', 401);
  const signedIn = user!; const method = options.method ?? 'GET';
  const body = options.body && typeof options.body === 'object' ? options.body as Record<string, unknown> : {};
  if (path.startsWith('/admin') && signedIn.role !== 'SUPER_ADMIN') throw new PreviewError('Bu bölməyə giriş icazəniz yoxdur.', 403);
  if (path.startsWith('/seller') && signedIn.role !== 'SELLER') throw new PreviewError('Bu hesabın mağazası yoxdur.', 403);
  const result = (data: unknown): ApiEnvelope<T> => ({ data: clone(data) as T });
  if (path === '/notifications') return result([]);
  if (path === '/seller/overview') {
    const own = ownProducts(); const c = counts(own);
    return result({ totalProducts: own.length, activeProducts: c.active, pendingProducts: c.pendingReview, draftProducts: c.draft,
      whatsappClicksToday: 8, storeViewsToday: 24, stores: [stores[0]], recentLeads: leads().slice(0, 3) });
  }
  if (path === '/seller/analytics') {
    const scale = options.params?.range === '7d' ? 1 : options.params?.range === '90d' ? 6 : 3;
    const leadCounts = { productViews: 48 * scale, storeViews: 24 * scale, whatsappClicks: 8 * scale, phoneReveals: 4 * scale, emailClicks: scale };
    return result({ totalLeads: Object.values(leadCounts).reduce((a, b) => a + b, 0), leadCounts, productCounts: counts(ownProducts()) });
  }
  if (path === '/seller/leads') return page(leads().filter((lead) => !options.params?.type || lead.type === options.params.type), options) as ApiEnvelope<T>;
  if (path === '/seller/stores') return result([{ ...stores[0], productCount: ownProducts().length }]);
  if (path.startsWith('/seller/stores/')) {
    const store = found(stores.find((s) => s.id === path.split('/')[3] && s.id === stores[0].id));
    if (method === 'PATCH') { Object.assign(store, body); log(signedIn, 'Mağaza profili yeniləndi'); }
    return result(store);
  }
  if (path === '/seller/products' && method === 'GET') return page(ownProducts(), options) as ApiEnvelope<T>;
  if (path === '/seller/products' && method === 'POST') {
    if (body.storeId !== stores[0].id) throw new PreviewError('Yalnız öz mağazanıza məhsul əlavə edə bilərsiniz.', 403);
    const product: Product = { id: 'preview-product-' + Date.now(), slug: 'preview-new-' + Date.now(), title: String(body.title ?? ''), description: String(body.description ?? ''),
      category: categories.find((c) => c.id === body.categoryId), store: stores[0], price: body.price as number | undefined, priceType: String(body.priceType), unit: String(body.unit),
      currency: 'AZN', minOrderQuantity: body.minOrderQuantity as number | undefined, stockStatus: String(body.stockStatus), status: 'DRAFT' };
    products.unshift(product); log(signedIn, 'Məhsul qaralama kimi yaradıldı'); return result(product);
  }
  if (path.startsWith('/seller/products/')) {
    const product = found(ownProducts().find((p) => p.id === path.split('/')[3]));
    if (method === 'DELETE') { product.status = 'DELETED'; log(signedIn, 'Məhsul silindi'); return result({ deleted: true }); }
    if (method === 'PATCH') {
      const { storeId: _store, categoryId, ...fields } = body;
      Object.assign(product, fields, { status: 'DRAFT', category: categories.find((c) => c.id === categoryId) ?? product.category,
        price: body.priceType === 'NEGOTIABLE' ? null : body.price ?? product.price });
      log(signedIn, 'Məhsul qaralaması yeniləndi');
    }
    if (path.endsWith('/submit-review') && method === 'POST') { product.status = 'PENDING_REVIEW'; log(signedIn, 'Məhsul yoxlamaya göndərildi'); }
    return result(product);
  }
  if (path === '/admin/overview') return result({ activeStores: stores.filter((s) => s.status === 'ACTIVE').length, activeProducts: products.filter((p) => p.status === 'ACTIVE').length,
    pendingStores: applications.filter((a) => a.status === 'PENDING').length, pendingProducts: products.filter((p) => p.status === 'PENDING_REVIEW').length,
    openReports: reports.filter((r) => ['OPEN','IN_REVIEW'].includes(String(r.status))).length, todayLeadEvents: 24,
    recentStoreApplications: applications.slice(0, 3), recentPendingProducts: products.filter((p) => p.status === 'PENDING_REVIEW').slice(0, 3), recentReports: reports.slice(0, 3) });
  if (path === '/admin/analytics') {
    const scale = options.params?.range === '7d' ? 1 : options.params?.range === '90d' ? 12 : 4;
    return result({ totalLeads: 180 * scale, leadCounts: { PRODUCT_VIEW: 100 * scale, STORE_VIEW: 40 * scale, WHATSAPP_CLICK: 24 * scale, PHONE_REVEAL: 12 * scale, EMAIL_CLICK: 4 * scale },
      topStores: stores.map((s, i) => ({ id: s.id, name: s.name, leadCount: (30 - i * 5) * scale })), cityBreakdown: [{ city: 'Bakı', activeStores: 2 }, { city: 'Sumqayıt', activeStores: 1 }, { city: 'Gəncə', activeStores: 1 }] });
  }
  if (path === '/admin/system') return result({ status: 'Nümunə mühit', dependencies: { API: 'Real server yoxlanılmır', catalog: 'Yerli test məlumatı', authentication: 'Test sessiyası' }, timestamp: stamp() });
  if (path === '/admin/categories/tree') return result(categoryTree());
  if (path === '/admin/categories' && method === 'POST') {
    const category: Category = { id: 'preview-category-' + Date.now(), name: String(body.name), slug: String(body.slug || 'new-' + Date.now()), parentId: body.parentId as string | undefined };
    categories.push(category); log(signedIn, 'Kateqoriya yaradıldı'); return result(category);
  }
  if (path.startsWith('/admin/products/bulk/') && method === 'POST') {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    products.filter((p) => ids.includes(p.id)).forEach((p) => { p.status = path.endsWith('/approve') ? 'ACTIVE' : 'REJECTED'; p.reviewNote = String(body.reviewNote ?? ''); });
    log(signedIn, 'Toplu məhsul yoxlaması'); return result({ updated: ids.length });
  }
  const lists: Record<string, (AdminRecord | Product | Store | Category)[]> = { 'store-applications': applications, products: products.filter((p) => p.status !== 'DELETED'),
    stores, users, reports, 'audit-logs': audit, categories };
  const [, , section, id, action] = path.split('/'); const list = lists[section];
  if (list) {
    if (!id && method === 'GET') return page(list, options) as ApiEnvelope<T>;
    const item = found(list.find((record) => record.id === id)) as AdminRecord;
    if (method === 'GET') return result(item);
    if (method === 'PATCH') {
      if (section === 'users' && item.id === signedIn.id) throw new PreviewError('Cari test superadmininin rolunu və statusunu dəyişmək olmaz.');
      if (section === 'categories' && body.parentId) {
        let parent = String(body.parentId); const seen = new Set<string>();
        while (parent) { if (parent === id || seen.has(parent)) throw new PreviewError('Ana kateqoriya dairəvi əlaqə yaradır.'); seen.add(parent); parent = categories.find((c) => c.id === parent)?.parentId ?? ''; }
      }
      if (section === 'categories' && !body.parentId) item.parentId = undefined;
      Object.assign(item, body);
    }
    if (method === 'POST') {
      const statuses: Record<string, string> = { approve: section === 'store-applications' ? 'APPROVED' : 'ACTIVE', reject: 'REJECTED', suspend: 'SUSPENDED',
        reactivate: 'ACTIVE', deactivate: 'PASSIVE', 'in-review': 'IN_REVIEW', resolve: 'RESOLVED' };
      if (statuses[action]) item.status = statuses[action];
      if (section === 'categories' && statuses[action]) categoryStatuses[id] = statuses[action];
      if (section === 'store-applications' && action === 'approve' && !stores.some((s) => s.id === 'preview-approved-' + id)) {
        stores.push({ id: 'preview-approved-' + id, name: String(item.companyName), slug: 'preview-approved-' + id, city: String(item.city), status: 'ACTIVE', verified: true });
      }
      if (body.reviewNote) item.reviewNote = body.reviewNote;
      if (action === 'flag') item.reviewNote = String(body.reason);
    }
    log(signedIn, 'Nümunə əməliyyat: ' + section + (action ? ' / ' + action : ' / yeniləmə')); return result(item);
  }
  throw new PreviewError('Bu əməliyyat nümunə panelində mövcud deyil.');
}
