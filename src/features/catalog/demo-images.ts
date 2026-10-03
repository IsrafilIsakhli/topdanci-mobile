import type { ImageSourcePropType } from 'react-native';

const images: Record<string, ImageSourcePropType> = {
  'kis-qis-godekceleri-model-402': require('../../../assets/images/demo/jacket.jpg'),
  'pambiq-futbolkalar-topdan': require('../../../assets/images/demo/tshirt.jpg'),
  'tekstil-parca-rulonlari': require('../../../assets/images/demo/fabric.jpg'),
  'agilli-saatlar-x-series': require('../../../assets/images/demo/watch.jpg'),
  'usb-c-adapterler-topdan': require('../../../assets/images/demo/usb.jpg'),
  'powerbank-20000-mah': require('../../../assets/images/demo/powerbank.jpg'),
  'bugda-unu-50-kq': require('../../../assets/images/demo/flour.jpg'),
  'gunesbaxan-yagi-5-litr': require('../../../assets/images/demo/oil.jpg'),
  'sement-m400-50-kq': require('../../../assets/images/demo/cement.jpg'),
  'akkumulyatorlu-drel-desti': require('../../../assets/images/demo/drill.jpg'),
};

export function demoProductImage(slug: string): ImageSourcePropType | undefined {
  return images[slug];
}
