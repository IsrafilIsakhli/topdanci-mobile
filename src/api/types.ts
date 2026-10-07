export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
export type SessionUser = {
  id: string; role: UserRole; status: string; email?: string; phone?: string;
};
export type ApiEnvelope<T> = { data: T; meta?: { nextCursor?: string | null; total?: number; unreadCount?: number; cachedAt?: string } };
export type Category = { id: string; slug: string; name: string; parentId?: string | null; productCount?: number };
export type Store = {
  id: string; slug: string; name: string; legalName?: string | null; description?: string | null;
  city?: string; district?: string | null; address?: string | null; logoUrl?: string | null;
  bannerUrl?: string | null; logoKey?: string | null; bannerKey?: string | null;
  phone?: string | null; whatsappNumber?: string | null; email?: string | null;
  verified?: boolean; status?: string; productCount?: number;
  category?: Category | null; workingHours?: Record<string, unknown> | null;
};
export type Product = {
  id: string; slug: string; title: string; description?: string | null;
  price?: string | number | null; priceLabel?: string; priceType?: string;
  currency?: string; unit?: string; minOrderQuantity?: string | number | null;
  stockStatus?: string; status?: string; reviewNote?: string | null;
  images?: { id: string; cdnUrl?: string | null; storageKey?: string | null; altText?: string | null; status?: string }[];
  imageUrl?: string | null; store?: Store; category?: Category | null;
};
export type AdminRecord = Record<string, unknown> & { id?: string; name?: string; title?: string; status?: string };
export type Lead = { id: string; type: string; source?: string | null; createdAt: string; product?: Product | null; store?: Store | null };
