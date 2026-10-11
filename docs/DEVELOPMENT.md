# İnkişaf və test yığımları

## Nümunə və canlı rejim

Nümunə kataloq development rejimində, `EXPO_PUBLIC_DEMO_CATALOG=false` olmadığı halda işləyir. Məhsul fotoları yerli fayllardır; API, PostgreSQL və Redis tələb olunmur. Nümunə panellər haqqında [ADMIN_PANELS.md](ADMIN_PANELS.md) sənədinə baxın.

Canlı giriş, müraciətlər, sinxronlaşma və idarəetmə əməliyyatları üçün API və onun xidmətləri işləməlidir. Mobil giriş `/api/v1/auth/mobile/*` axınından istifadə edir. Şifrə bərpası və push üçün əlavə xidmət ayarları [BUYER_FEATURES.md](BUYER_FEATURES.md) sənədindədir.

## Telefon bağlantısı

| Əmr | Bağlantı |
| --- | --- |
| `npm run phone` | Expo Go · LAN · port 8084 |
| `npm run phone:tunnel` | Expo Go · tunel · port 8084 |
| `npm start` | Native development client · localhost · port 8083 |

Lokal server istifadə olunanda terminal və kompüter açıq qalmalıdır. Tunel yalnız şəbəkə bağlantısını təmin edir; kompüterin söndürülməsi Metro-nu da dayandırır. Codespaces-də isə həmin bulud mühiti və Metro aktiv qalmalıdır.

API və Metro ayrı xidmətlərdir. Expo tuneli lokal API-ni avtomatik internetə açmır. Canlı API fiziki telefonun çata bildiyi ünvanda olmalıdır.

## Android native development client

Android SDK və virtual cihazı hazırlayın, sonra ilk quraşdırmanı edin:

```sh
npx expo run:android
```

Sonrakı açılışlar üçün:

```sh
npx expo start --dev-client --localhost --port 8083
```

Terminalda `a` ilə Android cihazını açın. Native paket və ya plugin dəyişəndə tətbiqi yenidən yığmaq lazımdır.

## EAS yığımları

`eas.json` development, preview və production profillərini saxlayır. Preview Android yığımı APK yaradır:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

EAS preview mühitində `EXPO_PUBLIC_API_BASE_URL` dəyərini cihazın çata bildiyi canlı API ünvanına qurun. Lokal `.env` faylının bulud yığımında avtomatik mövcud olduğunu fərz etməyin.

Release yığımında nümunə kataloq və test admin girişləri işləməz. iPhone native yığımı üçün imzalama və Apple Developer hesabı tələb olunur. Windows-da iOS simulyatoru işləmir; Expo Go ilə fiziki iPhone-da uyğun funksiyaları yoxlamaq olar.

## Android emulyatoru

Performans təlimatı: [performance.md](performance.md).

| Əmr | Nə edir |
| --- | --- |
| `npm run emu:status` | Sürətləndirmə, GPU, animasiya və ekran vəziyyətini göstərir |
| `npm run emu:turbo` | Animasiya sürətini standart saxlayır, fon proseslərini təmizləyir |
| `npm run emu:lowres` | 720×1600 / 320 dpi ekranla işləyir |
| `npm run emu:reset` | Ekran və animasiya ayarlarını bərpa edir |
| `npm run emu:config` | Bağlı emulyatorun konfiqurasiyasını ehtiyat nüsxə ilə optimallaşdırır |
| `npm run emu:launch` | Emulyatoru performans ayarları ilə başladır |
| `npm run android:x86` | Native Android yığımını yalnız x86_64 üçün quraşdırır |

Emulyator köməkçiləri Windows PowerShell üçündür. Uzun siyahılar FlatList ilə göstərilir, şəkillər Expo Image keşindən istifadə edir.
