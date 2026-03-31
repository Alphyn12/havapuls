/**
 * @fileoverview HavaPuls — Open-Meteo API entegrasyonu
 * Geocoding, anlık hava ve 5 günlük tahmin fonksiyonları.
 * @module api
 */

'use strict';

import { WMO_CODES } from './models.js';
import {
  getGeoCache, setGeoCache,
  getWeatherCache, setWeatherCache,
  getSettings,
} from './storage.js';

// ─────────────────────────────────────────────
// API Endpoint Sabitleri
// ─────────────────────────────────────────────

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL   = 'https://api.open-meteo.com/v1/forecast';
const AQI_URL       = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/** Anlık hava için istenen değişkenler */
const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'rain',
  'showers',
  'snowfall',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
  'surface_pressure',
  'visibility',
  'cloud_cover',
  'is_day',
].join(',');

/** Günlük tahmin için istenen değişkenler */
const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'uv_index_max',
  'sunrise',
  'sunset',
].join(',');

// ─────────────────────────────────────────────
// Türkçe Karakter Normalizasyonu
// ─────────────────────────────────────────────

/** Türkçe → ASCII karakter haritası */
const TR_CHAR_MAP = {
  'ı': 'i', 'İ': 'I',
  'ğ': 'g', 'Ğ': 'G',
  'ş': 's', 'Ş': 'S',
  'ç': 'c', 'Ç': 'C',
  'ö': 'o', 'Ö': 'O',
  'ü': 'u', 'Ü': 'U',
};

/**
 * Türkçe şehir adını Open-Meteo API için normalize eder.
 * Türkçe özel karakterleri ASCII eşdeğerleriyle değiştirir,
 * her kelimenin baş harfini büyük yapar.
 * @param {string} cityName - Ham şehir adı (örn: "ıstanbul", "İSTANBUL")
 * @returns {string} Normalize edilmiş ad (örn: "Istanbul")
 */
function normalizeCity(cityName) {
  if (!cityName || typeof cityName !== 'string') return '';

  // Türkçe karakterleri dönüştür
  const mapped = cityName
    .split('')
    .map(ch => TR_CHAR_MAP[ch] || ch)
    .join('');

  // Her kelimenin baş harfini büyük yap
  return mapped
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, ch => ch.toUpperCase());
}

// ─────────────────────────────────────────────
// Geocoding API
// ─────────────────────────────────────────────

/**
 * Şehir adını enlem/boylam koordinatlarına çevirir.
 * Önce localStorage önbelleğine bakar; bulamazsa API çağrısı yapar.
 * @param {string} cityName - Kullanıcının girdiği şehir adı
 * @returns {Promise<import('./models.js').GeoResult>} Koordinat sonucu
 * @throws {Error} Şehir bulunamazsa veya ağ hatası olursa
 */
async function geocodeCity(cityName) {
  const normalized = normalizeCity(cityName);
  if (!normalized) throw new Error('Geçersiz şehir adı');

  // Önbellek kontrolü
  const cached = getGeoCache(normalized);
  if (cached) return cached;

  // API çağrısı (tek sonuç)
  const params = new URLSearchParams({
    name:     normalized,
    count:    '1',
    language: 'tr',
    format:   'json',
  });

  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Geocoding API hatası: ${response.status}`);

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`"${cityName}" şehri bulunamadı. Lütfen geçerli bir şehir adı girin.`);
  }

  const result = {
    latitude:  data.results[0].latitude,
    longitude: data.results[0].longitude,
    name:      data.results[0].name,
    country:   data.results[0].country_code || '',
    admin1:    data.results[0].admin1 || '',
    admin2:    data.results[0].admin2 || '',
  };

  // Önbelleğe kaydet (sonsuz TTL)
  setGeoCache(normalized, result);
  return result;
}

/**
 * Şehir adını arar, birden fazla eşleşme olabilir. Önbellek kullanmaz.
 * Kullanıcıya seçim sunmak için kullanılır.
 * @param {string} cityName
 * @param {number} [count=5]
 * @returns {Promise<import('./models.js').GeoResult[]>}
 */
async function searchCities(cityName, count = 5) {
  const normalized = normalizeCity(cityName);
  if (!normalized) throw new Error('Geçersiz şehir adı');

  const params = new URLSearchParams({
    name:     normalized,
    count:    String(count),
    language: 'tr',
    format:   'json',
  });

  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Geocoding API hatası: ${response.status}`);

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`"${cityName}" şehri bulunamadı. Lütfen geçerli bir şehir adı girin.`);
  }

  return data.results.map(r => ({
    latitude:  r.latitude,
    longitude: r.longitude,
    name:      r.name,
    country:   r.country_code || '',
    admin1:    r.admin1 || '',
    admin2:    r.admin2 || '',
  }));
}

