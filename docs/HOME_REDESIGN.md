# Mobil ana səhifə — 2 oktyabr 2026

## Görünüş

Veb ana səhifəsi ilə məzmun baxımından uyğunlaşdırılmış bölmələr (yuxarıdan aşağıya):

1. Yığcam TopdanBazar başlığı, "Biznesdən biznesə. Birbaşa." şüarı və hesab keçidi.
2. Axtarış zolağı: klaviaturada "axtar" və sağdakı ox düyməsi məhsul siyahısına ötürür; mətn varsa təmizləmə düyməsi çıxır.
3. Vitrin banneri: "Topdansatış mağazaları və məhsulları bir yerdə" mesajı və iki keçid — "Mağazaları kəşf et" və "Məhsullar". Demo rejimdə sağ küncdə "Nümunə kataloq" nişanı var.
4. Etibarlılıq sətri: 400+ mağaza · 200K+ məhsul · 24/7 əlaqə · 100% yoxlanılmış satıcı.
5. Şəhər zolağı: şəhərlər yüklənmiş mağazalardan götürülür, seçim mağazalar səhifəsini həmin şəhərlə açır.
6. Kateqoriyalar: 5 əsas sahə + "Hamısı" qutusu; hər qutuda məhsul sayı göstərilir. Tam seçim pəncərəsi 13 əsas sahəni əhatə edir.
7. Vitrindəki məhsullar: iki sütunlu altı kart və "Hamısı / Stokda olanlar / Qiyməti göstərilən" sürətli seçimi.
8. Sahə karuselləri: Geyim və ayaqqabı, Elektronika, Qida və içki, Tikinti və təmir — hər biri kök kateqoriyanın bütün alt ağacından altı məhsul göstərir.
9. Mağazalar: üfüqi sürüşən kartlar (foto önizləmələri, təsdiq işarəsi, məhsul sayı).
10. "Mağaza aç" keçidi və ikonlu, aktiv səhifəni göstərən alt menyu.

Bölmələr virtualizasiya olunan `FlatList`-ə ayrı elementlər kimi verilir (`HomeSection` tipi);
axtarış, banner, etibarlılıq sətri, şəhərlər və kateqoriyalar `ListHeaderComponent`-dədir.
Ekrandan kənar bölmələr render olunmur.

## Məlumat

`demo-taxonomy.json` veb layihənin `packages/shared/src/default-categories.json` faylının surətidir.
Nümunə məhsullar uyğun yarpaq kateqoriyalarına bağlanıb; üst kateqoriya filtri bütün alt bölmələri əhatə edir.
Canlı rejim kateqoriyaları mövcud `/categories` endpoint-indən götürülür. Demo ağacı canlı cavaba əlavə edilmir.
Nümunə kataloqda hər kateqoriyada məhsul yoxdur; həmin seçimlər düzgün boş nəticə göstərir.

Ana səhifə dörd sorğu işlədir: `/products?limit=40` (sahə karuselləri və mağaza önizləmələri),
`/stores?limit=12`, `/categories` və yalnız filtr seçildikdə işə düşən
`/products?stock=IN_STOCK` və ya `/products?priceMin=0.01` sorğusu.

### Filtr düzəlişi

Əvvəl "Stokda olanlar" və "Qiyməti göstərilən" seçimləri yalnız yüklənmiş ilk 20 məhsulun
içində client tərəfdə süzülürdü; real kataloqda bu yanlış nəticə verirdi. İndi filtr
`/products` sorğusunun `stock` və `priceMin` parametrləri ilə serverdə tətbiq olunur.

### Hələ olmayan hissələr

- Etibarlılıq rəqəmləri statikdir; real sayğaclar üçün API-də ayrıca endpoint lazımdır.
- Ödənişli vitrin, sponsorlu mağazalar və tələb taxtası backend tələb edir (`featured`,
  `sponsored` sahələri və `DemandRequest` modeli yoxdur). Bu bölmələr ana səhifəyə
  əlavə edilməyib ki, istifadəçiyə uydurma məlumat göstərilməsin.
- Şəhər qutularında mağaza sayı göstərilmir, çünki yalnız ilk səhifə yüklənir.

## Yoxlama

- TypeScript və lint xətasız; 64 avtomatik test keçir.
- Emulatorda (1080×2400, 420 dpi) ana səhifənin bütün bölmələri yoxlanıb.
- "Stokda olanlar" seçildikdə `LIMITED` stoklu məhsullar siyahıdan çıxır.
- "Qiyməti göstərilən" seçildikdə yalnız qiyməti olan məhsullar qalır; "Razılaşma yolu ilə" olanlar çıxır.
- Şəhər qutusundan mağazalar səhifəsi həmin şəhərlə açılır.
- Sahə karuselində "Hamısı" keçidi həmin kateqoriyanın məhsullarına aparır.
- Kateqoriya qutusu tam seçim pəncərəsini açır; seçim məhsul siyahısına ötürülür.
- Böyük şriftlərdə (fontScale ≥ 1.3) və 350 dp-dən dar ekranlarda kartlar bir sütuna keçir.
- Yoxlama demo kataloqla aparılıb; canlı API ilə əl sınağı bu işə daxil deyil.

## Açmaq

Mobil layihədə `npm start` işlədin və emulatorda TopdanBazar tətbiqini açın.
Server 127.0.0.1:8083 ünvanındadır. Emulator yenidən başladıqda lazım olarsa `adb reverse tcp:8083 tcp:8083` işlədin.
