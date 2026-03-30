<div align="center">

<br />

<img src="icons/icon-192.png" alt="HavaPuls Logo" width="96" height="96" />

<h1>HavaPuls</h1>

<p><strong>Ailenin hava durumu nabzı — tüm şehirler tek ekranda</strong></p>

[![Live Demo](https://img.shields.io/badge/🌐_Canlı_Demo-HavaPuls-3b82f6?style=for-the-badge)](https://alphyn12.github.io/havapuls)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-10b981?style=for-the-badge&logo=pwa)](https://alphyn12.github.io/havapuls)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES2022-f59e0b?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.1_Flash-8b5cf6?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-94a3b8?style=for-the-badge)](LICENSE)

<br />

<img src="https://img.shields.io/badge/Open--Meteo-Free_Weather_API-0ea5e9?style=flat-square" />
<img src="https://img.shields.io/badge/Offline--First-Service_Worker-10b981?style=flat-square" />
<img src="https://img.shields.io/badge/Dark_Mode-Only-1e293b?style=flat-square" />
<img src="https://img.shields.io/badge/No_Backend-localStorage-f97316?style=flat-square" />

<br /><br />

</div>

---

## Nedir?

**HavaPuls**, aynı çatı altında yaşamayan aile üyelerinin (anne, baba, kardeş, büyükanne…) bulunduğu şehirlerin **anlık hava durumunu tek ekranda** gösteren, **Gemini AI** destekli kişisel hava danışmanı PWA'dır.

Sabah işe çıkmadan önce annenin şehrinde kar mı var? Babanın şehrinde fırtına mı yaklaşıyor? Tek bakışta öğren, AI'dan giyim önerisi al.

---

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🌡️ **Anlık Hava** | 2m sıcaklık, hissedilen, nem, rüzgar, UV, basınç, görünürlük |
| 📅 **5 Günlük Tahmin** | Yatay kaydırmalı günlük min/max kart |
| 🤖 **Gemini AI Öneriler** | "Şemsiye al", "Güneş kremi sür" — bağlama özel 3 cümlelik öneri |
| 📴 **Offline-First** | Service Worker ile son veriler çevrimdışında gösterilir |
| 📲 **PWA** | Ana ekrana ekle, standalone modda çalış |
| 🔒 **Sıfır Backend** | Tüm veri localStorage'da, sunucu yok |
| ⚡ **30dk Önbellek** | Gereksiz API çağrısı yok, ayarlanabilir TTL |
| 🌍 **Çoklu Üye** | 2–4 aile üyesi, bağımsız şehirler, bağımsız hata yönetimi |

---

## Ekran Görüntüleri

<div align="center">

| Ana Sayfa | Detay | AI Öneri | Ayarlar |
|:---------:|:-----:|:--------:|:-------:|
| Aile kartları | 5 günlük tahmin | Gemini önerisi | API & TTL |

> *Dark mode, mobil öncelikli (375px — 768px)*

</div>

---

## Teknoloji Yığını

```
Arayüz      →  Vanilla HTML5 + CSS3 + JavaScript (ES2022 Modules)
Hava Verisi →  Open-Meteo API (ücretsiz, anonim, API key gerektirmez)
Geocoding   →  Open-Meteo Geocoding API (şehir → koordinat)
AI          →  Google Gemini 3.1 Flash Lite Preview
Depolama    →  localStorage (üyeler, ayarlar, önbellek)
PWA         →  Web App Manifest + Service Worker
Font        →  Google Fonts — DM Sans + DM Mono
Build       →  Yok. Doğrudan tarayıcıda çalışır.
```

---

## Kurulum

### Ön Koşullar
- Modern bir tarayıcı (Chrome 103+, Firefox 100+, Safari 16+)
- Python 3 **veya** Node.js (lokal sunucu için)
- [Google AI Studio](https://aistudio.google.com) ücretsiz API anahtarı *(isteğe bağlı)*

### Lokal Çalıştırma

```bash
# Repoyu klonla
git clone https://github.com/Alphyn12/havapuls.git
cd havapuls

# Lokal sunucu başlat (Service Worker için HTTPS/localhost gereklidir)
python -m http.server 8080
# veya
npx serve .

# Tarayıcıda aç
open http://localhost:8080
```

### PWA İkonları

Uygulama ilk açıldığında ikonlar olmasa da çalışır. Tam PWA deneyimi için:

1. `icons/generate-icons.html` dosyasını tarayıcıda aç
2. **"Tüm İkonları İndir"** butonuna bas
3. İndirilen 6 PNG dosyasını `icons/` klasörüne kopyala

---

## Kullanım

### 1. Aile Üyesi Ekle
Header'daki **`+`** butonuna bas → isim, avatar ve şehir gir → **Kaydet**.
Şehir adı otomatik doğrulanır ve koordinata dönüştürülür.

### 2. Gemini AI Önerilerini Aktifleştir
**⚙️ Ayarlar** → *Gemini AI Anahtarı* alanına [Google AI Studio](https://aistudio.google.com/apikey)'dan aldığın ücretsiz anahtarı yapıştır → **Kaydet**.

> API anahtarı girilmezse uygulama kural tabanlı yedek sistemiyle çalışmaya devam eder.

### 3. Detay & Tahmin
Herhangi bir karta tıkla → 5 günlük tahmin, meteorolojik metrikler ve AI önerisini gör.

---

## Mimari

```
HavaPuls/
├── index.html              # Tek sayfa — 3 view + modal
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (cache-first + network-first)
│
├── styles/
│   ├── main.css            # Design tokens + tüm bileşenler
│   └── animations.css      # Hava ikonu animasyonları + view geçişleri
│
├── js/
│   ├── app.js              # State yönetimi, router, render, event handler
│   ├── api.js              # Open-Meteo API + Türkçe geocoding + önbellek
│   ├── ai.js               # Gemini AI entegrasyonu + kural tabanlı fallback
│   ├── storage.js          # localStorage CRUD + güvenli API key saklama
│   └── models.js           # Veri tipleri, WMO tablosu, kural motoru
│
└── icons/
    ├── generate-icons.html # Canvas ile PNG üretici
    └── icon-*.png          # PWA ikonları (72→512px)
```

### Veri Akışı

```
Kullanıcı → app.js (state)
               │
               ├── api.js → Open-Meteo API → localStorage cache (30dk TTL)
               │
               ├── ai.js → Gemini API → localStorage cache (1s TTL)
               │               └── (hata/yok) → RULE_ENGINE fallback
               │
               └── storage.js → localStorage (üyeler, ayarlar, geocache)
```

### API Key Güvenliği

API anahtarı hiçbir dosyaya yazılmaz. Kullanıcı tarafından ayarlar ekranından girilir, localStorage'a **XOR obfuscation + Base64** ile saklanır.

---

## Konfigürasyon

| Ayar | Varsayılan | Açıklama |
|------|-----------|----------|
| Sıcaklık Birimi | °C | °C / °F seçimi |
| Önbellek TTL | 30 dk | 10–60 dk arası ayarlanabilir |
| Gemini API Key | — | Ayarlar ekranından girilir |
| Max Üye | 4 | localStorage tabanlı sınır |

---

## Kural Tabanlı Yedek Sistem

Gemini API anahtarı yoksa veya API başarısız olursa **8 kuraldan oluşan** yerleşik motor devreye girer:

| Koşul | Öneri |
|-------|-------|
| Fırtına (kod 95/96/99) | ⛈️ Çıkma, şimşek tehlikeli |
| Sıcaklık < 0°C | 🧊 Kalın palto, eldiven, bere |
| Yağış ihtimali > %70 | ☂️ Şemsiye şart |
| Sıcaklık > 35°C | 🌡️ Bol su, öğleden kaçın |
| UV > 8 | ☀️ Güneş kremi zorunlu |
| Rüzgar > 50 km/s | 💨 Şemsiye kullanma |
| Kar (kod 71–86) | ❄️ Kaygan zemin, sağlam ayakkabı |
| 18–26°C, yağışsız | ✅ Harika bir gün! |

---

## Geliştirme Kararları

<details>
<summary><strong>Neden Vanilla JS? (Framework yok)</strong></summary>

Proje tek kullanıcılı, build tool'suz, doğrudan tarayıcıda çalışacak şekilde tasarlandı. React/Vue eklemenin getireceği karmaşıklık, bundle boyutu ve bağımlılık yönetimi bu ölçekte anlamsız.

</details>

<details>
<summary><strong>Neden Open-Meteo?</strong></summary>

Ücretsiz, anonim, API key gerektirmez. Ticari kullanım için bile dakikada 10.000 istek kotası var. WMO standart hava kodlarını destekler.

</details>

<details>
<summary><strong>Neden localStorage? (Backend yok)</strong></summary>

Uygulama tek kullanıcılı ve kişisel. Sunucu maliyeti, auth sistemi ve API geliştirme bu senaryoda overkill. localStorage yeterli, güvenli ve anında.

</details>

<details>
<summary><strong>Service Worker stratejisi</strong></summary>

- **Statik dosyalar** (CSS, JS, fontlar): Cache-First — hızlı yükleme
- **API çağrıları** (hava, geocoding): Network-First (5s timeout) — taze veri, ağ yoksa önbellekten sun

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
**Font:** [DM Sans](https://fonts.google.com/specimen/DM+Sans)

<sub>Sevgiyle yapıldı ☁️</sub>

</div>