// ─────────────────────────────────────────────
// Hava Verisi Dönüşüm Yardımcıları
// ─────────────────────────────────────────────

/**
 * API'den gelen ham anlık hava verisini WeatherData formatına dönüştürür.
 * @param {Object} current - API'nin current nesnesi
 * @param {string} city - Şehir adı
 * @returns {import('./models.js').WeatherData}
 */
function parseCurrentWeather(current, city) {
  return {
    temperature:             current.temperature_2m,
    apparentTemperature:     current.apparent_temperature,
    humidity:                current.relative_humidity_2m,
    windSpeed:               current.wind_speed_10m,
    windDirection:           current.wind_direction_10m,
    uvIndex:                 current.uv_index,
    pressure:                current.surface_pressure,
    visibility:              current.visibility,
    cloudCover:              current.cloud_cover,
    precipitation:           current.precipitation,
    weatherCode:             current.weather_code,
    city,
    precipitationProbability: 0, // Günlük tahminle doldurulur
    isDay:                   current.is_day === 1,
    weatherDescription:      '', // Çağıran tarafından doldurulur
  };
}

/**
 * API'den gelen ham günlük tahmin verisini ForecastDay[] formatına dönüştürür.
 * @param {Object} daily - API'nin daily nesnesi
 * @returns {import('./models.js').ForecastDay[]}
 */
function parseForecast(daily) {
  return daily.time.map((date, i) => ({
    date,
    maxTemp:                  daily.temperature_2m_max[i],
    minTemp:                  daily.temperature_2m_min[i],
    weatherCode:              daily.weather_code[i],
    precipitationProbability: daily.precipitation_probability_max[i] || 0,
    maxWindSpeed:             daily.wind_speed_10m_max[i],
    uvIndexMax:               daily.uv_index_max[i],
    sunrise:                  daily.sunrise[i],
    sunset:                   daily.sunset[i],
  }));
}

// ─────────────────────────────────────────────
// Hava Durumu API
// ─────────────────────────────────────────────

/**
 * Belirli koordinatlar için anlık hava ve 5 günlük tahmin çeker.
 * @param {number} lat - Enlem
 * @param {number} lon - Boylam
 * @param {string} city - Şehir adı (gösterim için)
 * @returns {Promise<{ current: import('./models.js').WeatherData, forecast: import('./models.js').ForecastDay[] }>}
 * @throws {Error} Ağ hatası veya API hatası durumunda
 */
async function fetchWeather(lat, lon, city) {
  const params = new URLSearchParams({
    latitude:        lat,
    longitude:       lon,
    current:         CURRENT_VARS,
    daily:           DAILY_VARS,
    timezone:        'auto',
    wind_speed_unit: 'kmh',
    forecast_days:   '5',
  });

  const response = await fetch(`${WEATHER_URL}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Hava API hatası: ${response.status}`);

  const data = await response.json();
  const current  = parseCurrentWeather(data.current, city);
  const forecast = parseForecast(data.daily);

  // Bugünün yağış olasılığını anlık veriye ekle
  if (forecast.length > 0) {
    current.precipitationProbability = forecast[0].precipitationProbability;
  }

  return { current, forecast };
}

// ─────────────────────────────────────────────
// Önbellekli Hava Çekme
// ─────────────────────────────────────────────

/**
 * Aile üyesi için hava durumunu çeker.
 * Önce localStorage önbelleğini kontrol eder; TTL dolmuşsa API'den alır.
 * @param {import('./models.js').FamilyMember} member
 * @returns {Promise<{ current: import('./models.js').WeatherData, forecast: import('./models.js').ForecastDay[], fromCache: boolean }>}
 */
async function fetchWeatherWithCache(member) {
  const { latitude, longitude, city } = member;
  const settings = getSettings();

  // Önbellek kontrolü
  const cached = getWeatherCache(latitude, longitude);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Taze veri çek
  const data = await fetchWeather(latitude, longitude, city);

  // Önbelleğe kaydet
  setWeatherCache(latitude, longitude, data, settings.cacheTTL);

  return { ...data, fromCache: false };
}

// ─────────────────────────────────────────────
// Paralel Çoklu Üye Hava Verisi
// ─────────────────────────────────────────────

/**
 * @typedef {Object} MemberWeatherResult
 * @property {import('./models.js').FamilyMember} member - Aile üyesi
 * @property {import('./models.js').WeatherData|null} current - Anlık hava (null ise hata var)
 * @property {import('./models.js').ForecastDay[]|null} forecast - Tahmin (null ise hata var)
 * @property {boolean} fromCache - Önbellekten mi geldi?
 * @property {string|null} error - Hata mesajı (varsa)
 */

