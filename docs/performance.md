# Performans bələdçisi

Bu sənəd TopdanBazar mobil tətbiqinin Android emulyatorunda (və fiziki cihazda) daha sürətli işləməsi üçün
ölçülmüş addımları toplayır. Hər bölmədə "nə etmək", "nə qazandırır" və "necə geri qaytarmaq" izah olunur.

## 1. Gündəlik iş axını

```powershell
npm run emu:status        # emulyatorun vəziyyətini göstərir (accel, GPU, animasiya, ölçü)
npm run emu:turbo         # animasiyaları saxlayır + fon proseslərini təmizləyir
npm run start -- --dev-client
```

Emulyator bağlanıbsa əvvəlcə `npm run emu:launch` işlədin (sürətli flaglarla açır).
`npm run emu:reset` bütün turbo dəyişikliklərini geri qaytarır.

## 2. Bir dəfəlik AVD optimallaşdırması

Emulyator **bağlı** ikən:

```powershell
npm run emu:config        # config.ini-ni yeniləyir, ehtiyat nüsxə: config.ini.bak
npm run emu:launch
```

Dəyişdirilən parametrlər:

| Parametr | Əvvəl | Sonra | Səbəb |
| --- | --- | --- | --- |
| `hw.gpu.mode` | `auto` | `host` | `auto` bəzən proqram (SwiftShader) renderinə düşür; `host` host GPU-nu məcburi istifadə edir |
| `hw.ramSize` | `6144` | `4096` | Host-da 16 GB RAM var; 6 GB guest Windows paging-inə səbəb olurdu |
| `hw.cpu.ncore` | `6` | `8` | Daha çox nüvə = daha sürətli JS/build işləri |
| `hw.audioInput` | `yes` | `no` | Audio girişi fon CPU yükü yaradır |
| `hw.camera.back` / `front` | `virtualscene` / `emulated` | `none` | Kamera emulyasiyası GPU/CPU yeyir |
| `hw.keyboard` | `yes` | `yes` | Klaviatura ilə yazmaq ekran klaviaturasından sürətlidir |
| `showDeviceFrame` | `yes` | `no` | Çərçivə çəkmək əlavə render xərcidir |

## 3. Diaqnozun nəticələri (bu layihədə ölçülən)

`npm run emu:status` nəticəsi:

- **WHPX (Windows Hypervisor Platform) quraşdırılıb və işləkdir** → hardware acceleration var, problem burada deyil.
- **Renderer:** `NVIDIA GeForce RTX 4060 Laptop GPU` (host GPU, OpenGL ES 3.1) → GPU tərəfi də sağlamdır.
- **Guest:** API 37, `google_apis_playstore_ps16k`, 1080x2400 @ 420dpi, 6 GB RAM, 6 nüvə.

Buradan çıxan real dar boğazlar:

1. **Play Store (GMS) sistem şəkli.** `google_apis_playstore` paketi Google Play Services-i də gətirir; o,
   fonda daim işləyir və emulyatoru yorur. İnkişaf üçün `google_apis` (Play Store-suz) şəkil daha sürətlidir.
2. **Çox yüksək ekran ölçüsü.** 1080x2400 fiziki piksel sayı emulyatorda host GPU-ya düşən yükü artırır.
3. **Çox böyük guest RAM.** 6 GB guest + Metro + Gradle + VS Code 16 GB host-da yaddaş sıxışması yaradır;
   yaddaş sıxışması emulyatorda "donma" kimi görünür.
4. **Əvvəlki turbo rejimi animasiyaları söndürürdü** (`0 / 0 / 0`). Bu, axıcı keçidləri gizlədirdi. İndi normal `1.0 / 1.0 / 1.0` saxlanır; qısa tətbiq animasiyaları işləyir. Animasiyasız ölçmə üçün ayrıca `-DisableAnimations` seçimi var. [Keçid quruluşu](NAVIGATION.md).

## 4. Kodda edilən performans dəyişiklikləri

