<div align="center">

<br />

<img src="icons/icon-192.png" alt="HavaPuls Logo" width="96" height="96" />

<h1>HavaPuls</h1>

<p><strong>Ailenin hava durumu nabzı — tüm şehirler tek ekranda</strong></p>

[![Live Demo](https://img.shields.io/badge/🌐_Canlı_Demo-HavaPuls-3b82f6?style=for-the-badge)](https://alphyn12.github.io/havapuls)
[![Version](https://img.shields.io/badge/Version-2.0-10b981?style=for-the-badge)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-6366f1?style=for-the-badge&logo=pwa)](https://alphyn12.github.io/havapuls)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES2022-f59e0b?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.1_Flash-8b5cf6?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-94a3b8?style=for-the-badge)](LICENSE)

<br />

<img src="https://img.shields.io/badge/Open--Meteo-Free_Weather_API-0ea5e9?style=flat-square" />
<img src="https://img.shields.io/badge/Offline--First-Service_Worker-10b981?style=flat-square" />
<img src="https://img.shields.io/badge/Dark_%2F_Light_Mode-Supported-1e293b?style=flat-square" />
<img src="https://img.shields.io/badge/No_Backend-localStorage-f97316?style=flat-square" />
<img src="https://img.shields.io/badge/Canvas_API-Card_Sharing-ec4899?style=flat-square" />

<br /><br />

</div>

---

## Nedir?

**HavaPuls**, aynı çatı altında yaşamayan aile üyelerinin (anne, baba, kardeş, büyükanne…) bulunduğu şehirlerin **anlık hava durumunu tek ekranda** gösteren, **Gemini AI** destekli kişisel hava danışmanı PWA'dır.

Sabah işe çıkmadan önce annenin şehrinde kar mı var? Babanın şehrinde fırtına mı yaklaşıyor? Tek bakışta öğren, AI'dan kıyafet önerisi al, hava kartını paylaş.

> Sıfır backend · Sıfır kayıt · Sıfır ücret

---

## Ekran Görüntüleri

<div align="center">

| Ana Sayfa | Detay Görünümü | Grafik & AI | Ayarlar |
|:---------:|:--------------:|:-----------:|:-------:|
| Aile kartları, hava animasyonları | 5 günlük tahmin, metrikler, gündoğumu/batımı | 24s sıcaklık grafiği, kıyafet önerisi | Bildirimler, tema, API |

> *Mobil öncelikli (375px → 768px) · Dark & Light mod*

</div>

---

## Özellikler

### Çekirdek
| # | Özellik | Açıklama |
|---|---------|----------|
| 🌡️ | **Anlık Hava** | Sıcaklık, hissedilen, nem, rüzgar (km/h), UV, basınç, görünürlük, bulutluluk |
| 📅 | **5 Günlük Tahmin** | Günlük min/max, hava kodu, gündoğumu/batımı |
| 🌍 | **Çoklu Üye** | 2–4 aile üyesi, bağımsız şehirler, bağımsız hata yönetimi |
| ⚡ | **Akıllı Önbellek** | Hava: 10–60dk TTL · Şehir: sonsuz · AI: 1 saat |
| 📴 | **Offline-First** | Service Worker ile son veriler çevrimdışında gösterilir |
| 📲 | **PWA** | Ana ekrana ekle, standalone modda çalış |
| 🔒 | **Sıfır Backend** | Tüm veri localStorage'da, sunucu yok |

### v2.0 Yenilikler
| # | Özellik | Açıklama |
|---|---------|----------|
| 🌗 | **Dark / Light Tema** | Header'da tek tıkla tema geçişi, tercih localStorage'a kaydedilir |
| 🎴 | **Hava Animasyonlu Arka Plan** | Her karta özel gradient animasyon: güneş, gece, yağmur, kar, fırtına, sis… |
| 🌙 | **Gece/Gündüz İkonu** | `is_day` bayrağına göre ay+yıldız veya güneş SVG ikonu |
| ↕️ | **Sürükle-Bırak Sıralama** | Kartları mouse veya parmakla yeniden sırala, sıra kalıcı kaydedilir |
| 🔔 | **Push Bildirimler** | Sabah 07:00 hava özeti + 10°C+ sıcaklık düşüşü giyinme uyarısı |
| 📈 | **24 Saatlik Grafik** | SVG sıcaklık eğrisi, şu an göstergesi, min/max etiketleri |
| 🧥 | **AI Kıyafet Önerisi** | Gemini AI ile hava & UV & rüzgara özel kıyafet listesi |
| 🌅 | **Gündoğumu / Batımı** | Detay kartında gün uzunluğu ile birlikte gösterim |
| 🗺️ | **Şehir Belirsizliği Çözücü** | "Saray" → Van mı, Tekirdağ mı? Seçim listesi ile kullanıcı belirler |
| 🖼️ | **Kart Paylaşımı** | Canvas'ta PNG oluştur, `navigator.share()` veya indirme olarak paylaş |

---

## Teknoloji Yığını

```
Arayüz        →  Vanilla HTML5 + CSS3 + JavaScript ES2022 Modules
Hava Verisi   →  Open-Meteo API (ücretsiz, anonim, API key gerektirmez)
Geocoding     →  Open-Meteo Geocoding API (şehir → koordinat + çoklu eşleşme)
Hourly Veri   →  Open-Meteo Hourly API (24 saatlik sıcaklık)
AI Öneriler   →  Google Gemini 3.1 Flash Lite (isteğe bağlı API key)
Bildirimler   →  Web Notification API + setTimeout zamanlama
Grafik        →  SVG (Catmull-Rom eğrisi, gradient fill)
Paylaşım      →  Canvas 2D API + Web Share API
Depolama      →  localStorage (üyeler, ayarlar, önbellek, tema)
Güvenlik      →  XOR obfuscation + Base64 (API key koruması)
PWA           →  Web App Manifest + Service Worker (cache-first + network-first)
Font          →  Google Fonts — DM Sans + DM Mono
Build         →  Yok. Doğrudan tarayıcıda çalışır.
```

---

## Mimari

```
HavaPuls/
├── index.html                  # Tek sayfa — 3 view (home/detail/settings) + modal
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker (cache-first + network-first, v2)
│
├── styles/
│   ├── main.css                # Design tokens + bileşenler + dark/light tema
│   └── animations.css          # Hava ikonu, view geçişi, drag, wallpaper animasyonları
│
├── js/
│   ├── app.js                  # State, router, render, event handler, drag-drop
│   ├── api.js                  # Open-Meteo hava + geocoding + saatlik sıcaklık
│   ├── ai.js                   # Gemini AI entegrasyonu + kıyafet önerisi + kural motoru
│   ├── storage.js              # localStorage CRUD + tema + bildirim + güvenli API key
│   ├── models.js               # WMO tablosu, kural motoru, JSDoc tipleri, sabitler
│   ├── history.js              # 24 saatlik SVG sıcaklık grafiği
│   ├── share.js                # Canvas PNG üretimi + Web Share API
│   └── notifications.js        # Sabah bildirimi + giyinme uyarısı zamanlama
│
└── icons/
    ├── generate-icons.html     # Canvas ile PWA icon üretici
    └── icon-*.png              # 72 → 512px PNG ikonlar
```

### Veri Akışı

```
Kullanıcı → app.js (state + router)
               │
               ├── api.js ──────────────────► Open-Meteo Weather API
               │   geocodeCity()              └─ localStorage cache (TTL)
               │   searchCities()   ─────────► Open-Meteo Geocoding API
               │   fetchHourlyTemp()──────────► Open-Meteo Hourly API
               │
               ├── ai.js ───────────────────► Gemini 3.1 Flash Lite API
               │   getAIAdvice()              └─ localStorage cache (1s)
               │   getClothingAdvice()         └─ kural motoru fallback
               │
               ├── storage.js ──────────────► localStorage
               │   (üyeler, ayarlar, tema,
               │    API key, geocache, önbellekler)
               │
               ├── notifications.js ────────► Notification API
               │   scheduleMorningNotif()     setTimeout → 07:00
               │   checkDressingWarnings()    anında kontrol
               │
               ├── history.js ──────────────► SVG string (DOM'a inject)
               │   renderTempChart()
               │
               └── share.js ────────────────► Canvas 2D → PNG → navigator.share()
                   shareWeatherCard()                      └─ fallback: <a download>
```

---

## Kurulum

### Ön Koşullar
- Modern tarayıcı (Chrome 103+, Firefox 100+, Safari 16+)
- Python 3 **veya** Node.js (Service Worker için `localhost` gereklidir)
- [Google AI Studio](https://aistudio.google.com/apikey) ücretsiz API anahtarı *(isteğe bağlı)*

### Lokal Çalıştırma

```bash
# Repoyu klonla
git clone https://github.com/Alphyn12/havapuls.git
cd havapuls

# Lokal sunucu başlat
python -m http.server 8080
# veya
npx serve .

# Tarayıcıda aç
open http://localhost:8080
```

### PWA İkonları

```
1. icons/generate-icons.html dosyasını tarayıcıda aç
2. "Tüm İkonları İndir" butonuna bas
3. İndirilen PNG'leri icons/ klasörüne kopyala
```

---

## Kullanım

### Aile Üyesi Ekle
Header'daki **`+`** butonuna bas → avatar, isim ve şehir gir → **Kaydet**.
Şehir adı otomatik doğrulanır; birden fazla eşleşme varsa seçim listesi açılır.

### Gemini AI'ı Aktifleştir
**⚙️ Ayarlar** → *Gemini AI Anahtarı* → [Google AI Studio](https://aistudio.google.com/apikey)'dan aldığın ücretsiz anahtarı yapıştır → **Kaydet**.

> API anahtarı girilmezse kural tabanlı yedek sistem otomatik devreye girer.

### Bildirimleri Aç
**⚙️ Ayarlar** → *Bildirimler* → **Aç** → izin ver.
- **Sabah Özeti** — her gün 07:00'de tüm üyelerin hava durumu
- **Giyinme Uyarısı** — gün içi sıcaklık farkı ≥10°C olunca anlık bildirim

### Kartı Paylaş
Detay sayfasında sağ üst köşedeki **↗** butonuna bas → mobilde doğrudan paylaş, masaüstünde PNG indir.

---

## Konfigürasyon

| Ayar | Varsayılan | Açıklama |
|------|-----------|----------|
| Sıcaklık Birimi | °C | °C / °F seçimi |
| Önbellek TTL | 30 dk | 10–60 dk arası ayarlanabilir |
| Gemini API Key | — | Ayarlar ekranından girilir |
| Max Üye | 4 | localStorage tabanlı sınır |
| Tema | Dark | Dark / Light, localStorage'a kaydedilir |
| Sabah Bildirimi | Açık | Uygulama açık olduğunda 07:00'de tetiklenir |
| Giyinme Uyarısı | Açık | ≥10°C günlük sıcaklık farkında tetiklenir |

---

## Kural Tabanlı Yedek Sistem

Gemini API anahtarı yoksa veya API başarısız olursa **11 koşullu** yerleşik motor devreye girer:

| Koşul | Öneri |
|-------|-------|
| Fırtına (WMO 95–99) | ⛈️ Çıkma, şimşek tehlikeli |
| Sıcaklık ≤ 0°C | 🧊 Kalın palto, eldiven, bere |
| Sıcaklık 1–10°C | 🧥 Mont ve katmanlı giysi |
| Yağış ihtimali > %70 | ☂️ Şemsiye şart |
| Sıcaklık ≥ 35°C | 🌡️ Bol su iç, öğleden sonra güneşten kaçın |
| UV > 8 | ☀️ Güneş kremi ve şapka zorunlu |
| Rüzgar > 50 km/h | 💨 Şemsiye açma, sağlam giysi |
| Kar (WMO 71–86) | ❄️ Kaygan zemin, sağlam ayakkabı |
| Sis (WMO 45–49) | 🌫️ Dikkatli sür, yavaş yürü |
| Sıcaklık 27–34°C | 🌤️ Hafif ve açık renkli giysiler |
| 18–26°C, yağışsız | ✅ Harika bir gün, dışarı çık! |

---

## API Key Güvenliği

Gemini API anahtarı hiçbir dosyaya yazılmaz. Kullanıcı ayarlar ekranından girer; localStorage'a **XOR obfuscation → Base64 encoding** çift katmanıyla saklanır. Ağ üzerinden aktarılmaz, yalnızca istemci tarafında Gemini API çağrılarında kullanılır.

---

## Geliştirme Kararları

<details>
<summary><strong>Neden Vanilla JS? (Framework yok)</strong></summary>

Proje tek kullanıcılı, build tool'suz, doğrudan tarayıcıda çalışacak şekilde tasarlandı. React/Vue eklemenin getireceği bundle boyutu, hydration maliyeti ve bağımlılık yönetimi bu ölçekte anlamsız. ES2022 modülleri yeterince güçlü; `import/export` ile temiz bir mimari kuruldu.

</details>

<details>
<summary><strong>Neden Open-Meteo?</strong></summary>

Ücretsiz, anonim, API key gerektirmez. Ticari kullanım için bile dakikada 10.000 istek kotası var. WMO standart hava kodlarını (0–99) destekler, saatlik veri endpoint'i mevcut. Geocoding API'si de dahil olduğu için ikinci bir servis entegrasyonu gerekmez.

</details>

<details>
<summary><strong>Neden localStorage? (Backend yok)</strong></summary>

Uygulama tek kullanıcılı ve kişisel. Sunucu maliyeti, kimlik doğrulama sistemi ve API geliştirme bu senaryoda overkill. localStorage TTL tabanlı önbellek, sonsuz geo-cache ve güvenli API key saklama için yeterli. Veri tamamen kullanıcının cihazında kalır.

</details>

<details>
<summary><strong>Service Worker stratejisi</strong></summary>

- **Statik dosyalar** (CSS, JS, manifest, fontlar): **Cache-First** — hızlı yükleme, ağ yoksa önbellekten sun
- **API çağrıları** (hava durumu, geocoding, Gemini): **Network-First (5s timeout)** — taze veri öncelikli, ağ hatasında önbellekten sun
- Eski veri sunulduğunda SW istemciye `STALE_DATA` mesajı gönderir → uygulama toast gösterir

</details>

---

## Katkı

Bu proje kişisel kullanım için geliştirilmiştir. Hata bildirimleri ve öneriler için [Issues](https://github.com/Alphyn12/havapuls/issues) kullanabilirsiniz.

---

## Lisans

[MIT](LICENSE) © 2026 Alphyn12

---

<div align="center">

**Hava verisi:** [Open-Meteo](https://open-meteo.com) &nbsp;·&nbsp;
**AI:** [Google Gemini](https://ai.google.dev) &nbsp;·&nbsp;
**Font:** [DM Sans & DM Mono](https://fonts.google.com)

<sub>Sevgiyle yapıldı ☁️ · HavaPuls v2.0</sub>

</div>
