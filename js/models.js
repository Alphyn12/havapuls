/**
 * @fileoverview HavaPuls — Veri modelleri, tip tanımları ve sabitler
 * @module models
 */

'use strict';

// ─────────────────────────────────────────────
// JSDoc Tip Tanımları
// ─────────────────────────────────────────────

/**
 * @typedef {Object} FamilyMember
 * @property {string} id - Benzersiz UUID (crypto.randomUUID())
 * @property {string} name - Üye adı (örn: "Baba")
 * @property {string} city - Orijinal şehir adı (görüntüleme için)
 * @property {string} cityNormalized - API için normalize edilmiş şehir adı
 * @property {number} latitude - Coğrafi enlem
 * @property {number} longitude - Coğrafi boylam
 * @property {string} avatar - Emoji avatar (örn: "👨")
 * @property {number} order - Sıralama indeksi
 * @property {string} createdAt - ISO 8601 oluşturma tarihi
 */

/**
 * @typedef {Object} WeatherData
 * @property {number} temperature - Anlık sıcaklık (°C)
 * @property {number} apparentTemperature - Hissedilen sıcaklık (°C)
 * @property {number} humidity - Nem oranı (%)
 * @property {number} windSpeed - Rüzgar hızı (km/h)
 * @property {number} windDirection - Rüzgar yönü (derece)
 * @property {number} uvIndex - UV indeksi
 * @property {number} pressure - Yüzey basıncı (hPa)
 * @property {number} visibility - Görünürlük (metre)
 * @property {number} cloudCover - Bulut örtüsü (%)
 * @property {number} precipitation - Yağış miktarı (mm)
 * @property {number} weatherCode - WMO hava kodu
 * @property {string} city - Şehir adı
 * @property {number} [precipitationProbability] - Yağış olasılığı (%)
 * @property {boolean} [isDay] - Gündüz mü? (true=gündüz, false=gece)
 */

/**
 * @typedef {Object} ForecastDay
 * @property {string} date - Tahmin tarihi (YYYY-MM-DD)
 * @property {number} maxTemp - Maksimum sıcaklık (°C)
 * @property {number} minTemp - Minimum sıcaklık (°C)
 * @property {number} weatherCode - WMO hava kodu
 * @property {number} precipitationProbability - Yağış olasılığı (%)
 * @property {number} maxWindSpeed - Maksimum rüzgar hızı (km/h)
 * @property {number} uvIndexMax - Maksimum UV indeksi
 * @property {string} sunrise - Gün doğumu saati
 * @property {string} sunset - Gün batımı saati
 */

/**
 * @typedef {Object} Settings
 * @property {'celsius'|'fahrenheit'} unit - Sıcaklık birimi
 * @property {'tr'|'en'} language - Arayüz dili
 * @property {number} cacheTTL - Önbellek süresi (dakika, 10-60 arası)
 * @property {number} lastUpdate - Son güncelleme zaman damgası
 */

/**
 * @typedef {Object} WeatherCache
 * @property {WeatherData} current - Anlık hava verisi
 * @property {ForecastDay[]} forecast - 5 günlük tahmin
 * @property {number} timestamp - Önbellek oluşturma zamanı
 * @property {number} expires - Önbellek son geçerlilik zamanı
 */

/**
 * @typedef {Object} GeoResult
 * @property {number} latitude - Enlem
 * @property {number} longitude - Boylam
 * @property {string} name - Şehir adı (API'den dönen)
 * @property {string} country - Ülke kodu
 * @property {string} [admin1] - İl/Bölge adı (örn: "Tekirdağ", "Van")
 * @property {string} [admin2] - İlçe adı
 */

/**
 * @typedef {Object} WMOEntry
 * @property {string} label - Türkçe açıklama
 * @property {string} icon - İkon kategorisi
 * @property {'clear'|'cloudy'|'fog'|'rain'|'snow'|'storm'} category - Hava kategorisi
 */

// ─────────────────────────────────────────────
// WMO Hava Kodu Tablosu (Tam Liste, Türkçe)
// ─────────────────────────────────────────────

/**
 * WMO (World Meteorological Organization) hava kodu → Türkçe açıklama + ikon eşleştirmesi
 * @type {Object.<number, WMOEntry>}
 */
