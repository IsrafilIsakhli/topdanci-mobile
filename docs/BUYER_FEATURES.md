# Mobil alıcı imkanları — 8 oktyabr 2026

## Hazır olanlar

- Mağaza müraciəti, dəstək mesajı, alıcı tələbi, şikayət və satıcı məhsul formaları avtomatik qaralama saxlayır. Qorunan SecureStore yaddaşı, hesab və nümunə/canlı rejim ayrılığı, 30 günlük müddət var. Şifrələr qaralamaya daxil edilmir.
- Göndərilməmiş formadan çıxarkən qalmaq, saxlayıb çıxmaq və silmək seçimləri göstərilir. Göndərilmə xətasında forma təmizlənmir.
- İnternet olmayanda əvvəllər yüklənmiş açıq kateqoriya, məhsul və mağaza məlumatları görünə bilər. Keş ən çox 30 sorğu və 7 gün üçündür. Köhnə qiymət/stok ayrıca işarələnir; şəkil keşi ayrıca expo-image tərəfindən idarə olunur.
- Hesab, admin, satıcı, şəxsi tələb və bildiriş cavabları açıq kataloq keşinə yazılmır. İnternetin qayıtması və tətbiqin önə çıxması yeniləməni başladır.
- Seçilmiş məhsul və mağazalar canlı rejimdə hesaba bağlanır. Qonaq seçimləri ilk girişdə həmin hesaba köçürülür. Son baxılanlar, axtarışlar və filtrlər cihazda qalır.
- Hər bölmədə son 100 seçim saxlanır. Limit dolanda ən köhnə seçim çıxarılır. İnternetsiz dəyişikliklər, o cümlədən silmələr, internet olduqda göndərilir.
- Hesabla yerləşdirilmiş tələblər başqa cihazda da görünür və idarə olunur. Qonaq tələbləri giriş zamanı qorunan idarə açarı ilə hesaba bağlanır. Hesaba köçürülməmiş qonaq tələbinin idarəsi yalnız ilk cihazdadır.
- Məhsul və mağazada native paylaşım və problem bildirmə var. Canlı rejimdə paylaşım saytın HTTPS məhsul/mağaza səhifəsinə aparır. Nümunə rejimində Expo/tətbiq keçidi paylaşılır; bunun üçün test serveri əlçatan olmalıdır.
- Şikayətlər canlı API-də mövcud admin şikayətlərinə düşür. Nümunə rejimində real şikayət göndərilmir.
- Görünüş yalnız işıqlıdır.

## Canlı API-ni yeniləmək

Server layihəsi: C:/Projects/Topdanci.az.

Yeni miqrasiya: apps/api/prisma/migrations/20261008120000_account_favorites/migration.sql.
Əvvəlki alıcı/şifrə/push miqrasiyası da tətbiq olunmalıdır. İstehsal bazasına avtomatik tətbiq edilməyib.

Serverdə adi deploy qaydası ilə:
~~~sh
npm run prisma:generate
npm run prisma:deploy
npm run build:api
~~~

API-ni yenidən başladın. Mobil mühitdə:
~~~dotenv
EXPO_PUBLIC_DEMO_CATALOG=false
EXPO_PUBLIC_API_BASE_URL=https://api.oz-domeniniz.az/api/v1
EXPO_PUBLIC_WEB_BASE_URL=https://oz-domeniniz.az
~~~

EXPO_PUBLIC_* dəyərləri gizli deyil. Məxfi açarları burada saxlamayın.

## Şifrə bərpası və push — xarici ayarlar lazımdır

Kod və server sınaqları hazırdır; real məktub və telefon bildirişi üçün xidmətlər hələ qoşulmayıb.

### E-poçt

1. Resend hesabında göndərən domeni təsdiqləyin.
2. Serverdə RESEND_API_KEY və MAIL_FROM qurun.
3. Canlı tətbiqdə Şifrəni unutdum → e-poçt → 6 rəqəmli kod → yeni şifrə axınını real sınaq hesabında yoxlayın.
4. Yanlış/vaxtı keçmiş kod, təkrar istifadə, məktub gəlməməsi və çıxmış sessiyaları yoxlayın.

Ayar olmadıqda xidmətin hazır olmadığı göstərilir; saxta uğur cavabı verilmir.
Mənbə: https://resend.com/docs/api-reference/emails/send-email

### Push

1. Expo/EAS layihəsini yaradın; EXPO_PUBLIC_EAS_PROJECT_ID qurun.
2. Android Firebase/FCM V1 və iOS APNs açarlarını EAS Credentials ilə qoşun. Android faylını GOOGLE_SERVICES_FILE yolu ilə göstərin; açar fayllarını Git-ə salmayın.
3. Serverdə PUSH_ENABLED=true qoyun. Expo push token müdafiəsi istifadə edilirsə, EXPO_ACCESS_TOKEN serverdə saxlanmalıdır.
4. Yenilənmiş native development/preview build hazırlayın. Uzaq push üçün yalnız Expo Go sınağı kifayət deyil.
5. Hesab → Bildirişlər bölməsində bu cihazı aktivləşdirin. Məhsul yoxlaması və tələbə yeni təklif hadisələrini açıq, arxa planda və bağlı tətbiqdə yoxlayın.

Mənbələr:
- https://docs.expo.dev/push-notifications/push-notifications-setup/
- https://docs.expo.dev/push-notifications/fcm-credentials/
- https://docs.expo.dev/push-notifications/sending-notifications/

## Paylaşım keçidləri

Canlı paylaşım HTTPS sayt səhifəsini açır. Sayt linkinin birbaşa native tətbiqi açması üçün domen üzərində iOS AASA və Android assetlinks.json, imzalama identifikatorları və yeni native build ayrıca qurulmalıdır. Mövcud +native-intent sayt yolunu /product və /store mobil yoluna çevirir; domen əlaqələndirməsi olmadan avtomatik tətbiq açılması iddia edilmir.

## Yoxlama

Mobil:
~~~sh
npm run typecheck
npm run lint
npm test
npx expo export --platform android
~~~

Serverdə xüsusi sınaq:
~~~sh
node scripts/verify-buyer-features.cjs
~~~

Bu sınaq yalnız localhost:5433-də ayrıca müvəqqəti baza yaradır, miqrasiyaları tətbiq edir və bitəndə həmin sınaq bazasını silir. Redis üçün ayrıca 14-cü baza istifadə olunur.

Telefon üzərində yoxlayın: qaralama yazıb geri çıxmaq və yenidən açmaq, göndərmə zamanı interneti kəsmək, ürək seçimini internet olmadan silmək, eyni hesabı ikinci cihazda açmaq, paylaşım və şikayət səbəbləri, böyük mətn ölçüsü və klaviatura.
