# TopdanBazar mobil tətbiqi

Android və iPhone üçün Expo / React Native tətbiqi. Alıcı, satıcı və admin eyni tətbiqdən istifadə edir. İnkişaf rejimində nümunə kataloq açılır; canlı rejimdə məlumatlar mövcud TopdanBazar API-sindən alınır.

## Başlama

1. Bu qovluqda npm install işlədin.
2. .env.example faylını .env kimi köçürün və EXPO_PUBLIC_API_BASE_URL dəyərini qurun. Şəkillərin media açarları ilə gəlməsi halında EXPO_PUBLIC_CDN_BASE_URL ünvanını da saytın istifadə etdiyi CDN ünvanına uyğun yazın.
3. Nümunə məhsul və mağazalara baxmaq üçün API, PostgreSQL və Redis tələb olunmur. Android virtual cihazını açın və `npx expo start --dev-client` işlədib terminalda `a` basın. İlk quraşdırma üçün bir dəfə `npx expo run:android` lazımdır.
4. Canlı məlumat, giriş və satıcı/admin əməliyyatlarını yoxlamaq üçün `.env` daxilində `EXPO_PUBLIC_DEMO_CATALOG=false` yazın və API, PostgreSQL və Redis xidmətlərini başladın. Mobil giriş üçün API-də /auth/mobile/* endpoint-ləri olmalıdır.

Nümunə kataloq yalnız development rejimində işləyir. Məhsul fotoları yerli fayllardır. Nümunə mağazaların əlaqə düymələri zəng və mesaj açmır, real lead hadisəsi göndərmir. Mağaza və dəstək müraciətləri demo rejimində serverə göndərilmir. Test mağaza admini və superadmin panelləri API olmadan işləyir; [girişlər və panel təlimatı](docs/ADMIN_PANELS.md). `.env` dəyişəndən sonra Metro serverini yenidən başladın.

Telefon üçün localhost kompüteri göstərmir. Kompüter və telefon eyni Wi-Fi şəbəkəsindədirsə, .env daxilində kompüterin LAN IP ünvanını yazın (məsələn, http://192.168.1.10:4000/api/v1). API həmin ünvanı dinləməli, Windows firewall girişə icazə verməlidir. iPhone-da lokal HTTP ünvanı məhdudlaşdırıla bilər; sabit HTTPS ünvanı ən etibarlı seçimdir. Canlı API ünvanı hazır olanda .env dəyərini onunla dəyişin. EXPO_PUBLIC_* dəyərləri tətbiqdə görünə bilər; bura parol və ya məxfi açar yazmayın.

## iPhone-da QR ilə test

1. iPhone-da Expo Go-nun son versiyasını quraşdırın. Layihə Expo SDK 57 istifadə edir.
2. Kompüterdə bu qovluqda `npx expo login --browser` işlədin. iPhone-dakı Expo Go-ya da eyni Expo hesabı ilə daxil olun.
3. Telefonu və kompüteri eyni Wi-Fi şəbəkəsinə qoşun, sonra `npm run phone` işlədin.
4. Terminaldakı QR-ni iPhone-un Kamera tətbiqi ilə oxudun və Expo Go ilə açın. iOS lokal şəbəkə icazəsi istəsə, icazə verin. Terminal açıq qalmalıdır.
5. Wi-Fi bağlantısı alınmırsa, telefon serverini `Ctrl+C` ilə dayandırıb `npm run phone:tunnel` işlədin. Expo tunel üçün əlavə paket quraşdırmağı istəyə bilər. Tunel bağlantısı daha yavaş ola bilər.

`npm run phone` Expo Go üçün LAN bağlantısını 8084 portunda açır. `npm start` Android virtual cihazı üçün 8083 localhost bağlantısını saxlayır. İnkişaf rejimində nümunə kataloq və iki test paneli API olmadan işləyir. Real hesaba giriş və müraciət göndərişi canlı rejimdə yoxlanmalıdır.

Rəsmi təlimat: https://docs.expo.dev/get-started/start-developing/

## Yoxlama və test yığımı

- npm run typecheck — TypeScript
- npm run lint — lint
- npm test — kritik API davranışı
- npx expo export --platform android — Android JavaScript yığımının yoxlanması

eas.json development və preview profillərini saxlayır. Expo hesabına girişdən sonra EAS preview mühitində EXPO_PUBLIC_API_BASE_URL dəyişənini telefonun çata bildiyi API ünvanına qurun; lokal .env bulud yığımına ötürülmür. Sonra npx eas-cli build --platform android --profile preview quraşdırılan Android APK yaradır. Lokal IP dəyişərsə, preview mühitini yeniləyib yenidən yığın. iPhone funksiyalarını Expo Go ilə sınamaq olar. Fiziki iPhone üçün ayrıca imzalanmış development build Apple Developer hesabı tələb edir.

## Performans

Emulyatorun yavaşlığı, siyahıların donması və ya keçidlərin ləng olması halında `docs/performance.md` sənədinə baxın. Qısa yol:

- `npm run emu:status` — emulyatorun sürətləndirmə (WHPX), GPU, animasiya və ekran vəziyyətini göstərir.
- `npm run emu:turbo` — animasiyaları söndürür və fon proseslərini təmizləyir (geri qaytarma: `npm run emu:reset`).
- `npm run emu:lowres` — eyni, üstəgəl 720x1600 / 320dpi (emulyatorda ən böyük FPS artımı).
- `npm run emu:config` — emulyator bağlı ikən AVD `config.ini` faylını optimallaşdırır (ehtiyat nüsxə ilə).
- `npm run emu:launch` — emulyatoru sürətli flaglarla (`-gpu host -no-audio -no-boot-anim`) başladır.
- `npm run android:x86` — native build-i yalnız x86_64 üçün qurur (Metro işləyərkən daha sürətli quraşdırma).

Uzun siyahılar (`Məhsullar`, `Mağazalar`, satıcı və admin siyahıları) `FlatList` ilə virtualizasiya olunur, kartlar `React.memo` ilə qorunur, şəkillər `expo-image` keşindən götürülür.

## Qovluqlar

- src/app — açıq kataloq, giriş, satıcı və admin ekranları
- src/api — API tipləri, sorğular, Bearer giriş və token yenilənməsi
- src/features — kataloq, satıcı yükləməsi və admin məlumatları
- src/components / src/theme — ortaq telefon interfeysi, işıqlı və tünd rənglər
- src/lib — əlaqə keçidləri və hadisə izləməsi
- tests — API və sessiya üçün avtomatik yoxlamalar

Refresh token cihazın SecureStore yaddaşında saxlanır; access token yalnız tətbiq yaddaşındadır. Veb tətbiqin cookie/CSRF girişi ayrıca işləyir. Bildirişlər tətbiq daxilində göstərilir; push bildirişləri bu versiyada yoxdur.

## Sınaq hesabları

Yerli və ya sonradan qoşulacaq canlı məlumatda yalnız ayrılmış sınaq hesablarından istifadə edin. Məhsul təsdiqi, silmə, mağaza dəyişiklikləri və toplu admin qərarları real istifadəçilərin məlumatını dəyişir.