const WMO_CODES = {
  0:  { label: 'Açık gökyüzü',         icon: 'sun',          category: 'clear'  },
  1:  { label: 'Çoğunlukla açık',       icon: 'sun-cloud',    category: 'clear'  },
  2:  { label: 'Parçalı bulutlu',        icon: 'cloud-sun',    category: 'cloudy' },
  3:  { label: 'Bulutlu',               icon: 'cloud',        category: 'cloudy' },
  45: { label: 'Sisli',                 icon: 'fog',          category: 'fog'    },
  48: { label: 'Dondurucu sis',         icon: 'fog',          category: 'fog'    },
  51: { label: 'Hafif çisinti',         icon: 'drizzle',      category: 'rain'   },
  53: { label: 'Orta çisinti',          icon: 'drizzle',      category: 'rain'   },
  55: { label: 'Yoğun çisinti',         icon: 'drizzle',      category: 'rain'   },
  61: { label: 'Hafif yağmur',          icon: 'rain',         category: 'rain'   },
  63: { label: 'Orta yağmur',           icon: 'rain',         category: 'rain'   },
  65: { label: 'Şiddetli yağmur',       icon: 'rain-heavy',   category: 'rain'   },
  71: { label: 'Hafif kar',             icon: 'snow',         category: 'snow'   },
  73: { label: 'Orta kar',              icon: 'snow',         category: 'snow'   },
  75: { label: 'Yoğun kar',             icon: 'snow-heavy',   category: 'snow'   },
  77: { label: 'Kar taneleri',          icon: 'snow',         category: 'snow'   },
  80: { label: 'Hafif sağanak',         icon: 'rain-shower',  category: 'rain'   },
  81: { label: 'Orta sağanak',          icon: 'rain-shower',  category: 'rain'   },
  82: { label: 'Şiddetli sağanak',      icon: 'rain-heavy',   category: 'rain'   },
  85: { label: 'Hafif kar sağanağı',    icon: 'snow-shower',  category: 'snow'   },
  86: { label: 'Yoğun kar sağanağı',   icon: 'snow-shower',  category: 'snow'   },
  95: { label: 'Fırtına',              icon: 'storm',        category: 'storm'  },
  96: { label: 'Hafif dolulu fırtına', icon: 'storm',        category: 'storm'  },
  99: { label: 'Şiddetli dolulu fırtına', icon: 'storm-heavy', category: 'storm' },
};

// ─────────────────────────────────────────────
// Kural Tabanlı Öneri Motoru (AI Yedek Sistemi)
// ─────────────────────────────────────────────

/**
 * @typedef {Object} RuleEntry
 * @property {function(WeatherData): boolean} condition - Koşul fonksiyonu
 * @property {string} advice - Türkçe öneri metni
 * @property {'good'|'warning'|'danger'} level - Önem seviyesi
 */

/**
 * Kural tabanlı hava durumu öneri sistemi.
 * AI API başarısız olursa bu kurallar devreye girer.
 * @type {RuleEntry[]}
 */
const RULE_ENGINE = [
  {
    condition: (w) => [95, 96, 99].includes(w.weatherCode),
    advice: '⛈️ Fırtına var! Mümkünse çıkma, şimşek tehlikeli.',
    level: 'danger',
  },
  {
    condition: (w) => w.temperature < 0,
    advice: '🧊 Dondurucu soğuk! Kalın palto, eldiven ve bere şart.',
    level: 'danger',
  },
  {
    condition: (w) => w.precipitationProbability > 70 || [61, 63, 65, 80, 81, 82].includes(w.weatherCode),
    advice: '☂️ Şemsiye veya yağmurluk şart! Islak kalma.',
    level: 'warning',
  },
  {
    condition: (w) => w.temperature > 35,
    advice: '🌡️ Çok sıcak! Bol su iç, öğle saatlerinde dışarıda az kal.',
    level: 'warning',
  },
  {
    condition: (w) => w.uvIndex > 8,
    advice: '☀️ UV çok yüksek! Güneş kremi ve güneş gözlüğü mutlaka.',
    level: 'warning',
  },
  {
    condition: (w) => w.windSpeed > 50,
    advice: '💨 Çok rüzgarlı! Şemsiye kullanma, devrilir.',
    level: 'warning',
  },
  {
    condition: (w) => [71, 73, 75, 77, 85, 86].includes(w.weatherCode),
    advice: '❄️ Kar var! Kaygan zemine dikkat, sağlam ayakkabı giy.',
    level: 'warning',
  },
  {
    condition: (w) => [45, 48].includes(w.weatherCode),
    advice: '🌫️ Sis var! Araç kullanırken dikkatli ol, görüş mesafesi düşük.',
    level: 'warning',
  },
  {
    condition: (w) => w.temperature >= 18 && w.temperature <= 26 && w.precipitationProbability < 20,
    advice: '✅ Dışarı çıkmak için harika bir gün! Keyfini çıkar.',
    level: 'good',
  },
  {
    condition: (w) => w.temperature >= 10 && w.temperature < 18,
    advice: '🧥 Serin bir hava var, hafif mont veya hırka giy.',
    level: 'good',
  },
];

// ─────────────────────────────────────────────
// Varsayılan Değerler
// ─────────────────────────────────────────────

/**
 * Varsayılan uygulama ayarları
 * @type {Settings}
 */
const DEFAULT_SETTINGS = {
  unit: 'celsius',
  language: 'tr',
  cacheTTL: 30,
  lastUpdate: 0,
};

/**
 * Seçilebilir avatar emojileri
 * @type {string[]}
 */
const AVATARS = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👶', '🧔', '👱'];

/**
 * Gün adları (kısa, Türkçe)
 * @type {string[]}
 */
const GUN_ADLARI_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/**
 * Gün adları (tam, Türkçe)
 * @type {string[]}
 */
const GUN_ADLARI_TAM = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// ─────────────────────────────────────────────
// Dışa Aktarım
// ─────────────────────────────────────────────

export {
  WMO_CODES,
  RULE_ENGINE,
  DEFAULT_SETTINGS,
  AVATARS,
  GUN_ADLARI_KISA,
  GUN_ADLARI_TAM,
};
