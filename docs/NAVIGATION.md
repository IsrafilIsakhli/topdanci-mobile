# Səhifələr arasında keçidlər

## Quruluş

- `src/app/(public)/(tabs)`: ana səhifə, məhsullar, mağazalar və hesab. Ünvanlar əvvəlki kimi `/home`, `/products`, `/stores`, `/more` qalır.
- Alt menyunu tab navigatoru bir dəfə göstərir. Səhifələrdəki köhnə menyu çağırışları həmin kontekstdə gizlənir.
- Bölmələr arasında 180 ms fade keçidi var. Səhifə yaddaşda qalır: sürüşmə mövqeyi, axtarış, sıralama və filtrlər saxlanır.
- Yeni axtarış/kateqoriya ünvanı göndəriləndə məhsul/mağaza siyahısı həmin yeni parametrləri tətbiq edir.
- Məhsul, mağaza və əlavə səhifələr ayrıca stack ekranlarıdır, sağdan sürüşərək açılır. Geri dönüş əvvəlki ekranı bərpa edir.
- Detaldakı alt menyu mövcud bölməyə `dismissTo` ilə qayıdır.
- Satıcı/admin ekranlarında bölmə keçidləri fade, redaktə/detal keçidləri slide animasiyası istifadə edir.
- Telefonun “Reduce motion” seçimi aktivdirsə animasiyalar söndürülür.

## Emulyator

Əvvəlki turbo rejimi üç Android animasiya əmsalını sıfıra salırdı. Bu, tətbiqdəki animasiyaları da gizlədirdi. Artıq standart turbo rejimi normal 1.0 animasiyaları saxlayır. Animasiya olmadan ayrıca performans ölçümü üçün skriptə `-DisableAnimations` verilməlidir.

## Yoxlanmış davranışlar

Android emulyatorunda:
- mağaza kateqoriyası bölmələr arasında saxlanır;
- mağaza detalından geri dönüş filtrli siyahını bərpa edir;
- mağazanın məhsul kataloqu həmin mağaza ilə süzülür;
- ana səhifənin sürüşmə mövqeyi saxlanır;
- məhsul detalından geri dönüş ana səhifədəki mövqeyi bərpa edir;
- detalın alt menyusu əvvəlki filtrli mağaza bölməsinə qayıdır.

Fiziki iPhone və canlı API ayrıca yoxlanmayıb.
