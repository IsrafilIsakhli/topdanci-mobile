import { useMemo, useRef, useState } from 'react';
import { FlatList, Image as NativeImage, Modal, Pressable, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Product } from '../../api/types';
import { DEMO_CATALOG } from '../../api/config';
import { useReducedMotion } from '../../components/navigation-motion';
import { useColors } from '../../theme/colors';
import { reportImageLoadFailure } from '../../lib/remote-image';
import { demoProductImage } from './demo-images';
import { productImageUris } from './detail-data';

type PhotoItem = { key: string; uri?: string; local?: ImageSourcePropType; alt: string };

function Photo({ item }: { item?: PhotoItem }) {
  const c = useColors(); const [failed, setFailed] = useState(false);
  if (!item || failed) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: c.background }}>
    <ImageIcon size={32} color={c.muted} /><Text style={{ color: c.muted, fontSize: 12 }}>{failed ? 'Şəkil açılmadı' : 'Şəkil əlavə edilməyib'}</Text>
  </View>;
  if (item.local) return <NativeImage source={item.local} resizeMode="contain" accessibilityLabel={item.alt} style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} />;
  return <Image source={{ uri: item.uri }} contentFit="contain" cachePolicy="memory-disk" transition={0} accessibilityLabel={item.alt}
    onError={(event) => { setFailed(true); if (item.uri) void reportImageLoadFailure(item.uri, event.error, 'ProductGallery'); }}
    style={{ width: '100%', height: '100%' }} />;
}

