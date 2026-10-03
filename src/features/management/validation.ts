export function normalizeUnit(unit?: string): string {
  return ({ 'ədəd': 'PIECE', 'qutu': 'BOX', 'kq': 'KG', 'ton': 'TON', 'metr': 'METER', 'paket': 'PACKAGE', 'kisə': 'PACKAGE', 'dəst': 'PIECE' } as Record<string, string>)[unit ?? ''] ?? unit ?? 'PIECE';
}
export function productDraftErrors(data: { storeId: string; categoryId: string; title: string; priceType: string; price: string; minOrder: string }) {
  const errors: Record<string, string> = {};
  if (!data.storeId) errors.storeId = 'Əvvəl mağaza seçin.';
  if (!data.categoryId) errors.categoryId = 'Məhsul kateqoriyasını seçin.';
  if (data.title.trim().length < 2) errors.title = 'Məhsul adını yazın; ən az 2 simvol.';
  const price = Number(data.price.replace(',', '.')); const min = Number(data.minOrder.replace(',', '.'));
  if (data.priceType === 'FIXED' && (!data.price.trim() || !Number.isFinite(price) || price <= 0)) errors.price = 'Sıfırdan böyük qiymət yazın.';
  if (data.minOrder.trim() && (!Number.isFinite(min) || min <= 0)) errors.minOrder = 'Minimum sifariş sıfırdan böyük olmalıdır.';
  return errors;
}
