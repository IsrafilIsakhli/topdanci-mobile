import type { Product, Store } from '../../api/types';
import { mediaUrl } from '../../lib/media';
import { contactUrl, type ContactKind } from '../../lib/contact-links';

export function productImageUris(product: Product): string[] {
  const imageValues = (product.images ?? [])
    .filter((image) => !image.status || image.status === 'READY')
    .map((image) => mediaUrl(image.cdnUrl) ?? mediaUrl(image.storageKey));
  return [...new Set([...imageValues, mediaUrl(product.imageUrl)].filter((uri): uri is string => !!uri))];
}

export function storeAddress(store: Store): string {
  return [...new Set([store.city, store.district, store.address].map((value) => value?.trim()).filter(Boolean))].join(', ');
}

export function storeHours(store: Store): { label: string; value: string }[] {
  return [{ key: 'workdays', label: 'Bazar ertəsi – Cümə' }, { key: 'saturday', label: 'Şənbə' }, { key: 'sunday', label: 'Bazar' }]
    .flatMap(({ key, label }) => {
      const value = store.workingHours?.[key];
      return typeof value === 'string' && value.trim() ? [{ label, value: value.trim() }] : [];
    });
}

export function availableContacts(store: Store, demo = false): { kind: ContactKind; label: string; value?: string | null }[] {
  if (demo && store.id.startsWith('demo-')) return [
    { kind: 'whatsapp', label: 'WhatsApp ilə yaz' }, { kind: 'phone', label: 'Zəng et' },
  ];
  return [
    { kind: 'whatsapp' as const, label: 'WhatsApp ilə yaz', value: store.whatsappNumber },
    { kind: 'phone' as const, label: 'Zəng et', value: store.phone },
    { kind: 'email' as const, label: 'E-poçt göndər', value: store.email },
  ].filter((item) => !!contactUrl(item.kind, item.value));
}
