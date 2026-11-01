# Özgür Yurt — Portfolyo

Web, mobil ve masaüstü uygulama geliştirme çalışmalarını sergileyen kişisel portfolyo. Vite, React, TypeScript ve Tailwind CSS kullanır; scroll animasyonları GSAP ve Lenis ile hazırlanmıştır. Türkçe ve İngilizce dil desteği bulunur.

## Kurulum

Node.js 20.19+ (20.x) veya 22.12+ ve npm gereklidir. Proje klasöründe çalıştırın:

```bash
npm ci
npm run dev
```

Terminalde gösterilen yerel adresi tarayıcıda açın.

```bash
npm run build    # Üretim çıktısını dist/ klasörüne oluşturur
npm run preview  # Üretim çıktısını yerelde önizler
npm run lint     # Kod kontrolünü çalıştırır
```

## Proje yapısı ve içerik

- `src/`: Sayfalar, bileşenler, stiller ve animasyonlar.
- `src/translations.ts`: Türkçe ve İngilizce metinler.
- `public/projects.json`: Proje adları, bağlantıları ve görselleri.
- `public/images/projeler/`: Yerel proje görselleri.

Proje verileri aşağıdaki biçimde tutulur. Liste sırası sitedeki sırayı belirler; ilk üç proje ana sayfada gösterilir. İlk görsel kapak, diğerleri modal galerisidir. `url` boşsa bağlantı gösterilmez.

```json
[
  {
    "name": "Proje adı",
    "url": "https://example.com",
    "images": ["/images/projeler/proje_1.webp"]
  }
]
```

Sayfalar `/tr` ve `/en`, proje arşivleri `/tr/projeler` ve `/en/projects` adreslerindedir. Dil değişimi sayfayı yenilemez; seçim tarayıcıda saklanır.

## Görselleri WebP'ye dönüştürme

`scripts/convert_images_to_webp.py`, `public/images` klasörünü alt klasörleriyle tarar. PNG, JPG ve JPEG dosyalarından en uzun kenarı en fazla 1600 px olan `.webp` dosyaları ve 640 px olan `.thumb.webp` önizlemeleri üretir. En-boy oranını ve özgün dosyaları korur.

Python 3 ve `libwebp` destekli FFmpeg gereklidir. `ffmpeg` komutu PATH üzerinden erişilebilir olmalıdır.

```bash
python scripts/convert_images_to_webp.py
```

Çıktılardan biri zaten varsa o görsel varsayılan olarak atlanır. Yeniden oluşturmak için `--overwrite`, diğer seçenekleri görmek için `--help` ekleyin. Betik JSON'u değiştirmez; oluşan WebP yollarını `public/projects.json` dosyasına yazın.

## Yayınlama

`npm run build` sonrasında `dist/` klasörünü statik hosting hizmetine yükleyin. Netlify yönlendirmesi `public/_redirects` içinde hazırdır. Diğer servislerde `/tr` ve `/en` altındaki sayfa yolları `index.html` dosyasına yönlendirilmelidir.