function ZoomPhoto({ item }: { item: PhotoItem }) {
  const c = useColors(); const dimensions = useWindowDimensions(); const reduced = useReducedMotion();
  const [height, setHeight] = useState(dimensions.height * .6);
  const scale = useSharedValue(1); const baseScale = useSharedValue(1);
  const x = useSharedValue(0); const y = useSharedValue(0); const startX = useSharedValue(0); const startY = useSharedValue(0);
  const duration = reduced ? 0 : 180;
  const width = dimensions.width;
  const reset = () => { scale.set(withTiming(1, { duration })); x.set(withTiming(0, { duration })); y.set(withTiming(0, { duration })); };
  const pinch = Gesture.Pinch().onStart(() => { baseScale.set(scale.get()); }).onUpdate((event) => {
    const next = Math.max(1, Math.min(4, baseScale.get() * event.scale));
    scale.set(next);
    const boundX = (next - 1) * width / 2; const boundY = (next - 1) * height / 2;
    x.set(Math.max(-boundX, Math.min(boundX, x.get()))); y.set(Math.max(-boundY, Math.min(boundY, y.get())));
  });
  const pan = Gesture.Pan().maxPointers(1).onStart(() => { startX.set(x.get()); startY.set(y.get()); }).onUpdate((event) => {
    const boundX = (scale.get() - 1) * width / 2; const boundY = (scale.get() - 1) * height / 2;
    x.set(Math.max(-boundX, Math.min(boundX, startX.get() + event.translationX)));
    y.set(Math.max(-boundY, Math.min(boundY, startY.get() + event.translationY)));
  });
  const doubleTap = Gesture.Tap().numberOfTaps(2).maxDelay(250).onEnd((_event, success) => {
    if (!success) return;
    scale.set(withTiming(scale.get() > 1 ? 1 : 2.5, { duration }));
    x.set(withTiming(0, { duration })); y.set(withTiming(0, { duration }));
  });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }] }));
  const zoom = (step: number) => {
    scale.set(withTiming(Math.max(1, Math.min(4, scale.get() + step)), { duration }));
    x.set(withTiming(0, { duration })); y.set(withTiming(0, { duration }));
  };
  return <View style={{ flex: 1, gap: 10 }}>
    <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)} style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f8f6f1' }}>
      <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
        <Animated.View style={[{ width: '100%', height: '100%' }, style]}><Photo key={item.key} item={item} /></Animated.View>
      </GestureDetector>
    </View>
    <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', paddingHorizontal: 16 }}>İki dəfə toxunun və ya barmaqlarınızla böyüdün</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
      {[{ label: 'Şəkli kiçilt', Icon: Minus, action: () => zoom(-.5) }, { label: 'Şəkli böyüt', Icon: Plus, action: () => zoom(.5) },
        { label: 'Şəkil ölçüsünü sıfırla', Icon: RotateCcw, action: reset }].map(({ label, Icon, action }) => <Pressable key={label} accessibilityRole="button"
          accessibilityLabel={label} onPress={action} style={{ width: 48, height: 46, borderRadius: 13, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={c.brand} />
        </Pressable>)}
    </View>
  </View>;
}

export function ProductGallery({ product }: { product: Product }) {
  const c = useColors(); const dimensions = useWindowDimensions(); const insets = useSafeAreaInsets(); const reduced = useReducedMotion();
  const [width, setWidth] = useState(dimensions.width - 56); const [index, setIndex] = useState(0); const [full, setFull] = useState(false);
  const list = useRef<FlatList<PhotoItem>>(null);
  const items = useMemo<PhotoItem[]>(() => {
    const local = DEMO_CATALOG ? demoProductImage(product.slug) : undefined;
    if (local) return [{ key: product.slug, local, alt: product.title }];
    return productImageUris(product).map((uri, i) => ({ key: uri, uri, alt: product.images?.find((item) => item.cdnUrl === uri)?.altText ?? product.title + ' · şəkil ' + (i + 1) }));
  }, [product]);
  const go = (next: number) => { setIndex(next); list.current?.scrollToOffset({ offset: next * width, animated: !reduced }); };
  const height = Math.min(280, Math.max(220, dimensions.width * .65));
  return <View style={{ gap: 9 }}>
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height, borderRadius: 17, backgroundColor: '#f8f6f1', overflow: 'hidden' }}>
      {items.length ? <FlatList ref={list} key={width} data={items} keyExtractor={(item) => item.key} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.min(index, items.length - 1)} getItemLayout={(_data, i) => ({ length: width, offset: i * width, index: i })}
        onMomentumScrollEnd={(event) => setIndex(Math.min(items.length - 1, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / width))))}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel="Məhsul şəklini böyüt"
          accessibilityHint="Tam ekranda açın və barmaqlarınızla yaxınlaşdırın" onPress={() => setFull(true)} style={{ width, height }}>
          <Photo item={item} />
        </Pressable>} /> : <Photo />}
      {items.length > 0 && <View pointerEvents="none" style={{ position: 'absolute', right: 10, bottom: 10, borderRadius: 10, padding: 8,
        backgroundColor: c.surface, flexDirection: 'row', gap: 5, alignItems: 'center' }}>
        <Maximize2 size={14} color={c.brand} /><Text style={{ color: c.brand, fontSize: 10, fontWeight: '700' }}>Böyüt</Text>
      </View>}
    </View>
    {items.length > 1 && <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      {items.map((item, i) => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={'Şəkil ' + (i + 1)} accessibilityState={{ selected: index === i }}
        onPress={() => go(i)} style={{ minWidth: 38, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: index === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: index === i ? c.brand : c.line }} />
      </Pressable>)}
    </View>}
    {full && items[index] && <Modal animationType={reduced ? 'none' : 'fade'} visible onRequestClose={() => setFull(false)} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }}>
        <View style={{ padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 3 }}><Text numberOfLines={1} style={{ color: c.ink, fontSize: 15, fontWeight: '800' }}>{product.title}</Text>
            <Text style={{ color: c.muted, fontSize: 11 }}>{index + 1} / {items.length}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Şəkli bağla" onPress={() => setFull(false)}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}><X size={21} color={c.ink} /></Pressable>
        </View>
        <ZoomPhoto key={items[index].key} item={items[index]} />
        {items.length > 1 && <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Əvvəlki şəkil" disabled={index === 0} onPress={() => go(index - 1)}
            style={{ minWidth: 60, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? .3 : 1 }}><ChevronLeft size={24} color={c.brand} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Növbəti şəkil" disabled={index === items.length - 1} onPress={() => go(index + 1)}
            style={{ minWidth: 60, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: index === items.length - 1 ? .3 : 1 }}><ChevronRight size={24} color={c.brand} /></Pressable>
        </View>}
      </GestureHandlerRootView>
    </Modal>}
  </View>;
}
