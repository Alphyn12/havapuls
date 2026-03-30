/**
 * @fileoverview HavaPuls — localStorage CRUD işlemleri ve veri yönetimi
 * @module storage
 */

'use strict';

import { DEFAULT_SETTINGS } from './models.js';

// ─────────────────────────────────────────────
// localStorage Anahtar Sabitleri
// ─────────────────────────────────────────────

const KEYS = {
  MEMBERS:  'havapuls_members',
  SETTINGS: 'havapuls_settings',
  API_KEY:  'havapuls_ak',
  THEME:    'havapuls_theme',
  NOTIF:    'havapuls_notif',
};

/** @param {number} lat @param {number} lon @returns {string} */
const weatherCacheKey = (lat, lon) => `havapuls_cache_${lat.toFixed(4)}_${lon.toFixed(4)}`;

/** @param {string} cityNorm @returns {string} */
const geoCacheKey = (cityNorm) => `havapuls_geocache_${cityNorm}`;

/** @param {string} hash @returns {string} */
const aiCacheKey = (hash) => `havapuls_ai_${hash}`;

// ─────────────────────────────────────────────
// Temel Okuma / Yazma Yardımcıları
// ─────────────────────────────────────────────

/**
 * localStorage'dan JSON okur. Hata olursa null döner.
 * @param {string} key
 * @returns {*|null}
 */
function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[Storage] Okuma hatası:', key, err);
    return null;
  }
}

/**
 * localStorage'a JSON yazar. Quota hatalarını yakalar.
 * @param {string} key
 * @param {*} value
 * @returns {boolean} Başarı durumu
 */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('[Storage] localStorage doldu! Eski önbellekler temizleniyor...');
      clearOldCaches();
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('[Storage] Temizleme sonrası da yazılamadı:', e);
      }
    } else {
      console.error('[Storage] Yazma hatası:', key, err);
    }
    return false;
  }
}

/**
 * Eski hava durumu önbelleklerini temizler (quota dolunca çağrılır)
 */
function clearOldCaches() {
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('havapuls_cache_') || key.startsWith('havapuls_ai_'))) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(k => localStorage.removeItem(k));
}

// ─────────────────────────────────────────────
// Aile Üyeleri
// ─────────────────────────────────────────────

/**
 * Tüm aile üyelerini getirir.
 * @returns {import('./models.js').FamilyMember[]}
 */
function getMembers() {
  return lsGet(KEYS.MEMBERS) || [];
}

/**
 * Aile üyeleri listesini kaydeder.
 * @param {import('./models.js').FamilyMember[]} members
 * @returns {boolean}
 */
function saveMembers(members) {
  return lsSet(KEYS.MEMBERS, members);
}

/**
 * Yeni aile üyesi ekler.
 * @param {Omit<import('./models.js').FamilyMember, 'id'|'order'|'createdAt'>} data
 * @returns {import('./models.js').FamilyMember} Oluşturulan üye
 */
function addMember(data) {
  const members = getMembers();
  const member = {
    id: crypto.randomUUID(),
    ...data,
    order: members.length,
    createdAt: new Date().toISOString(),
  };
  members.push(member);
  saveMembers(members);
  return member;
}

/**
 * Mevcut aile üyesini günceller.
 * @param {string} id - Üye ID'si
 * @param {Partial<import('./models.js').FamilyMember>} updates - Güncellenecek alanlar
 * @returns {import('./models.js').FamilyMember|null} Güncellenen üye veya null
 */
function updateMember(id, updates) {
  const members = getMembers();
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) return null;
  members[idx] = { ...members[idx], ...updates };
  saveMembers(members);
  return members[idx];
}

/**
 * Aile üyesini siler ve üye önbelleğini temizler.
 * @param {string} id - Silinecek üye ID'si
 * @returns {boolean}
 */
function deleteMember(id) {
  const members = getMembers();
  const filtered = members.filter(m => m.id !== id);
  if (filtered.length === members.length) return false;
  // Sıralamayı düzelt
  filtered.forEach((m, i) => { m.order = i; });
  return saveMembers(filtered);
}

// ─────────────────────────────────────────────
// Ayarlar
// ─────────────────────────────────────────────

/**
 * Uygulama ayarlarını getirir.
 * @returns {import('./models.js').Settings}
 */
function getSettings() {
  const saved = lsGet(KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(saved || {}) };
}

/**
 * Uygulama ayarlarını kaydeder.
 * @param {Partial<import('./models.js').Settings>} updates
 * @returns {boolean}
 */
function saveSettings(updates) {
  const current = getSettings();
  return lsSet(KEYS.SETTINGS, { ...current, ...updates, lastUpdate: Date.now() });
}

// ─────────────────────────────────────────────
// API Anahtarı (Güvenli Saklama)
// ─────────────────────────────────────────────

/** XOR obfuscation anahtar serisi */
const XOR_SEED = [72, 97, 118, 97, 80, 117, 108, 115, 95, 50, 48, 50, 54];

/**
 * Metni XOR ile karıştırır/çözer (simetrik).
 * @param {string} text
 * @returns {string}
 */
function xorTransform(text) {
  return text
    .split('')
    .map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ XOR_SEED[i % XOR_SEED.length]))
    .join('');
}

/**
 * Gemini API anahtarını güvenli biçimde localStorage'a kaydeder.
 * @param {string} key - Ham API anahtarı
 * @returns {boolean}
 */
function saveApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const obfuscated = btoa(xorTransform(key));
  return lsSet(KEYS.API_KEY, obfuscated);
}