| Nə | Harada | Nə qazandırır |
| --- | --- | --- |
| `Screen` komponentinə `list` (FlatList) rejimi | `src/components/ui.tsx` | Uzun siyahılar artıq bütün elementləri birdən render etmir; `windowSize=7`, `initialNumToRender=6`, `removeClippedSubviews` ilə virtualizasiya olunur |
| `products`, `stores`, `seller/products`, `admin/[section]` siyahıları FlatList-ə keçdi | `src/app/(public)/(tabs)/products.tsx`, `stores.tsx`, `src/app/(seller)/seller/products.tsx`, `src/app/(admin)/admin/[section]/index.tsx` | "Daha çox göstər" ilə yığılan 60-90 kart artıq yaddaşı və render vaxtını qat-qat artırmır; `onEndReached` ilə növbəti səhifə vaxtında gəlir |
| `React.memo` | `ProductCard`, `StoreCard`, `HomeProductCard`, `HomeCategoryCard`, `HomeStoreCard`, `HomeHero`, `AdminRecordCard` | Valideyn yenidən render olanda məzmunu dəyişməyən kartlar render olunmur |
| `HomeSearchBar` ayrı memo komponent | `src/app/(public)/(tabs)/home.tsx` | Axtarış sahəsinə yazarkən əvvəl bütün ana səhifə (hero + kartlar + mağazalar) yenidən qurulurdu; indi yalnız axtarış sətri |
| `expo-image` (əvvəl React Native `Image`) | `src/components/ui.tsx`, `src/features/catalog/product-image.tsx`, `cards.tsx` | `cachePolicy="memory-disk"` ilə şəkillər diskdə saxlanılır; `recyclingKey` siyahı sürüşdürməsində təkrar istifadəni azaldır; `transition={0}` əlavə animasiya xərci yoxdur |
| `useMemo` ilə admin filtri + `useCallback` ilə `renderItem`/`keyExtractor` | admin və siyahı ekranları | Yazarkən/süzgəcləyərkən lazımsız render və funksiya kimliyi dəyişməsi aradan qalxdı |
| Gradle: `org.gradle.caching=true`, `-Xmx4096m` | `android/gradle.properties` | Native build-lər təkrar işləri keşdən götürür, daha az GC ilə sürətlənir |

## 5. Ölçmə (measurement)

Tətbiqin real FPS-i və kadr müddətini emulyatorda belə ölçmək olar:

```powershell
adb shell dumpsys gfxinfo az.topdanbazar.mobile reset
# tətbiqdə siyahıları sürüşdürün, sonra:
adb shell dumpsys gfxinfo az.topdanbazar.mobile
```

Çıxışda `Janky frames` faizi və `90th/95th/99th percentile` dəyərləri vacibdir. Müqayisə üçün dəyişiklikdən
əvvəl/sonra eyni ssenarini təkrarlayın.

## 6. Növbəti addımlar (ən böyük qazanc)

1. **Play Store-suz, daha yüngül sistem şəkli ilə ikinci AVD.** Hazırkı AVD API 37 + `google_apis_playstore_ps16k`
   üzərindədir; bu şəkil Google Play Services-i də gətirir və fonda daim işləyir.

   ```powershell
   $sdkBin = Join-Path $env:LOCALAPPDATA 'Android\Sdk\cmdline-tools\latest\bin'
   & "$sdkBin\sdkmanager.bat" "system-images;android-36;google_apis;x86_64"
   & "$sdkBin\avdmanager.bat" create avd -n TopdanDev -k "system-images;android-36;google_apis;x86_64" -d pixel_6
   ```

   Sonra bu AVD üçün:

   ```powershell
   npm run emu:config -- -Avd TopdanDev
   npm run emu:launch -- -Avd TopdanDev
   ```

2. **Aşağı ekran ölçüsü** — emulyatorda FPS-i ən çox artıran tək addım (piksel sayı ~2.3 dəfə azalır):

   ```powershell
   npm run emu:lowres      # 720x1600 / 320dpi
   npm run emu:reset       # geri
   ```

3. **Fiziki Android cihaz** — emulyator yox, real cihaz: `adb` ilə qoşun və `npm run start -- --dev-client`
   işlədib dev client-i cihazda açın. `EXPO_PUBLIC_API_BASE_URL` kompüterin LAN IP-si olmalıdır.

4. **Native build sürəti.** Standart quraşdırma 4 ABI üçün qurur; emulyator üçün yalnız x86_64 kifayətdir:

   ```powershell
   npm run android:x86     # Metro işləyərkən yalnız x86_64 quraşdırır (daha sürətli build)
   ```

5. **Release build ilə ölçmə.** `npm run android:release` ən sürətli variantdır, amma `__DEV__` söndüyü üçün
   nümunə kataloq (demo rejimi) işləmir — yalnız canlı API ilə istifadə edin. Gündəlik inkişaf üçün
   dev client + emulyator turbo rejimi daha rahatdır.

