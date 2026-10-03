import { Image } from 'react-native';
import type { Product } from '../../api/types';
import { RemoteImage } from '../../components/ui';
import { DEMO_CATALOG } from '../../api/config';
import { demoProductImage } from './demo-images';
import { productImageUris } from './detail-data';

export function ProductImage({ product, height, marginBottom = 12 }: {
  product: Product; height: number; marginBottom?: number;
}) {
  const local = DEMO_CATALOG ? demoProductImage(product.slug) : undefined;
  if (local) return <Image source={local} resizeMode="cover"
    style={{ width: '100%', height, borderRadius: 12, marginBottom }} />;
  return <RemoteImage uri={productImageUris(product)[0]} height={height}
    marginBottom={marginBottom} recyclingKey={product.slug ?? product.id} />;
}
