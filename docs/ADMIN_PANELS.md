# Mobil idarəetmə panelləri

## Test girişləri

| Panel | E-poçt | Şifrə |
| --- | --- | --- |
| Mağaza admini | magaza@demo.az | Magaza123! |
| Superadmin | superadmin@demo.az | Super123! |

İnkişaf rejimində `EXPO_PUBLIC_DEMO_CATALOG=false` olmadığı halda işləyir. Release yığımında bu test girişləri aktiv deyil. Giriş səhifəsində uyğun test kartına toxunub “Daxil ol” basmaq olar. API tələb olunmur.

Test sessiyası ayrı SecureStore açarında saxlanır. Real bearer token yaradılmır. Canlı girişdə bu məlumatlar serverdə yoxlanılır; mobil tətbiq onlara avtomatik admin hüququ vermir.

## Mağaza admini

- Əsas panel: aktiv/yoxlamada məhsullar, bugünkü baxışlar və əlaqə klikləri, qaralamalar, son alıcı hadisələri.
- Məhsullar: şəkilli siyahı, axtarış, status filtri, yeni məhsul və redaktə.
- Redaktə: alt kateqoriya seçimi, qiymət, minimum sifariş, anbar statusu, qaralama saxlamaq, yoxlamaya göndərmək və silmək.
- Mağaza profili: ad, ünvan, əlaqə və iş saatları.
- Statistika: 7/30/90 gün, hadisə və məhsul statuslarının müqayisəsi.
- Alıcı hadisələri: növ və dövr filtrləri.

## Superadmin

- Əsas panel: gözləyən müraciətlər, məhsul yoxlamaları, mağazalar və açıq şikayətlər.
- Müraciətlər: ətraflı məlumat, təsdiq/rədd; canlı API qurulma keçidi qaytarırsa nəticədə göstərilir.
- Məhsullar: axtarış, status, şəkilli qeydlər, tək və toplu təsdiq/rədd, dayandırma, işarələmə.
- Mağazalar: məlumatlar və status əməliyyatları.
- İstifadəçilər: rol və status. Cari hesabın öz rol/status düymələri bağlıdır.
- Kateqoriyalar: tam ağacda axtarış, yaradılma/redaktə, ana kateqoriyanı adla seçmək, aktiv/passiv.
- Şikayətlər: yoxlamaya götürmək, həll və rədd.
- Statistika, audit və sistem görünüşü.

Test dəyişiklikləri tətbiqin yaddaşında saxlanır; tam reload zamanı sıfırlanır. Açıq nümunə kataloq ayrıca qalır. Foto yükləmə, profil/şifrə dəyişməsi və real xidmətlərin sağlamlıq yoxlaması canlı API tələb edir. Nümunə panel bu məhdudiyyətləri açıq göstərir.

Canlı sistemdə səlahiyyətləri API yoxlayır. Mobil rol qoruyucuları server icazələrinin əvəzi deyil.

## Yoxlama

`npm run typecheck`, `npm run lint`, `npm run test`.

Davranış testləri: test girişinin bərpası/çıxışı, canlı girişin ayrılığı, səhv şifrə, mağaza sərhədləri, saxta rol, nümunə sorğuların serverə göndərilməməsi, məhsul yaratma → yoxlanış → təsdiq → silmə, müraciət təsdiqi, audit və dairəvi kateqoriya əlaqəsi.