/**
 * Tüm aile üyelerinin hava durumunu paralel olarak çeker.
 * Bir üyenin hatası diğerlerini etkilemez.
 * @param {import('./models.js').FamilyMember[]} members
 * @returns {Promise<MemberWeatherResult[]>}
 */
async function fetchAllWeather(members) {
  const results = await Promise.allSettled(
    members.map(member => fetchWeatherWithCache(member))
  );

  return results.map((result, i) => {
    const member = members[i];
    if (result.status === 'fulfilled') {
      return {
        member,
        current:   result.value.current,
        forecast:  result.value.forecast,
        fromCache: result.value.fromCache,
        error:     null,
      };
    } else {
      console.error(`[API] ${member.name} için hava verisi alınamadı:`, result.reason);
      return {
        member,
        current:   null,
        forecast:  null,
        fromCache: false,
        error:     result.reason?.message || 'Bilinmeyen hata',
      };
    }
  });
}

// ─────────────────────────────────────────────
// Yardımcı Fonksiyonlar
// ─────────────────────────────────────────────

/**
 * WMO kodundan Türkçe hava açıklaması döner.
 * @param {number} code - WMO kodu
 * @returns {string} Türkçe açıklama
 */
function getWeatherLabel(code) {
  return WMO_CODES[code]?.label || 'Bilinmiyor';
}

/**
 * WMO kodundan hava kategorisi döner.
 * @param {number} code
 * @returns {'clear'|'cloudy'|'fog'|'rain'|'snow'|'storm'}
 */
function getWeatherCategory(code) {
  return WMO_CODES[code]?.category || 'clear';
}

/**
 * Celsius → Fahrenheit dönüşümü
 * @param {number} celsius
 * @returns {number}
 */
function toFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Sıcaklığı ayara göre formatlar
 * @param {number} celsius
 * @param {'celsius'|'fahrenheit'} unit
 * @returns {string}
 */
function formatTemp(celsius, unit = 'celsius') {
  const val = unit === 'fahrenheit' ? toFahrenheit(celsius) : Math.round(celsius);
  return `${val}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

// ─────────────────────────────────────────────
// Saatlik Tahmin (24 Saatlik Grafik için)
// ─────────────────────────────────────────────

/**
 * Belirli koordinatlar için bugünün saatlik hava verisini çeker.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ times: string[], temps: number[], precip: number[], wind: number[] }>}
 */
async function fetchHourlyTemperature(lat, lon) {
  const params = new URLSearchParams({
    latitude:      lat,
    longitude:     lon,
    hourly:        'temperature_2m,precipitation_probability,wind_speed_10m',
    timezone:      'auto',
    forecast_days: '1',
  });

  const response = await fetch(`${WEATHER_URL}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Saatlik veri API hatası: ${response.status}`);

  const data = await response.json();
  return {
    times:  data.hourly.time,
    temps:  data.hourly.temperature_2m,
    precip: data.hourly.precipitation_probability,
    wind:   data.hourly.wind_speed_10m,
  };
}

// ─────────────────────────────────────────────
// Hava Kalitesi API (AQI)
// ─────────────────────────────────────────────

/**
 * Belirli koordinatlar için Avrupa Hava Kalitesi İndeksi'ni çeker.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<number|null>} AQI değeri (0-500) veya null
 */
async function fetchAQI(lat, lon) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current:   'european_aqi',
    timezone:  'auto',
  });
  const res = await fetch(`${AQI_URL}?${params}`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Hava Kalitesi API hatası: ${res.status}`);
  const data = await res.json();
  return data.current?.european_aqi ?? null;
}

/**
 * AQI değerine göre CSS sınıf adı döner.
 * @param {number|null} aqi
 * @returns {'good'|'fair'|'moderate'|'poor'|'very-poor'|'unknown'}
 */
function getAQICategory(aqi) {
  if (aqi == null) return 'unknown';
  if (aqi <= 20)   return 'good';
  if (aqi <= 40)   return 'fair';
  if (aqi <= 60)   return 'moderate';
  if (aqi <= 80)   return 'poor';
  return 'very-poor';
}

/**
 * AQI değerine göre Türkçe etiket döner.
 * @param {number|null} aqi
 * @returns {string}
 */
function getAQILabel(aqi) {
  if (aqi == null) return '—';
  if (aqi <= 20)   return 'İyi';
  if (aqi <= 40)   return 'Makul';
  if (aqi <= 60)   return 'Orta';
  if (aqi <= 80)   return 'Kötü';
  return 'Çok Kötü';
}

export {
  normalizeCity,
  geocodeCity,
  searchCities,
  fetchWeather,
  fetchWeatherWithCache,
  fetchAllWeather,
  fetchHourlyTemperature,
  fetchAQI,
  getAQICategory,
  getAQILabel,
  getWeatherLabel,
  getWeatherCategory,
  formatTemp,
  toFahrenheit,
};
