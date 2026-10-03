import type { Category, Product, Store } from '../../api/types';
import taxonomy from './demo-taxonomy.json';

// Kateqoriyalar saytın packages/shared/src/default-categories.json faylından götürülüb.
type TaxonomyNode = { slug: string; name: string; children?: TaxonomyNode[] };
function flattenTaxonomy(nodes: TaxonomyNode[], parentId?: string): Category[] {
  return nodes.flatMap(({ slug, name, children }) => {
    const id = `demo-category-${slug}`;
    return [{ id, slug, name, parentId }, ...flattenTaxonomy(children ?? [], id)];
  });
}
export const demoCategories: Category[] = flattenTaxonomy(taxonomy);
function demoCategory(slug: string): Category {
  const category = demoCategories.find((item) => item.slug === slug);
  if (!category) throw new Error(`Nümunə kateqoriyası tapılmadı: ${slug}`);
  return category;
}
const textile = demoCategory('geyim-ayaqqabi-ve-tekstil');
const electronics = demoCategory('elektronika-ve-aksesuarlar');
const food = demoCategory('qida-ve-icki');
const building = demoCategory('tikinti-ve-temir');

export const demoStores: Store[] = [
  {
    id: 'demo-store-textile', slug: 'baku-tekstil-mmc', name: 'Baku Tekstil MMC',
    city: 'Bakı', district: 'Nərimanov', category: textile, verified: true, status: 'ACTIVE',
    description: 'Geyim və tekstil məhsullarının topdansatış təchizatçısı.',
    bannerUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=900&q=70',
  },
  {
    id: 'demo-store-tech', slug: 'techwholesale-az', name: 'TechWholesale AZ',
    city: 'Bakı', district: 'Binəqədi', category: electronics, verified: true, status: 'ACTIVE',
    description: 'Elektronika və aksesuarlar üzrə biznes alıcılar üçün topdan təkliflər.',
    bannerUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=70',
  },
  {
    id: 'demo-store-food', slug: 'absheron-food-supply', name: 'Absheron Food Supply',
    city: 'Sumqayıt', category: food, verified: true, status: 'ACTIVE',
    description: 'Market və restoranlar üçün qida məhsulları.',
    bannerUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=70',
  },
  {
    id: 'demo-store-build', slug: 'mega-insaat-supply', name: 'Mega İnşaat Supply',
    city: 'Gəncə', category: building, verified: false, status: 'ACTIVE',
    description: 'Tikinti materialları və alətlərinin topdansatışı.',
    bannerUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=70',
  },
];

type DemoProductInput = Omit<Product, 'id' | 'store' | 'category' | 'currency' | 'status'> & {
  storeIndex: number; categoryIndex: number;
};

const productInputs: DemoProductInput[] = [
  { slug: 'kis-qis-godekceleri-model-402', title: 'Kişi qış gödəkçələri Model 402',
    description: 'Topdan satış üçün qış gödəkçələri. Rəng və ölçü seçimi satıcı ilə dəqiqləşdirilir.',
    priceLabel: 'Razılaşma yolu ilə', minOrderQuantity: 50, unit: 'ədəd', stockStatus: 'IN_STOCK',
    storeIndex: 0, categoryIndex: 0 },
  { slug: 'pambiq-futbolkalar-topdan', title: 'Pambıq futbolkalar, müxtəlif rənglər',
    description: 'Gündəlik geyim üçün pambıq futbolkalar. Topdan sifariş mümkündür.',
    price: 7.5, minOrderQuantity: 100, unit: 'ədəd', stockStatus: 'IN_STOCK',
    storeIndex: 0, categoryIndex: 0 },
  { slug: 'tekstil-parca-rulonlari', title: 'Tekstil parça rulonları',
    description: 'İstehsalat üçün müxtəlif növ parça rulonları.',
    price: 12, minOrderQuantity: 25, unit: 'metr', stockStatus: 'LIMITED',
    storeIndex: 0, categoryIndex: 0 },
  { slug: 'agilli-saatlar-x-series', title: 'Ağıllı saatlar X-Series',
    description: 'Biznes alıcılar üçün ağıllı saatların topdan partiyası.',
    priceLabel: 'Razılaşma yolu ilə', minOrderQuantity: 50, unit: 'ədəd', stockStatus: 'IN_STOCK',
    storeIndex: 1, categoryIndex: 1 },
  { slug: 'usb-c-adapterler-topdan', title: 'USB-C adapterlər, 100 ədədlik partiya',
    description: 'Telefon və planşetlər üçün USB-C adapterlər.',
    price: 4.9, minOrderQuantity: 100, unit: 'ədəd', stockStatus: 'IN_STOCK',
    storeIndex: 1, categoryIndex: 1 },
  { slug: 'powerbank-20000-mah', title: 'Powerbank 20 000 mAh',
    description: 'Səfər və gündəlik istifadə üçün yüksək tutumlu powerbank.',
    price: 28, minOrderQuantity: 30, unit: 'ədəd', stockStatus: 'LIMITED',
    storeIndex: 1, categoryIndex: 1 },
  { slug: 'bugda-unu-50-kq', title: 'Buğda unu, 50 kq kisə',
    description: 'Çörəkxana və restoranlar üçün 50 kq-lıq un kisələri.',
    price: 26, minOrderQuantity: 20, unit: 'kisə', stockStatus: 'IN_STOCK',
    storeIndex: 2, categoryIndex: 2 },
  { slug: 'gunesbaxan-yagi-5-litr', title: 'Günəbaxan yağı, 5 litr',
    description: 'İaşə obyektləri üçün 5 litrlik qablaşdırmada günəbaxan yağı.',
    price: 14.5, minOrderQuantity: 48, unit: 'ədəd', stockStatus: 'IN_STOCK',
    storeIndex: 2, categoryIndex: 2 },
  { slug: 'sement-m400-50-kq', title: 'Sement M-400, 50 kq',
    description: 'Tikinti işləri üçün M-400 sement, 50 kq kisələrdə.',
    price: 8.5, minOrderQuantity: 50, unit: 'kisə', stockStatus: 'IN_STOCK',
    storeIndex: 3, categoryIndex: 3 },
  { slug: 'akkumulyatorlu-drel-desti', title: 'Akkumulyatorlu drel dəsti',
    description: 'Peşəkar istifadə üçün akkumulyatorlu drel və aksesuarlar.',
    priceLabel: 'Razılaşma yolu ilə', minOrderQuantity: 20, unit: 'dəst', stockStatus: 'OUT_OF_STOCK',
    storeIndex: 3, categoryIndex: 3 },
];

const productCategorySlugs = [
  'godekceler', 'koynekler', 'parcalar', 'smart-saatlar', 'adapter-ve-kabeller',
  'powerbanklar', 'un-seker-ve-duz', 'yaglar-ve-souslar', 'sement-ve-qum', 'elektrik-aletleri',
];
export const demoProducts: Product[] = productInputs.map(({ storeIndex, categoryIndex, ...product }, index) => ({
  ...product, id: `demo-product-${index + 1}`, store: demoStores[storeIndex],
  category: demoCategories.find((item) => item.slug === productCategorySlugs[index])
    ?? [textile, electronics, food, building][categoryIndex], currency: 'AZN', status: 'ACTIVE',
}));

demoStores.forEach((store) => {
  store.productCount = demoProducts.filter((product) => product.store?.id === store.id).length;
});
