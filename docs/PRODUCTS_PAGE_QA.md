# Məhsullar səhifəsi

## Görünüş və davranış

- Yuxarıda sabit axtarış, filtr düyməsi, kateqoriya və sıralama seçimi.
- Məhsullar iki sütunda; siyahı görünüşünə keçid mövcuddur. 350 dp-dən dar ekran və 1.3-dən böyük sistem şriftində oxunaqlı tək sütun istifadə edilir.
- Kateqoriya seçimi vebin kateqoriya ağacından istifadə edir. Əsas bölmə, alt bölmə və son kateqoriya üzrə seçim mümkündür.
- Axtarış klaviaturanın axtarış düyməsi və ya ox düyməsi ilə tətbiq edilir. Təkliflər 250 ms fasilədən sonra yüklənir; kateqoriya təklifi kateqoriya filtrini seçir.
- Filtr pəncərəsində dəyişikliklər yalnız “Nəticələri göstər” düyməsi ilə tətbiq edilir. Bağlama dəyişiklikləri ləğv edir; sıfırlama pəncərədə əvvəlcə seçimləri təmizləyir.
- Aktiv seçimlər səhifədə ayrı-ayrılıqda silinir. “Filtrləri sıfırla” axtarış mətnini saxlayır; boş nəticədə “Bütün məhsullara bax” həm axtarışı, həm filtrləri təmizləyir.
- Qiymət aralığı qiyməti göstərilməyən elanları çıxarır. Razılaşma elanları hər iki qiymət sıralamasında axırdadır.
- Minimum sifariş limiti müxtəlif məhsul vahidlərinə tətbiq olunur; pəncərədə bu fərq izah edilir.
- Davam səhifələri avtomatik yüklənir, xəta zamanı əl ilə təkrar yoxlama mümkündür. Yeniləmək üçün siyahını aşağı çəkmək olar.

## API uyğunluğu

Mövcud `GET /products`, `GET /categories`, `GET /search/suggestions` istifadə edilir.
Sorğu parametrləri backend DTO-sundan təsdiqlənib: `q`, `category`, `city`, `store`, `priceMin`, `priceMax`, `minOrderMax`, `verified`, `stock`, `sort`, `cursor`, `limit`.
Demo kataloqda şəhərin tam adı, qiymət aralığı, minimum sifariş limiti və qiymət sıralaması həmin qaydalara uyğunlaşdırılıb.

## Yoxlama — 30 sentyabr 2026

- TypeScript yoxlaması keçdi.
- Mənbə kodunda ESLint xətası və xəbərdarlıq yoxdur.
- 11 test faylında 52 test keçdi. Yeni testlər: rəqəm yoxlaması, vergüllə qiymət, birləşmiş filtrlər, şəhərin tam uyğunluğu, qiymət sıralaması, davam səhifələri və təkrar məhsullar.
- Android emulatorda filtr dəyişikliklərini bağlama və tətbiq etmə yoxlanıldı: Bakı seçimi tətbiq edildikdə 6 məhsul göstərildi; bağlandıqda əvvəlki 10 məhsul saxlandı.
- Powerbank alt kateqoriyası, Bakı və maksimum 28 AZN birləşdirildikdə bir uyğun məhsul göstərildi.
- Qiymət sıralaması, axtarış təklifləri, boş axtarış nəticəsi və yığcam siyahı görünüşü yoxlanıldı.
- Standart təxminən 411 dp və 430 dp ekranlarda, həmçinin 1.4 sistem şriftində və tünd mövzuda məhsullar səhifəsi yoxlanıldı. 360 dp sınağında emulator başqa ekrana keçdiyi üçün həmin ölçüdə məhsullar səhifəsinin əl yoxlaması tamamlanmadı. Emulatorun ölçü, mövzu və şrift ayarları əvvəlki vəziyyətə qaytarıldı.

Bu yoxlamalar nümunə kataloqla aparılıb. Canlı server, fiziki iPhone və şəbəkə kəsilməsi ilə əl sınağı bu yoxlamaya daxil deyil.