/**
 * Kaydedilmiş Gemini API anahtarını döner.
 * @returns {string|null} Ham API anahtarı veya null
 */
function getApiKey() {
  const obfuscated = lsGet(KEYS.API_KEY);
  if (!obfuscated || typeof obfuscated !== 'string') return null;
  try {
    return xorTransform(atob(obfuscated));
  } catch {
    return null;
  }
}

/**
 * Kaydedilmiş API anahtarını siler.
 */
function deleteApiKey() {
  localStorage.removeItem(KEYS.API_KEY);
}

// ─────────────────────────────────────────────
// Hava Durumu Önbelleği
// ─────────────────────────────────────────────

/**
 * Şehre ait hava durumu önbelleğini getirir.
 * @param {number} lat
 * @param {number} lon
 * @returns {import('./models.js').WeatherCache|null}
 */
function getWeatherCache(lat, lon) {
  const cache = lsGet(weatherCacheKey(lat, lon));
  if (!cache) return null;
  if (Date.now() > cache.expires) {
    localStorage.removeItem(weatherCacheKey(lat, lon));
    return null;
  }
  return cache;
}

/**
 * Şehre ait hava durumu önbelleğini kaydeder.
 * @param {number} lat
 * @param {number} lon
 * @param {{ current: import('./models.js').WeatherData, forecast: import('./models.js').ForecastDay[] }} data
 * @param {number} [ttlMinutes=30]
 */
function setWeatherCache(lat, lon, data, ttlMinutes = 30) {
  const now = Date.now();
  lsSet(weatherCacheKey(lat, lon), {
    ...data,
    timestamp: now,
    expires: now + ttlMinutes * 60 * 1000,
  });
}

// ─────────────────────────────────────────────
// Geocoding Önbelleği (Sonsuz TTL — şehirler değişmez)
// ─────────────────────────────────────────────

/**
 * Normalize edilmiş şehir adının geocoding sonucunu getirir.
 * @param {string} cityNorm
 * @returns {import('./models.js').GeoResult|null}
 */
function getGeoCache(cityNorm) {
  return lsGet(geoCacheKey(cityNorm));
}

/**
 * Geocoding sonucunu localStorage'a kaydeder.
 * @param {string} cityNorm
 * @param {import('./models.js').GeoResult} result
 */
function setGeoCache(cityNorm, result) {
  lsSet(geoCacheKey(cityNorm), result);
}

// ─────────────────────────────────────────────
// AI Öneri Önbelleği
// ─────────────────────────────────────────────

/**
 * AI öneri önbelleğini getirir.
 * @param {string} hash - Önbellek anahtarı (şehir+kod+sıcaklık hash)
 * @returns {{ advice: string, timestamp: number }|null}
 */
function getAiCache(hash) {
  const cache = lsGet(aiCacheKey(hash));
  if (!cache) return null;
  // 1 saat TTL
  if (Date.now() - cache.timestamp > 60 * 60 * 1000) {
    localStorage.removeItem(aiCacheKey(hash));
    return null;
  }
  return cache;
}

/**
 * AI öneri önbelleğini kaydeder.
 * @param {string} hash
 * @param {string} advice
 */
function setAiCache(hash, advice) {
  lsSet(aiCacheKey(hash), { advice, timestamp: Date.now() });
}

/**
 * Belirli bir AI öneri önbelleğini siler (force refresh için).
 * @param {string} hash
 */
function deleteAiCache(hash) {
  localStorage.removeItem(aiCacheKey(hash));
}

// ─────────────────────────────────────────────
// Tema
// ─────────────────────────────────────────────

/**
 * Kaydedilmiş tema tercihini döner.
 * @returns {'dark'|'light'}
 */
function getTheme() {
  return lsGet(KEYS.THEME) || 'dark';
}

/**
 * Tema tercihini kaydeder.
 * @param {'dark'|'light'} theme
 */
function saveTheme(theme) {
  lsSet(KEYS.THEME, theme);
}

// ─────────────────────────────────────────────
// Bildirim Ayarları
// ─────────────────────────────────────────────

/**
 * @typedef {Object} NotificationSettings
 * @property {boolean} enabled - Bildirimler açık mı?
 * @property {boolean} morning - Sabah özeti bildirimi
 * @property {boolean} dressing - Giyinme uyarısı bildirimi
 */

/**
 * Bildirim ayarlarını döner.
 * @returns {NotificationSettings}
 */
function getNotificationSettings() {
  return lsGet(KEYS.NOTIF) || { enabled: false, morning: true, dressing: true };
}

/**
 * Bildirim ayarlarını kaydeder.
 * @param {Partial<NotificationSettings>} updates
 */
function saveNotificationSettings(updates) {
  const current = getNotificationSettings();
  lsSet(KEYS.NOTIF, { ...current, ...updates });
}

// ─────────────────────────────────────────────
// Tüm Verileri Sıfırla
// ─────────────────────────────────────────────

/**
 * Tüm HavaPuls verilerini localStorage'dan siler.
 */
function resetAllData() {
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('havapuls_')) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(k => localStorage.removeItem(k));
}

// ─────────────────────────────────────────────
// Dışa Aktarım
// ─────────────────────────────────────────────

export {
  getMembers, saveMembers, addMember, updateMember, deleteMember,
  getSettings, saveSettings,
  saveApiKey, getApiKey, deleteApiKey,
  getWeatherCache, setWeatherCache,
  getGeoCache, setGeoCache,
  getAiCache, setAiCache, deleteAiCache,
  getTheme, saveTheme,
  getNotificationSettings, saveNotificationSettings,
  resetAllData,
};
