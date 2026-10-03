import type { Product } from '../../api/types';

const units: Record<string, string> = { PIECE: 'ədəd', BOX: 'qutu', KG: 'kq', TON: 'ton', METER: 'metr', PACKAGE: 'paket' };

/** The same price and order terms in every compact product card. */
export function productPresentation(product: Product) {
  const amount = product.price == null || product.price === '' ? NaN : Number(product.price);
  const negotiated = product.priceType === 'NEGOTIABLE' || !Number.isFinite(amount) || amount < 0;
  const price = negotiated ? 'Razılaşma yolu ilə' : product.priceLabel
    ?? amount.toLocaleString('az', { maximumFractionDigits: 2 }) + ' ' + (product.currency ?? 'AZN');
  const unit = units[product.unit ?? ''] ?? product.unit ?? '';
  const minimum = product.minOrderQuantity != null
    ? ('Min. ' + product.minOrderQuantity + ' ' + unit).trim() : 'Minimum sifariş soruşun';
  const stock = product.stockStatus === 'LIMITED' ? 'Az qalıb' : product.stockStatus === 'OUT_OF_STOCK' ? 'Bitib'
    : product.stockStatus === 'IN_STOCK' ? 'Stokda' : undefined;
  return { price, negotiated, minimum, stock };
}
