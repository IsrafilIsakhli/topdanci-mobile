import { useLibrary } from '../../../features/buyer/library';
import { SaveButton } from '../../../features/buyer/save-button';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Package } from 'lucide-react-native';
import { api } from '../../../api/client';
import type { Product } from '../../../api/types';
import { CatalogProductCard } from '../../../features/catalog/catalog-product-card';
import { ContactBar, DetailCard, DetailFrame, DetailState, SupplierCard } from '../../../features/catalog/detail-ui';
import { ProductGallery } from '../../../features/catalog/product-gallery';
import { productPresentation } from '../../../features/catalog/product-presentation';
import { routeText } from '../../../features/catalog/product-filters';
import { categoryProductsPath } from '../../../features/catalog/navigation';
import { SectionHeading } from '../../../features/home/sections';
import { track } from '../../../lib/contact';
import { useColors } from '../../../theme/colors';

export default function ProductDetail() {
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = routeText(params.slug);
  return <ProductDetailView key={slug} slug={slug} />;
}

function ProductDetailView({ slug }: { slug: string }) {
  const c = useColors(); const router = useRouter(); const { width, fontScale } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const query = useQuery({ queryKey: ['product', slug], queryFn: () => api.get<Product>('/products/' + encodeURIComponent(slug)) });
  const product = query.data?.data;
  const { actions } = useLibrary();
  useEffect(() => { if (product) void actions.viewProduct(product); }, [product, actions]);
  useEffect(() => { if (product?.store?.id) void track('PRODUCT_VIEW', product.store.id, product.id); }, [product?.id, product?.store?.id]);
  const sameStore = useQuery({
    queryKey: ['related-store-products', product?.store?.slug],
    enabled: !!product?.store?.slug,
    queryFn: () => api.get<Product[]>('/products', { store: product?.store?.slug, limit: 6 }),
  });
  const related = sameStore.data?.data.filter((item) => item.id !== product?.id).slice(0, 4) ?? [];
  const oneColumn = width < 350 || fontScale >= 1.3;
  const cardWidth = oneColumn ? width - 32 : (width - 42) / 2;
  const storePath = '/store/' + product?.store?.slug;
  const storeProducts = '/products?store=' + encodeURIComponent(product?.store?.slug ?? '');
  const terms = product ? productPresentation(product) : undefined;
  return <DetailFrame title="Məhsul" fallback="/products" accessory={product ? <SaveButton product={product} /> : undefined}
    footer={product?.store ? <ContactBar store={product.store} product={product} fallbackLabel="Mağazaya bax"
      onFallback={() => router.push(storePath as never)} /> : undefined}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 15 }}>
      {query.isPending ? <DetailState loading title="Məhsul yüklənir…" /> : query.error ? <DetailState title="Məhsul açılmadı"
        message={query.error.message} onRetry={() => void query.refetch()} /> : product && terms ? <>
        <View style={{ padding: 10, backgroundColor: c.surface, borderRadius: 24, borderWidth: 1, borderColor: c.line, gap: 13 }}>
          <ProductGallery product={product} />
          <View style={{ paddingHorizontal: 5, paddingBottom: 6, gap: 11 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {product.category && <Pressable accessibilityRole="button" accessibilityLabel={product.category.name + ' məhsullarına bax'}
                onPress={() => router.push(categoryProductsPath(product.category!.slug) as never)}
                style={{ paddingHorizontal: 9, minHeight: 32, paddingVertical: 6, borderRadius: 9, backgroundColor: c.background }}>
                <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>{product.category.name}</Text>
              </Pressable>}
              {terms.stock && <View style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9,
                backgroundColor: product.stockStatus === 'LIMITED' ? '#fff2df' : c.brandSoft, flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: product.stockStatus === 'LIMITED' ? c.warning : product.stockStatus === 'OUT_OF_STOCK' ? c.muted : c.success }} />
                <Text style={{ color: product.stockStatus === 'LIMITED' ? c.warning : c.brand, fontSize: 11, fontWeight: '700' }}>{terms.stock}</Text>
              </View>}
            </View>
            <Text style={{ color: c.ink, fontSize: 22, lineHeight: 28, letterSpacing: -.4, fontWeight: '800' }}>{product.title}</Text>
            <View style={{ backgroundColor: c.brandSoft, borderRadius: 17, padding: 13, gap: 10 }}>
              <Text style={{ color: c.brand, fontSize: 10, fontWeight: '700', letterSpacing: .7 }}>TOPDAN QİYMƏT</Text>
              <Text style={{ color: c.brand, fontSize: terms.negotiated ? 20 : 27, lineHeight: terms.negotiated ? 26 : 33, fontWeight: '800' }}>{terms.price}</Text>
              <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center', borderTopWidth: 1, borderColor: '#cce6da', paddingTop: 10 }}>
                <Package size={16} color={c.brand} /><Text style={{ flex: 1, color: c.brand, fontSize: 12, lineHeight: 18, fontWeight: '600' }}>{terms.minimum}</Text>
              </View>
            </View>
            {terms.negotiated && <Text style={{ color: c.muted, fontSize: 11, lineHeight: 17 }}>Qiyməti və partiya şərtlərini satıcı ilə dəqiqləşdirin.</Text>}
          </View>
        </View>
        {product.store && <SupplierCard store={product.store} />}
        <DetailCard title="Məhsul haqqında">
          <Text numberOfLines={expanded ? undefined : 4} style={{ color: c.muted, fontSize: 13, lineHeight: 21 }}>
            {product.description?.trim() || 'Ətraflı məlumat üçün satıcı ilə əlaqə saxlayın.'}
          </Text>
          {(product.description?.length ?? 0) > 180 && <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Mətnin davamını gizlət' : 'Mətnin davamını oxu'}
            accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}
            style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: c.brand, fontSize: 12, fontWeight: '700' }}>{expanded ? 'Daha az göstər' : 'Davamını oxu'}</Text>
            {expanded ? <ChevronUp size={16} color={c.brand} /> : <ChevronDown size={16} color={c.brand} />}
          </Pressable>}
        </DetailCard>
        {product.store && (sameStore.isPending || sameStore.error || related.length > 0) && <View style={{ gap: 11 }}>
          <SectionHeading title="Eyni mağazadan" onPress={() => router.push(storeProducts as never)} />
          {sameStore.isPending ? <DetailState loading title="Məhsullar yüklənir…" /> : sameStore.error ?
            <DetailState title="Digər məhsullar açılmadı" message="Yenidən yoxlayın və ya mağazanın kataloqunu açın." onRetry={() => void sameStore.refetch()} /> :
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {related.map((item) => <CatalogProductCard key={item.id} product={item} width={cardWidth} />)}
            </View>}
        </View>}
      </> : <DetailState title="Məhsul tapılmadı" message="Məhsul silinmiş və ya satışdan çıxarılmış ola bilər." />}
    </ScrollView>
  </DetailFrame>;
}
