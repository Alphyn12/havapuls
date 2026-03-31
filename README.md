<div align="center">

<br />

<img src="icons/icon-192.png" alt="HavaPuls Logo" width="100" height="100" />

<h1>HavaPuls</h1>

<p><em>Ailenin hava durumu nabzı — tüm şehirler tek ekranda</em></p>

<br />

[![Live Demo](https://img.shields.io/badge/🌐_Canlı_Demo-havapuls-3b82f6?style=for-the-badge)](https://alphyn12.github.io/havapuls)
[![Version](https://img.shields.io/badge/Version-3.0-10b981?style=for-the-badge)](#)
[![PWA](https://img.shields.io/badge/PWA-Ready-6366f1?style=for-the-badge&logo=pwa)](https://alphyn12.github.io/havapuls)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES2022-f59e0b?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.1_Flash-8b5cf6?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-94a3b8?style=for-the-badge)](LICENSE)

<br />

![Open-Meteo](https://img.shields.io/badge/Open--Meteo-Free_API-0ea5e9?style=flat-square)
![Air Quality](https://img.shields.io/badge/Air_Quality-AQI_Index-10b981?style=flat-square)
![Offline First](https://img.shields.io/badge/Offline--First-Service_Worker-6366f1?style=flat-square)
![No Backend](https://img.shields.io/badge/No_Backend-localStorage-f97316?style=flat-square)
![Dark / Light](https://img.shields.io/badge/Dark_%2F_Light-Mode-1e293b?style=flat-square)

<br /><br />

</div>

---

## Ne Yapar?

**HavaPuls**, aynı çatı altında yaşamayan aile üyelerinin (anne, baba, kardeş, büyükanne…) bulunduğu şehirlerin anlık hava durumunu **tek ekranda** gösteren, **Gemini AI** destekli kişisel hava danışmanıdır.

Sabah işe çıkmadan önce annenin şehrinde kar mı var? Babanın şehrinde hava kalitesi kötü mü? Rüzgar hangi yönden esiyor? Tek bakışta öğren, AI'dan kıyafet önerisi al, hava kartını paylaş.

> **Sıfır backend · Sıfır kayıt · Sıfır ücret**

---

## Özellikler

### Çekirdek
| | Özellik | Açıklama |
|---|---------|----------|
| 🌡️ | **Anlık Hava** | Sıcaklık, hissedilen, nem, rüzgar, UV, basınç, görünürlük, bulutluluk |
| 📅 | **5 Günlük Tahmin** | Günlük min/max, hava kodu, yağış bar chart |
| 🌍 | **Çoklu Üye** | 2–4 aile üyesi, bağımsız şehirler, bağımsız hata yönetimi |
| ⚡ | **Akıllı Önbellek** | Hava: 10–60dk TTL · Şehir: sonsuz · AI: 1 saat |
| 📴 | **Offline-First** | Service Worker ile son veriler çevrimdışında gösterilir |
| 📲 | **PWA** | Ana ekrana ekle, standalone modda çalış |
| 🔒 | **Sıfır Backend** | Tüm veri localStorage'da, sunucu yok |

### v3.0 — Yeni Özellikler
| | Özellik | Açıklama |
|---|---------|----------|
| 🌬️ | **Hava Kalitesi (AQI)** | European AQI badge — İyi / Makul / Orta / Kötü / Çok Kötü |
| ⏱️ | **Saatlik Detay Tablosu** | Şu andan 12 saat ilerisi: sıcaklık + yağış olasılığı bar + rüzgar hızı |
| 🧭 | **Rüzgar Yön Kadranı** | SVG kadran, 16 yön (K/KKD/KD…G), derece değeri ile birlikte |
| 🌅 | **Güneş Takvimi** | Animasyonlu timeline — doğum/batım bandı, şu an çizgisi, gün uzunluğu |
| 🌧️ | **Yağış Bar Chart** | 5 günlük tahminde yüksekliğe göre mini bar grafiği |
| 🌡️ | **Hissedilen Karşılaştırma** | Gerçek ↑↓→ Hissedilen: renk kodlu ok + Türkçe açıklama |
| 📌 | **Pin / Sabitleme** | Yıldız butonu ile önemli üye her zaman listenin en üstünde |
| 🎨 | **Animasyonlu Arka Plan** | Hava kategorisine özel CSS arka plan: yağmur çizgileri, kar noktaları, güneş parıltısı, fırtına titremesi, sis kayması |

### v2.0 — Önceki Özellikler
| | Özellik | Açıklama |
|---|---------|----------|
| 🌗 | **Dark / Light Tema** | Header'da tek tıkla tema geçişi |
| 🎴 | **Kart Arka Plan Animasyonları** | Her karta özel gradient: güneş, yağmur, kar, fırtına… |
| 🌙 | **Gece/Gündüz İkonu** | `is_day` bayrağına göre ay+yıldız veya güneş SVG |
| ↕️ | **Sürükle-Bırak Sıralama** | Mouse veya parmakla sırala, kalıcı kaydedilir |
| 🔔 | **Push Bildirimler** | Sabah 07:00 özeti + 10°C+ sıcaklık düşüşü uyarısı |
| 📈 | **24 Saatlik Grafik** | SVG sıcaklık eğrisi, şu an göstergesi, min/max |
| 🧥 | **AI Kıyafet Önerisi** | Gemini AI ile hava+UV+rüzgara özel kıyafet listesi |
| 🗺️ | **Şehir Belirsizliği Çözücü** | Aynı isimli şehirler için seçim listesi |
| 🖼️ | **Kart Paylaşımı** | Canvas PNG + `navigator.share()` veya indirme |

---

## Teknoloji Yığını

```
Arayüz          →  Vanilla HTML5 + CSS3 + JavaScript ES2022 Modules
Hava Verisi     →  Open-Meteo Weather API (ücretsiz, anonim)
Geocoding       →  Open-Meteo Geocoding API
Saatlik Veri    →  Open-Meteo Hourly API (sıcaklık + yağış + rüzgar)
Hava Kalitesi   →  Open-Meteo Air Quality API (European AQI)
AI Öneriler     →  Google Gemini 3.1 Flash Lite (isteğe bağlı API key)
Bildirimler     →  Web Notification API + setTimeout zamanlama
Grafik          →  SVG (Catmull-Rom eğrisi, gradient fill)
Paylaşım        →  Canvas 2D API + Web Share API
Depolama        →  localStorage (üyeler, ayarlar, önbellek, tema)
Güvenlik        →  XOR obfuscation + Base64 (API key koruması)
PWA             →  Web App Manifest + Service Worker (cache-first + network-first)
Font            →  Google Fonts — DM Sans + DM Mono
Build           →  Yok. Doğrudan tarayıcıda çalışır.
```

---

## Mimari

```
HavaPuls/
├── index.html                  # Tek sayfa — 3 view (home/detail/settings) + modal
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker (cache-first + network-first)
│
├── styles/
│   ├── main.css                # Design tokens + bileşenler + dark/light tema
│   └── animations.css          # İkon, view, wallpaper ve arka plan animasyonları
│
├── js/
│   ├── app.js                  # State, router, render, event handler, drag-drop
│   ├── api.js                  # Open-Meteo: hava + geocoding + saatlik + AQI
│   ├── ai.js                   # Gemini AI + kıyafet önerisi + kural motoru
│   ├── storage.js              # localStorage CRUD + güvenli API key yönetimi
│   ├── models.js               # WMO tablosu, kural motoru, JSDoc tipleri
│   ├── history.js              # 24s SVG grafik + 12s saatlik detay tablosu
│   ├── share.js                # Canvas PNG + Web Share API
│   └── notifications.js        # Sabah bildirimi + giyinme uyarısı
│
└── icons/
    └── icon-*.png              # 72 → 512px PWA ikonlar
```

### Veri Akışı

```
Kullanıcı → app.js (state + router)
               │
               ├── api.js ──────────────────► Open-Meteo Weather API
               │   geocodeCity()              └─ localStorage cache (TTL)
               │   fetchWeatherWithCache()
               │   fetchHourlyTemperature()───► Hourly: sıcaklık + yağış + rüzgar
               │   fetchAQI()  ───────────────► Air Quality API (European AQI)
               │
               ├── ai.js ───────────────────► Gemini 3.1 Flash Lite API
               │   getAIAdvice()              └─ localStorage cache (1s)
               │   getClothingAdvice()         └─ kural motoru fallback
               │
               ├── storage.js ──────────────► localStorage
               │
               ├── notifications.js ────────► Notification API
               │
               ├── history.js ──────────────► SVG string + Hourly HTML table
               │   renderTempChart()
               │   renderHourlyTable()
               │
               └── share.js ────────────────► Canvas 2D → PNG → navigator.share()
```

---

## Kurulum

### Ön Koşullar
- Modern tarayıcı (Chrome 103+, Firefox 100+, Safari 16+)
- Python 3 veya Node.js (Service Worker için `localhost` gerekir)
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

---

## Kullanım

### Aile Üyesi Ekle
Header'daki **`+`** butonuna bas → avatar, isim ve şehir gir → **Kaydet**.
Şehir adı otomatik doğrulanır; birden fazla eşleşme varsa seçim listesi açılır.

### Üyeyi Sabitle
Kart üzerindeki **☆ yıldız** butonuna bas — üye her zaman listenin en üstünde görünür.

### Hava Kalitesini Görüntüle
Ana kart üzerindeki **AQI badge**'ini incele. Detay sayfasında saatlik tablo, rüzgar kadranı ve güneş takvimi otomatik yüklenir.

### Gemini AI'ı Aktifleştir
**⚙️ Ayarlar** → *Gemini AI Anahtarı* → [Google AI Studio](https://aistudio.google.com/apikey)'dan aldığın ücretsiz anahtarı yapıştır → **Kaydet**.

> API anahtarı girilmezse kural tabanlı yedek sistem otomatik devreye girer.

### Bildirimleri Aç
**⚙️ Ayarlar** → *Bildirimler* → **Aç** → tarayıcı izin isteği onaylanır.

---

## Konfigürasyon

| Ayar | Varsayılan | Açıklama |
|------|-----------|----------|
| Sıcaklık Birimi | °C | °C / °F seçimi |
| Önbellek TTL | 30 dk | 10–60 dk arası ayarlanabilir |
| Gemini API Key | — | Ayarlar ekranından girilir |
| Max Üye | 4 | localStorage tabanlı sınır |
| Tema | Dark | Dark / Light, localStorage'a kaydedilir |
| Pin | — | Üye başına tek tıkla sabitleme |
| Sabah Bildirimi | Açık | Uygulama açıkken 07:00'de tetiklenir |
| Giyinme Uyarısı | Açık | ≥10°C günlük sıcaklık farkında tetiklenir |

---

## Kural Tabanlı Yedek Sistem

Gemini API anahtarı yoksa veya API başarısız olursa **kural tabanlı** yerleşik motor devreye girer:

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
| Sis (WMO 45–48) | 🌫️ Dikkatli sür, yavaş yürü |
| 18–26°C, yağışsız | ✅ Harika bir gün, dışarı çık! |

---

## API Key Güvenliği

Gemini API anahtarı hiçbir dosyaya yazılmaz. Kullanıcı ayarlar ekranından girer; localStorage'a **XOR obfuscation → Base64 encoding** çift katmanıyla saklanır. Ağ üzerinden aktarılmaz, yalnızca istemci tarafında Gemini API çağrılarında kullanılır.

---

## Geliştirme Kararları

<details>
<summary><strong>Neden Vanilla JS?</strong></summary>

Proje tek kullanıcılı, build tool'suz, doğrudan tarayıcıda çalışacak şekilde tasarlandı. React/Vue eklemenin getireceği bundle boyutu, hydration maliyeti ve bağımlılık yönetimi bu ölçekte anlamsız. ES2022 modülleri yeterince güçlü.

</details>

<details>
<summary><strong>Neden Open-Meteo?</strong></summary>

Ücretsiz, anonim, API key gerektirmez. WMO standart hava kodlarını destekler. Hava kalitesi (AQI), saatlik veri, geocoding ve forecast tek ekosistemde. Ticari kullanım için bile yüksek istek kotası.

</details>

<details>
<summary><strong>Neden localStorage?</strong></summary>

Uygulama tek kullanıcılı ve kişisel. Sunucu maliyeti, kimlik doğrulama ve API geliştirme bu senaryoda overkill. Veri tamamen kullanıcının cihazında kalır.

</details>

<details>
<summary><strong>Service Worker stratejisi</strong></summary>

- **Statik dosyalar** (CSS, JS, manifest): **Cache-First** — hızlı yükleme
- **API çağrıları** (hava, geocoding, AQI, Gemini): **Network-First (5s timeout)** — taze veri öncelikli, ağ hatasında önbellekten sun
- Eski veri sunulduğunda SW istemciye `STALE_DATA` mesajı gönderir → toast gösterilir

</details>

---

## Katkı

Bu proje kişisel kullanım için geliştirilmiştir. Hata bildirimleri ve öneriler için [Issues](https://github.com/Alphyn12/havapuls/issues) bölümünü kullanabilirsiniz.

---

## Lisans

[MIT](LICENSE) © 2026 Alphyn12

---

<div align="center">

**Hava verisi:** [Open-Meteo](https://open-meteo.com) &nbsp;·&nbsp;
**AI:** [Google Gemini](https://ai.google.dev) &nbsp;·&nbsp;
**Font:** [DM Sans & DM Mono](https://fonts.google.com)

<sub>Sevgiyle yapıldı ☁️ · HavaPuls v3.0</sub>

</div>
