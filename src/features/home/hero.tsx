import { memo } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { DEMO_CATALOG } from '../../api/config';

const heroImage = require('../../../assets/images/market-hero.jpg');

/** Compact introduction leaves room for the catalog on the first screen. */
export const HomeHero = memo(function HomeHero({ onStores }: { onStores: () => void }) {
  return <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#0b3a2e' }}>
    <ImageBackground source={heroImage} resizeMode="cover">
      <View style={{ padding: 14, backgroundColor: 'rgba(8,42,33,.87)', gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#b7d6c6', fontSize: 9, fontWeight: '800', letterSpacing: 1, flex: 1 }}>BİZNESİNİZ ÜÇÜN TƏCHİZAT</Text>
          {DEMO_CATALOG && <Text style={{ color: '#dcece3', fontSize: 9, fontWeight: '600' }}>Test kataloqu</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: '#ffffff', fontSize: 19, lineHeight: 24, fontWeight: '800', letterSpacing: -.3 }}>Topdan təkliflər. Birbaşa əlaqə.</Text>
            <Text style={{ color: '#c6ddce', fontSize: 11, lineHeight: 16 }}>Biznesinizə uyğun mağazaları kəşf edin.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Mağazaları kəşf et" onPress={onStores}
            style={({ pressed }) => ({ minWidth: 46, minHeight: 46, borderRadius: 15,
              backgroundColor: pressed ? '#d5e59c' : '#e5efba', alignItems: 'center', justifyContent: 'center' })}>
            <ArrowRight size={23} color="#0b3a2e" />
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  </View>;
});
