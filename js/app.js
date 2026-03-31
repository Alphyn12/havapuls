/**
 * @fileoverview HavaPuls — Ana Uygulama Mantığı
 * State yönetimi, view router, render fonksiyonları, event handler'lar.
 * @module app
 */

'use strict';

import {
  getMembers, saveMembers, addMember, updateMember, deleteMember,
  getSettings, saveSettings, saveApiKey, getApiKey, resetAllData,
  setGeoCache, getTheme, saveTheme, getNotificationSettings, saveNotificationSettings,
} from './storage.js';
import {
  normalizeCity, geocodeCity, searchCities,
  fetchAllWeather, fetchHourlyTemperature,
  fetchAQI, getAQICategory, getAQILabel,
  getWeatherLabel, formatTemp,
} from './api.js';
import { getAIAdvice, getClothingAdvice } from './ai.js';
import { renderTempChart, renderHourlyTable } from './history.js';
import { shareWeatherCard } from './share.js';
import {
  requestNotificationPermission, hasNotificationPermission,
  scheduleMorningNotification, cancelAllNotifications, checkDressingWarnings,
} from './notifications.js';
import { AVATARS, WMO_CODES, GUN_ADLARI_KISA } from './models.js';

// ─────────────────────────────────────────────
// Uygulama State
// ─────────────────────────────────────────────

/** @type {{ members: import('./models.js').FamilyMember[], weatherData: Object.<string, any>, currentView: string, selectedMemberId: string|null, editingMemberId: string|null, isRefreshing: boolean, lastUpdate: number, pendingCityResults: any }} */
const state = {
  members:            [],
  weatherData:        {}, // memberId → { current, forecast, error }
  currentView:        'home',
  selectedMemberId:   null,
  editingMemberId:    null,
  isRefreshing:       false,
  lastUpdate:         0,
  pendingCityResults: null, // Şehir seçimi bekleniyorken sonuçlar burada
};

// Drag-and-drop durumu
let _dragSourceId = null;

// ─────────────────────────────────────────────
// SVG Hava İkonları
// ─────────────────────────────────────────────

/**
 * WMO kategorisine göre animasyonlu SVG hava ikonu döner.
 * @param {string} category - Hava kategorisi
 * @param {number} [size=48] - İkon boyutu (px)
 * @returns {string} SVG HTML string
 */
function getWeatherSVG(category, size = 48) {
  const s = size;
  const icons = {
    clear: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="weather-icon-sun" aria-hidden="true">
      <g class="icon-sun-rays">
        <line x1="24" y1="4"  x2="24" y2="9"  stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="24" y1="39" x2="24" y2="44" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="4"  y1="24" x2="9"  y2="24" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="39" y1="24" x2="44" y2="24" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="9.37"  y1="9.37"  x2="12.9" y2="12.9"  stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="35.1"  y1="35.1"  x2="38.63" y2="38.63" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="9.37"  y1="38.63" x2="12.9"  y2="35.1"  stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="35.1"  y1="12.9"  x2="38.63" y2="9.37"  stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
      </g>
      <circle class="icon-sun-core" cx="24" cy="24" r="9" fill="#fbbf24"/>
    </svg>`,

    cloudy: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="18" cy="22" r="5" fill="#fbbf24" opacity="0.7"/>
      <ellipse class="icon-cloud-back" cx="21" cy="28" rx="9" ry="6" fill="#6b7280" opacity="0.5"/>
      <ellipse class="icon-cloud" cx="26" cy="27" rx="12" ry="7" fill="#94a3b8"/>
      <ellipse cx="20" cy="29" rx="8" ry="5" fill="#94a3b8"/>
    </svg>`,

    rain: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse class="icon-cloud" cx="24" cy="18" rx="13" ry="8" fill="#94a3b8"/>
      <ellipse cx="17" cy="20" rx="8" ry="6" fill="#94a3b8"/>
      <line class="icon-rain-drop-1" x1="16" y1="28" x2="14" y2="36" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>
      <line class="icon-rain-drop-2" x1="24" y1="28" x2="22" y2="36" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>
      <line class="icon-rain-drop-3" x1="32" y1="28" x2="30" y2="36" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    snow: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse class="icon-cloud" cx="24" cy="17" rx="13" ry="8" fill="#94a3b8"/>
      <ellipse cx="17" cy="19" rx="8" ry="6" fill="#94a3b8"/>
      <circle class="icon-snow-flake-1" cx="16" cy="32" r="2.5" fill="#bae6fd"/>
      <circle class="icon-snow-flake-2" cx="24" cy="34" r="2.5" fill="#bae6fd"/>
      <circle class="icon-snow-flake-3" cx="32" cy="32" r="2.5" fill="#bae6fd"/>
    </svg>`,

    storm: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse class="icon-cloud" cx="24" cy="15" rx="14" ry="8" fill="#6b7280"/>
      <ellipse cx="17" cy="17" rx="9" ry="6" fill="#6b7280"/>
      <polyline class="icon-lightning" points="26,22 20,32 25,32 19,42" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,

    fog: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line class="icon-fog-line-1" x1="10" y1="20" x2="38" y2="20" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>
      <line class="icon-fog-line-2" x1="14" y1="27" x2="34" y2="27" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>
      <line class="icon-fog-line-3" x1="10" y1="34" x2="38" y2="34" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    drizzle: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse class="icon-cloud" cx="24" cy="18" rx="13" ry="8" fill="#94a3b8"/>
      <ellipse cx="17" cy="20" rx="8" ry="6" fill="#94a3b8"/>
      <line class="icon-rain-drop-1" x1="16" y1="29" x2="15" y2="34" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round"/>
      <line class="icon-rain-drop-2" x1="24" y1="29" x2="23" y2="34" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round"/>
      <line class="icon-rain-drop-3" x1="32" y1="29" x2="31" y2="34" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round"/>
      <line class="icon-rain-drop-4" x1="20" y1="33" x2="19" y2="38" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    night: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path class="icon-moon" d="M32 26a12 12 0 1 1-14-14 9 9 0 0 0 14 14z" fill="#a5b4fc"/>
      <circle class="icon-star-1" cx="35" cy="11" r="1.8" fill="#e2e8f0"/>
      <circle class="icon-star-2" cx="39" cy="19" r="1.2" fill="#e2e8f0" opacity="0.7"/>
      <circle class="icon-star-3" cx="29" cy="7"  r="1.2" fill="#e2e8f0" opacity="0.8"/>
      <circle class="icon-star-4" cx="38" cy="9"  r="0.8" fill="#e2e8f0" opacity="0.5"/>
    </svg>`,
  };

  return icons[category] || icons.clear;
}

// ─────────────────────────────────────────────
// Toast Bildirimi
// ─────────────────────────────────────────────

/** @type {number|null} */
let toastTimeout = null;

/**
 * Kısa süreli bildirim mesajı gösterir.
 * @param {string} mesaj
 * @param {number} [süre=3000] - ms cinsinden gösterim süresi
 */
function showToast(mesaj, süre = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mesaj;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), süre);
}

// ─────────────────────────────────────────────
// View Router
// ─────────────────────────────────────────────

/**
 * Belirtilen view'ı gösterir, diğerlerini gizler.
 * @param {'home'|'detail'|'settings'} view
 * @param {'left'|'right'} [direction='right'] - Geçiş yönü
 */
function showView(view, direction = 'right') {
  const viewMap = {
    home:     document.getElementById('view-home'),
    detail:   document.getElementById('view-detail'),
    settings: document.getElementById('view-settings'),
  };

  Object.entries(viewMap).forEach(([key, el]) => {
    if (!el) return;
    if (key === view) {
      el.classList.add('active');
      el.classList.add(direction === 'right' ? 'view-enter-right' : 'view-enter-left');
      setTimeout(() => {
        el.classList.remove('view-enter-right', 'view-enter-left');
      }, 350);
    } else {
      el.classList.remove('active');
    }
  });

  state.currentView = view;
}

// ─────────────────────────────────────────────
// Hava İkonu Oluşturma
// ─────────────────────────────────────────────

/**
 * WMO koduna ve gündüz/gece durumuna göre uygun SVG kategorisini döner.
 * @param {number} code
 * @param {boolean} [isDay=true] - Gündüz mü?
 * @returns {string}
 */
function codeToIconCategory(code, isDay = true) {
  const entry = WMO_CODES[code];
  if (!entry) return isDay ? 'clear' : 'night';
  const icon = entry.icon;
  if (icon.includes('sun') || entry.category === 'clear') {
    return isDay ? 'clear' : 'night';
  }
  if (icon.includes('drizzle')) return 'drizzle';
  if (icon.includes('rain') || icon.includes('shower')) return 'rain';
  if (icon.includes('snow')) return 'snow';
  if (icon.includes('storm')) return 'storm';
  if (icon.includes('fog')) return 'fog';
  if (icon.includes('cloud')) return 'cloudy';
  return isDay ? 'clear' : 'night';
}

// ─────────────────────────────────────────────
// Konfor İndeksi
// ─────────────────────────────────────────────

/**
 * Sıcaklık, nem, rüzgar ve UV'den 0-100 arası konfor skoru hesaplar.
 * @param {import('./models.js').CurrentWeather} current
 * @returns {number}
 */
function calcComfortScore(current) {
  // Sıcaklık skoru (0-40): İdeal 20-22°C
  const tempDiff  = Math.abs(current.temperature - 21);
  const tempScore = Math.max(0, 40 - tempDiff * 2.5);

  // Nem skoru (0-30): İdeal %40-60
  const humDiff  = Math.abs(current.humidity - 50);
  const humScore = Math.max(0, 30 - humDiff * 0.5);

  // Rüzgar skoru (0-20): Sakin rüzgar = konforlu
  const windScore = Math.max(0, 20 - current.windSpeed * 0.4);

  // UV skoru (0-10): Düşük UV = daha rahat
  const uvScore = Math.max(0, 10 - current.uvIndex * 1.5);

  return Math.round(tempScore + humScore + windScore + uvScore);
}

/**
 * Konfor skoruna göre seviye ve CSS sınıfı döner.
 * @param {number} score
 * @returns {{ label: string, cls: string }}
 */
function getComfortLevel(score) {
  if (score >= 75) return { label: 'Mükemmel', cls: 'excellent' };
  if (score >= 50) return { label: 'İyi',      cls: 'good'      };
  if (score >= 25) return { label: 'Orta',     cls: 'moderate'  };
  return                  { label: 'Düşük',    cls: 'poor'      };
}

// ─────────────────────────────────────────────
// Ana Sayfa Render
// ─────────────────────────────────────────────

/**
 * Ana sayfayı (kart listesi) render eder.
 */
function renderHome() {
  const container = document.getElementById('members-list');
  if (!container) return;

  const settings = getSettings();

  if (state.members.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌤️</div>
        <div class="empty-state-title">Henüz kimse yok</div>
        <div class="empty-state-text">Aile üyelerini eklemek için yukarıdaki + butonuna bas.</div>
      </div>
    `;
    updateFooter();
    return;
  }

  const sortedMembers = [...state.members].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return  1;
    return a.order - b.order;
  });

  container.innerHTML = sortedMembers
    .map(member => renderMemberCard(member, settings))
    .join('');

  // Animasyonlu arka planı güncelle (ilk pinned veya ilk üyeye göre)
  const dominantMember = sortedMembers.find(m => state.weatherData[m.id]?.current);
  if (dominantMember) {
    const dwd = state.weatherData[dominantMember.id].current;
    updateWeatherBackground(codeToIconCategory(dwd.weatherCode, dwd.isDay !== false));
  }

  // "Aile üyesi ekle" butonu — max 4 üye
  if (state.members.length < 4) {
    container.innerHTML += `
      <button class="card-add" id="card-add-btn" aria-label="Yeni aile üyesi ekle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Aile Üyesi Ekle
      </button>
    `;
  }

  updateFooter();
}

/**
 * Tek bir aile üyesi kartı HTML'i üretir.
 * @param {import('./models.js').FamilyMember} member
 * @param {import('./models.js').Settings} settings
 * @returns {string} HTML string
 */
function renderMemberCard(member, settings) {
  const wd = state.weatherData[member.id];

  const headerActionsBtns = `
    <div class="card-header-actions">
      <button class="card-pin-btn${member.pinned ? ' pinned' : ''}"
              data-pin-id="${member.id}"
              aria-label="${member.pinned ? 'Sabitlemeyi kaldır' : 'Kartı sabitle'}"
              title="${member.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}"
              tabindex="0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${member.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
      <button class="card-edit-btn" data-edit-id="${member.id}" aria-label="${member.name} düzenle" tabindex="0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
    </div>`;

  if (!wd) {
    // Yükleniyor durumu
    return `
      <div class="family-card" data-member-id="${member.id}" tabindex="0" role="button" aria-label="${member.name}, ${member.city} için hava durumu yükleniyor">
        <div class="card-header">
          <div class="card-identity">
            <div class="card-avatar" aria-hidden="true">${member.avatar}</div>
            <div>
              <div class="card-name">${escHtml(member.name)}</div>
              <div class="card-city">${escHtml(member.city)}</div>
            </div>
          </div>
          ${headerActionsBtns}
        </div>
        <div class="card-loading">
          <div class="loading-dots" aria-label="Yükleniyor"><span></span><span></span><span></span></div>
          Hava verisi alınıyor...
        </div>
      </div>
    `;
  }

  if (wd.error) {
    // Hata durumu
    return `
      <div class="family-card" data-member-id="${member.id}" tabindex="0" role="button" aria-label="${member.name}, ${member.city} — hata">
        <div class="card-header">
          <div class="card-identity">
            <div class="card-avatar" aria-hidden="true">${member.avatar}</div>
            <div>
              <div class="card-name">${escHtml(member.name)}</div>
              <div class="card-city">${escHtml(member.city)}</div>
            </div>
          </div>
          ${headerActionsBtns}
        </div>
        <div class="card-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Veri alınamadı — ${escHtml(wd.error)}
        </div>
      </div>
    `;
  }

  const { current } = wd;
  const temp    = formatTemp(current.temperature, settings.unit);
  const desc    = getWeatherLabel(current.weatherCode);
  const isDay   = current.isDay !== false;
  const iconCat = codeToIconCategory(current.weatherCode, isDay);
  const aiTip   = wd.aiAdvice;

  // Konfor İndeksi
  const forecast = wd.forecast || [];
  const comfortScore = calcComfortScore(current);
  const comfortLevel = getComfortLevel(comfortScore);

  return `
    <div class="family-card weather-bg-${iconCat}"
         data-member-id="${member.id}"
         draggable="false"
         tabindex="0" role="button"
         aria-label="${member.name}, ${member.city}: ${temp}, ${desc}">

      <!-- Sürükle tutacağı -->
      <div class="card-drag-handle" data-drag-id="${member.id}" draggable="true" aria-label="Sürükleyerek sırala" title="Sürükleyerek sırala">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
          <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
        </svg>
      </div>

      <!-- Üst: kimlik + düzenle -->
      <div class="card-header">
        <div class="card-identity">
          <div class="card-avatar" aria-hidden="true">${member.avatar}</div>
          <div>
            <div class="card-name">${escHtml(member.name)}</div>
            <div class="card-city">${escHtml(member.city)}</div>
          </div>
        </div>
        ${headerActionsBtns}
      </div>

      <!-- Orta: hava -->
      <div class="card-weather">
        <div class="card-weather-icon">
          ${getWeatherSVG(iconCat, 52)}
        </div>
        <div>
          <div class="card-temp">${temp}</div>
          <div class="card-desc">${desc}</div>
        </div>
      </div>

      <!-- Alt: metrikler -->
      <div class="card-metrics">
        <span class="metric-chip" title="Nem">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          %${current.humidity}
        </span>
        <span class="metric-chip" title="Rüzgar hızı">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
          </svg>
          ${Math.round(current.windSpeed)} km/h
        </span>
        <span class="metric-chip" title="UV İndeksi">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          UV ${current.uvIndex}
        </span>
        <span class="metric-chip comfort-chip comfort-${comfortLevel.cls}" title="Konfor İndeksi: ${comfortLevel.label}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
          </svg>
          ${comfortScore}
        </span>
        ${current.precipitationProbability > 0 ? `
        <span class="metric-chip" title="Yağış ihtimali">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/>
            <line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/>
            <line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
          </svg>
          %${current.precipitationProbability}
        </span>` : ''}
        ${wd.aqi != null ? `
        <span class="metric-chip aqi-badge aqi-${getAQICategory(wd.aqi)}" title="Hava Kalitesi: ${getAQILabel(wd.aqi)}">
          AQI ${wd.aqi} · ${getAQILabel(wd.aqi)}
        </span>` : ''}
      </div>

      <!-- AI öneri chip -->
      ${aiTip ? `
        <div class="ai-chip ${aiTip.level || ''}" role="note" aria-label="AI önerisi">
          💡 ${escHtml(aiTip.advice.split('\n')[0].slice(0, 60))}
        </div>
      ` : ''}

      <!-- Detay linki -->
      <div class="card-detail-link" aria-hidden="true">
        Detay
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Ana sayfa footer'ını günceller (son güncelleme zamanı).
 */
function updateFooter() {
  const footer = document.getElementById('home-footer');
  if (!footer) return;

  if (state.lastUpdate === 0) {
    footer.textContent = 'Son güncelleme: —';
    return;
  }

  const d = new Date(state.lastUpdate);
  const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  footer.textContent = `Son güncelleme: ${saat}`;
}

// ─────────────────────────────────────────────
// Detay Sayfası Render
// ─────────────────────────────────────────────

/**
 * Detay sayfasını render eder.
 * @param {string} memberId
 */
async function renderDetail(memberId) {
  const member = state.members.find(m => m.id === memberId);
  if (!member) { showView('home', 'left'); return; }

  state.selectedMemberId = memberId;
  showView('detail', 'right');

  const settings = getSettings();
  const wd       = state.weatherData[memberId];

  // Kimlik bilgisi
  document.getElementById('detail-avatar').textContent = member.avatar;
  document.getElementById('detail-name').textContent   = member.name;
  document.getElementById('detail-city').textContent   = member.city;

  if (!wd || wd.error || !wd.current) {
    document.getElementById('detail-temp').textContent   = '—';
    document.getElementById('detail-feels').textContent  = (wd && wd.error) ? wd.error : 'Veri yüklenemedi';
    document.getElementById('detail-desc').textContent   = '';
    document.getElementById('detail-icon').innerHTML     = '';
    document.getElementById('detail-metrics').innerHTML  = '';
    document.getElementById('forecast-scroll').innerHTML = '';
    const aiText = document.getElementById('ai-text');
    if (aiText) aiText.textContent = 'Hava verisi olmadan öneri üretilemiyor.';
    return;
  }

  const { current, forecast } = wd;
  const temp     = formatTemp(current.temperature, settings.unit);
  const tempAppr = formatTemp(current.apparentTemperature, settings.unit);
  const desc     = getWeatherLabel(current.weatherCode);
  const isDay    = current.isDay !== false;
  const iconCat  = codeToIconCategory(current.weatherCode, isDay);

  // Hissedilen karşılaştırması
  const feelsDiff  = current.apparentTemperature - current.temperature;
  const feelsArrow = feelsDiff > 1 ? '↑' : feelsDiff < -1 ? '↓' : '→';
  const feelsCls   = feelsDiff > 1 ? 'feels-warmer' : feelsDiff < -1 ? 'feels-colder' : 'feels-same';
  const feelsLabel = feelsDiff > 1 ? 'Daha sıcak hissettiriyor' : feelsDiff < -1 ? 'Daha soğuk hissettiriyor' : 'Gerçek ile aynı';

  // Büyük hava
  document.getElementById('detail-icon').innerHTML   = getWeatherSVG(iconCat, 80);
  document.getElementById('detail-temp').textContent = temp;
  document.getElementById('detail-feels').innerHTML  = `
    <div class="feels-comparison">
      <span class="feels-real">${temp}</span>
      <span class="feels-arrow ${feelsCls}" aria-hidden="true">${feelsArrow}</span>
      <span class="feels-apparent">${tempAppr}</span>
    </div>
    <div class="feels-label ${feelsCls}">${feelsLabel}</div>
  `;
  document.getElementById('detail-desc').textContent = desc;

  // Konfor İndeksi — detay sayfası için hesapla
  const detailComfortScore = calcComfortScore(current);
  const detailComfortLevel = getComfortLevel(detailComfortScore);

  // Metrik grid
  document.getElementById('detail-metrics').innerHTML = `
    <div class="detail-metric-card">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
        Nem
      </div>
      <div class="detail-metric-value">%${current.humidity}</div>
    </div>
    <div class="detail-metric-card comfort-card comfort-${detailComfortLevel.cls}">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
        </svg>
        Konfor
      </div>
      <div class="detail-metric-value">${detailComfortScore}</div>
      <div class="comfort-level-label">${detailComfortLevel.label}</div>
    </div>
    <div class="detail-metric-card detail-metric-wind" style="grid-column:span 2;">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
        </svg>
        Rüzgar
      </div>
      <div class="wind-metric-layout">
        ${renderWindCompass(current.windDirection)}
        <div>
          <div class="detail-metric-value">${Math.round(current.windSpeed)} km/h</div>
          <div class="wind-direction-label">${getWindDirectionLabel(current.windDirection)} · ${Math.round(current.windDirection)}°</div>
        </div>
      </div>
    </div>
    <div class="detail-metric-card">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        </svg>
        UV İndeksi
      </div>
      <div class="detail-metric-value">${current.uvIndex}</div>
    </div>
    <div class="detail-metric-card">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
          <line x1="8" y1="19" x2="8" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/>
        </svg>
        Yağış İhtimali
      </div>
      <div class="detail-metric-value">%${current.precipitationProbability || 0}</div>
    </div>
    <div class="detail-metric-card">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Basınç
      </div>
      <div class="detail-metric-value">${Math.round(current.pressure)} hPa</div>
    </div>
    <div class="detail-metric-card">
      <div class="detail-metric-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Görünürlük
      </div>
      <div class="detail-metric-value">${(current.visibility / 1000).toFixed(1)} km</div>
    </div>
    ${forecast[0]?.sunrise ? `
    <div class="detail-metric-card">
      <div class="detail-metric-label">🌅 Gün Doğumu</div>
      <div class="detail-metric-value">
        ${new Date(forecast[0].sunrise).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
    <div class="detail-metric-card">
      <div class="detail-metric-label">🌇 Gün Batımı</div>
      <div class="detail-metric-value">
        ${new Date(forecast[0].sunset).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
    <div class="detail-metric-card" style="grid-column:span 2;">
      <div class="detail-metric-label">⏱️ Gün Uzunluğu</div>
      <div class="detail-metric-value" style="font-size:1rem;">
        ${(() => {
          const rise = new Date(forecast[0].sunrise);
          const set  = new Date(forecast[0].sunset);
          const diff = Math.round((set - rise) / 60000);
          return `${Math.floor(diff / 60)}s ${diff % 60}dk`;
        })()}
      </div>
    </div>` : ''}
  `;

  // 5 Günlük Tahmin
  const bugun = new Date().toISOString().slice(0, 10);
  document.getElementById('forecast-scroll').innerHTML = forecast.map(day => {
    const tarih    = new Date(day.date + 'T12:00:00');
    const gunAdi   = GUN_ADLARI_KISA[tarih.getDay()];
    const maxTemp  = formatTemp(day.maxTemp, settings.unit);
    const minTemp  = formatTemp(day.minTemp, settings.unit);
    const isToday  = day.date === bugun;
    const cat      = codeToIconCategory(day.weatherCode, true); // Tahmin ikonları gündüz olarak göster

    return `
      <div class="forecast-day ${isToday ? 'today' : ''}" role="listitem" aria-label="${gunAdi}: ${maxTemp} / ${minTemp}">
        <div class="forecast-day-name">${isToday ? 'Bugün' : gunAdi}</div>
        <div class="forecast-day-icon">${getWeatherSVG(cat, 32)}</div>
        <div class="forecast-day-max">${maxTemp}</div>
        <div class="forecast-day-min">${minTemp}</div>
        <div class="forecast-precip-bar-wrap" title="Yağış: %${day.precipitationProbability}">
          <div class="forecast-precip-bar">
            <div class="forecast-precip-fill" style="height:${day.precipitationProbability}%;background:${
              day.precipitationProbability > 60 ? 'var(--clr-accent)' :
              day.precipitationProbability > 30 ? '#60a5fa' : 'var(--clr-border-2)'
            };"></div>
          </div>
          ${day.precipitationProbability > 0
            ? `<span class="forecast-precip-pct">%${day.precipitationProbability}</span>`
            : ''}
        </div>
      </div>
    `;
  }).join('');

  // Güneş Takvimi
  const sunSection = document.getElementById('detail-sun-section');
  const sunTimeline = document.getElementById('detail-sun-timeline');
  if (forecast[0]?.sunrise && sunSection && sunTimeline) {
    sunTimeline.innerHTML = renderSunTimeline(forecast[0].sunrise, forecast[0].sunset);
    sunSection.style.display = '';
  } else if (sunSection) {
    sunSection.style.display = 'none';
  }

  // Animasyonlu arka planı detay sayfasında da güncelle
  updateWeatherBackground(iconCat);

  // AI Öneri Yükle
  await loadAIAdvice(memberId, current);

  // 24 Saatlik Grafik + Saatlik Tablo Yükle (arka planda)
  loadTempHistory(memberId, member.latitude, member.longitude, settings.unit);

  // Kıyafet Önerisi Yükle
  loadClothingAdvice(memberId, current);
}

/**
 * 24 saatlik sıcaklık grafiği + saatlik detay tablosunu yükler.
 * @param {string} memberId
 * @param {number} lat
 * @param {number} lon
 * @param {'celsius'|'fahrenheit'} unit
 */
async function loadTempHistory(memberId, lat, lon, unit) {
  const chartContainer  = document.getElementById('detail-history-chart');
  const tableContainer  = document.getElementById('detail-hourly-table');
  if (!chartContainer) return;

  const loadingHtml = `
    <div class="card-loading">
      <div class="loading-dots" aria-label="Yükleniyor"><span></span><span></span><span></span></div>
      Yükleniyor...
    </div>`;
  chartContainer.innerHTML = loadingHtml;
  if (tableContainer) tableContainer.innerHTML = loadingHtml;

  try {
    const { times, temps, precip, wind } = await fetchHourlyTemperature(lat, lon);
    if (state.selectedMemberId !== memberId) return;
    chartContainer.innerHTML = renderTempChart(times, temps, unit);
    if (tableContainer) tableContainer.innerHTML = renderHourlyTable(times, temps, precip, wind, unit);
  } catch (err) {
    if (state.selectedMemberId !== memberId) return;
    chartContainer.innerHTML = `<div class="chart-empty">Grafik yüklenemedi.</div>`;
    if (tableContainer) tableContainer.innerHTML = `<div class="chart-empty">Saatlik veri yüklenemedi.</div>`;
    console.error('[History] Grafik/tablo yüklenemedi:', err);
  }
}

/**
 * Kıyafet önerisini yükler.
 * @param {string} memberId
 * @param {import('./models.js').WeatherData} current
 */
async function loadClothingAdvice(memberId, current) {
  const container = document.getElementById('clothing-text');
  const badge     = document.getElementById('clothing-badge');
  if (!container) return;

  const member = state.members.find(m => m.id === memberId);
  if (!member) return;

  container.innerHTML = `
    <div class="card-loading">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      Kıyafet önerisi hazırlanıyor...
    </div>`;

  try {
    const enriched = { ...current, weatherDescription: getWeatherLabel(current.weatherCode) };
    const result   = await getClothingAdvice(enriched, member.name);
    if (state.selectedMemberId !== memberId) return;

    container.textContent = result.outfit;
    if (badge) {
      badge.textContent = result.isAI ? 'Gemini AI' : 'Kural Motoru';
      badge.className   = `detail-ai-badge${result.isAI ? '' : ' rule'}`;
    }
  } catch (err) {
    if (container) container.textContent = '⚠️ Kıyafet önerisi alınamadı.';
    console.error('[Clothing] Öneri yüklenemedi:', err);
  }
}

// ─────────────────────────────────────────────
// Rüzgar Yön Kadranı
// ─────────────────────────────────────────────

/**
 * Derece değerinden kısa Türkçe yön etiketi döner.
 * @param {number} degrees - Rüzgar yönü (0-360)
 * @returns {string}
 */
function getWindDirectionLabel(degrees) {
  const dirs = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'KBG', 'KB', 'KKB'];
  return dirs[Math.round((degrees ?? 0) / 22.5) % 16];
}

/**
 * Rüzgar yönü için SVG kadranı üretir.
 * @param {number} degrees
 * @returns {string} HTML string
 */
function renderWindCompass(degrees) {
  const deg   = degrees ?? 0;
  const label = getWindDirectionLabel(deg);
  return `
    <div class="wind-compass" aria-label="Rüzgar yönü: ${label} (${Math.round(deg)}°)">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--clr-border-2)" stroke-width="1.5"/>
        <text x="26" y="9"  text-anchor="middle" font-size="8" fill="var(--clr-text-3)" font-family="DM Sans,sans-serif" font-weight="600">K</text>
        <text x="26" y="48" text-anchor="middle" font-size="8" fill="var(--clr-text-3)" font-family="DM Sans,sans-serif" font-weight="600">G</text>
        <text x="7"  y="29" text-anchor="middle" font-size="8" fill="var(--clr-text-3)" font-family="DM Sans,sans-serif" font-weight="600">B</text>
        <text x="46" y="29" text-anchor="middle" font-size="8" fill="var(--clr-text-3)" font-family="DM Sans,sans-serif" font-weight="600">D</text>
        <g transform="rotate(${deg}, 26, 26)">
          <polygon points="26,8 23,28 26,25 29,28" fill="var(--clr-accent)" opacity="0.95"/>
          <polygon points="26,44 23,24 26,27 29,24" fill="var(--clr-border-2)" opacity="0.7"/>
        </g>
        <circle cx="26" cy="26" r="3.5" fill="var(--clr-accent)"/>
      </svg>
      <span class="wind-compass-label">${label}</span>
    </div>
  `;
}

// ─────────────────────────────────────────────
// Gün Doğumu / Batımı Takvimi
// ─────────────────────────────────────────────

/**
 * Gün doğumu ve batımı için animasyonlu timeline üretir.
 * @param {string} sunriseISO
 * @param {string} sunsetISO
 * @returns {string} HTML string
 */
function renderSunTimeline(sunriseISO, sunsetISO) {
  const rise    = new Date(sunriseISO);
  const set     = new Date(sunsetISO);
  const now     = new Date();

  const riseMin = rise.getHours() * 60 + rise.getMinutes();
  const setMin  = set.getHours()  * 60 + set.getMinutes();
  const nowMin  = now.getHours()  * 60 + now.getMinutes();

  // Referans aralık: sabah 03:00 → gece 23:00 (20 saat = 1200 dakika)
  const REF_START = 3  * 60;
  const REF_END   = 23 * 60;
  const REF_SPAN  = REF_END - REF_START;

  const toPercent = (min) => Math.min(100, Math.max(0, ((min - REF_START) / REF_SPAN) * 100));

  const risePct = toPercent(riseMin).toFixed(1);
  const setPct  = toPercent(setMin).toFixed(1);
  const nowPct  = toPercent(nowMin).toFixed(1);
  const lightW  = (parseFloat(setPct) - parseFloat(risePct)).toFixed(1);

  const riseStr = rise.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const setStr  = set.toLocaleTimeString('tr-TR',  { hour: '2-digit', minute: '2-digit' });

  // Gün uzunluğu
  const dayMin  = setMin - riseMin;
  const dayH    = Math.floor(dayMin / 60);
  const dayM    = dayMin % 60;

  const isLight = nowMin >= riseMin && nowMin <= setMin;

  return `
    <div class="sun-timeline" aria-label="Gün doğumu ${riseStr}, gün batımı ${setStr}">
      <div class="sun-track">
        <div class="sun-light-zone" style="left:${risePct}%;width:${lightW}%">
          ${isLight ? '<div class="sun-orb"></div>' : ''}
        </div>
        <div class="sun-now-marker" style="left:${nowPct}%" title="Şu an"></div>
      </div>
      <div class="sun-labels">
        <span>🌅 ${riseStr}</span>
        <span class="sun-daylength">☀️ ${dayH}s ${dayM}dk</span>
        <span>🌇 ${setStr}</span>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// Animasyonlu Arka Plan
// ─────────────────────────────────────────────

/**
 * Hava kategorisine göre body arka plan katmanını günceller.
 * @param {string} category - Hava kategorisi (clear, rain, snow, storm, fog, night, cloudy)
 */
function updateWeatherBackground(category) {
  const layer = document.getElementById('weather-bg-layer');
  if (!layer) return;
  layer.dataset.weather = category || 'clear';
}

/**
 * Detay sayfasında AI önerisini yükler ve gösterir.
 * @param {string} memberId
 * @param {import('./models.js').WeatherData} current
 * @param {boolean} [forceRefresh=false]
 */
async function loadAIAdvice(memberId, current, forceRefresh = false) {
  const member   = state.members.find(m => m.id === memberId);
  if (!member || !current) return;

  const aiText  = document.getElementById('ai-text');
  const aiBadge = document.getElementById('ai-badge');
  if (!aiText || !aiBadge) return;

  aiText.innerHTML = `
    <div class="card-loading">
      <div class="loading-dots" aria-label="Yükleniyor"><span></span><span></span><span></span></div>
      AI öneri hazırlanıyor...
    </div>
  `;

  // weatherDescription ekle (API yoktu)
  const enriched = {
    ...current,
    weatherDescription: getWeatherLabel(current.weatherCode),
  };

  try {
    const result = await getAIAdvice(enriched, member.name, forceRefresh);

    // State'e kaydet
    if (state.weatherData[memberId]) {
      state.weatherData[memberId].aiAdvice = result;
    }

    aiText.textContent = result.advice;

    aiBadge.textContent = result.isAI ? 'Gemini AI' : 'Kural Motoru';
    aiBadge.className   = `detail-ai-badge${result.isAI ? '' : ' rule'}`;

  } catch (err) {
    console.error('[AI] Öneri yüklenemedi:', err);
    aiText.textContent  = '⚠️ Öneri alınamadı. Lütfen tekrar deneyin.';
    aiBadge.textContent = 'Hata';
  }
}

// ─────────────────────────────────────────────
// Ayarlar Render
// ─────────────────────────────────────────────

/**
 * Ayarlar ekranını mevcut değerlerle doldurur.
 */
function renderSettings() {
  const settings = getSettings();

  // Sıcaklık birimi
  document.getElementById('unit-celsius').classList.toggle('active', settings.unit === 'celsius');
  document.getElementById('unit-celsius').setAttribute('aria-pressed', String(settings.unit === 'celsius'));
  document.getElementById('unit-fahrenheit').classList.toggle('active', settings.unit === 'fahrenheit');
  document.getElementById('unit-fahrenheit').setAttribute('aria-pressed', String(settings.unit === 'fahrenheit'));

  // Önbellek TTL
  const ttlInput = document.getElementById('cache-ttl');
  const ttlValue = document.getElementById('cache-ttl-value');
  if (ttlInput && ttlValue) {
    ttlInput.value       = settings.cacheTTL;
    ttlValue.textContent = `${settings.cacheTTL} dk`;
  }

  // API anahtarı durumu
  updateApiKeyStatus();

  // Bildirim durumu
  const notifSettings = getNotificationSettings();
  const notifToggleBtn  = document.getElementById('btn-notif-toggle');
  const notifMorningBtn = document.getElementById('toggle-notif-morning');
  const notifDressBtn   = document.getElementById('toggle-notif-dressing');

  if (notifToggleBtn) {
    notifToggleBtn.textContent     = notifSettings.enabled ? 'Kapat' : 'Aç';
    notifToggleBtn.className       = notifSettings.enabled ? 'btn btn-ghost notif-active' : 'btn btn-ghost';
  }
  if (notifMorningBtn) {
    notifMorningBtn.classList.toggle('active', notifSettings.morning);
    notifMorningBtn.setAttribute('aria-pressed', String(notifSettings.morning));
    notifMorningBtn.textContent = notifSettings.morning ? 'Açık' : 'Kapalı';
  }
  if (notifDressBtn) {
    notifDressBtn.classList.toggle('active', notifSettings.dressing);
    notifDressBtn.setAttribute('aria-pressed', String(notifSettings.dressing));
    notifDressBtn.textContent = notifSettings.dressing ? 'Açık' : 'Kapalı';
  }

  // Bildirim desteği kontrolü
  const notifSection = document.getElementById('notif-section');
  if (notifSection && !('Notification' in window)) {
    notifSection.style.display = 'none';
  }
}

/**
 * API anahtarı durum göstergesini günceller.
 */
function updateApiKeyStatus() {
  const hasKey     = Boolean(getApiKey());
  const statusEl   = document.getElementById('api-key-status');
  const statusText = document.getElementById('api-key-status-text');

  if (statusEl && statusText) {
    statusEl.className  = `api-key-status ${hasKey ? 'set' : 'unset'}`;
    statusText.textContent = hasKey
      ? 'API anahtarı kayıtlı — Gemini AI aktif ✓'
      : 'API anahtarı girilmemiş — kural tabanlı öneriler kullanılıyor';
  }
}

// ─────────────────────────────────────────────
// Modal Yönetimi
// ─────────────────────────────────────────────

/**
 * Üye ekleme/düzenleme modalını açar.
 * @param {string|null} [editId=null] - Düzenlenecek üye ID'si (null = yeni)
 */
function openModal(editId = null) {
  state.editingMemberId = editId;
  const modal    = document.getElementById('modal-member');
  const title    = document.getElementById('modal-title');
  const nameInp  = document.getElementById('input-name');
  const cityInp  = document.getElementById('input-city');
  const cityHint = document.getElementById('city-hint');
  const delSec   = document.getElementById('modal-delete-section');

  if (!modal) return;

  // Avatar grid'i doldur
  renderAvatarGrid();

  if (editId) {
    const member = state.members.find(m => m.id === editId);
    if (!member) return;
    title.textContent    = `${member.name} Düzenle`;
    nameInp.value        = member.name;
    cityInp.value        = member.city;
    delSec.style.display = 'block';
    // Seçili avatarı işaretle
    setSelectedAvatar(member.avatar);
  } else {
    title.textContent    = 'Aile Üyesi Ekle';
    nameInp.value        = '';
    cityInp.value        = '';
    delSec.style.display = 'none';
    setSelectedAvatar(AVATARS[0]);
  }

  cityHint.className   = 'form-hint';
  cityHint.innerHTML   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    Şehri yazıp kaydet'e bas — otomatik doğrulanacak`;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  // Erişilebilirlik: focus'u input'a taşı
  setTimeout(() => nameInp.focus(), 100);
}

/**
 * Modalı kapatır.
 */
function closeModal() {
  const modal = document.getElementById('modal-member');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  state.editingMemberId = null;
}

/**
 * Avatar seçim grid'ini render eder.
 */
function renderAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;

  grid.innerHTML = AVATARS.map(emoji => `
    <button
      class="avatar-option"
      data-avatar="${emoji}"
      aria-label="${emoji} avatarı seç"
      type="button"
    >${emoji}</button>
  `).join('');
}

/**
 * Belirtilen avatarı seçili olarak işaretler.
 * @param {string} avatar
 */
function setSelectedAvatar(avatar) {
  const grid = document.getElementById('avatar-grid');
  if (!grid) return;
  grid.querySelectorAll('.avatar-option').forEach(btn => {
    const isSelected = btn.dataset.avatar === avatar;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-pressed', String(isSelected));
  });
}

/**
 * Seçili avatar emoji'yi döner.
 * @returns {string}
 */
function getSelectedAvatar() {
  const selected = document.querySelector('.avatar-option.selected');
  return selected?.dataset.avatar || AVATARS[0];
}

// ─────────────────────────────────────────────
// Modal Kaydet
// ─────────────────────────────────────────────

/**
 * Modal form'unu doğrular ve üyeyi kaydeder.
 */
async function handleModalSave() {
  const nameInp  = document.getElementById('input-name');
  const cityInp  = document.getElementById('input-city');
  const cityHint = document.getElementById('city-hint');
  const saveBtn  = document.getElementById('btn-modal-save');

  const name = nameInp.value.trim();
  const city = cityInp.value.trim();

  if (!name) {
    nameInp.classList.add('error');
    nameInp.focus();
    showToast('❗ İsim boş bırakılamaz');
    return;
  }

  if (!city) {
    cityInp.classList.add('error');
    cityHint.className   = 'form-hint error';
    cityHint.textContent = 'Şehir adı boş bırakılamaz';
    cityInp.focus();
    return;
  }

  // Butonu devre dışı bırak
  saveBtn.disabled    = true;
  saveBtn.textContent = 'Aranıyor...';
  cityHint.className  = 'form-hint';
  cityHint.innerHTML  = `<div class="loading-dots"><span></span><span></span><span></span></div> Şehir aranıyor...`;
  nameInp.classList.remove('error');
  cityInp.classList.remove('error');

  // Önceki şehir seçim listesini gizle
  const cityResultsList = document.getElementById('city-results-list');
  if (cityResultsList) cityResultsList.hidden = true;

  try {
    const results = await searchCities(city, 5);

    // Tekil sonuç → direkt ilerle
    if (results.length === 1) {
      await proceedWithCityResult(name, city, results[0]);
      return;
    }

    // Birden fazla sonuç → seçim listesi göster
    saveBtn.disabled   = false;
    saveBtn.innerHTML  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Kaydet`;
    cityHint.className = 'form-hint';
    cityHint.innerHTML = `📍 "<strong>${escHtml(city)}</strong>" için birden fazla sonuç bulundu. Hangisi?`;

    state.pendingCityResults = { name, city, results };

    if (cityResultsList) {
      cityResultsList.hidden   = false;
      cityResultsList.innerHTML = results.map((r, idx) => `
        <div class="city-result-item" role="option" tabindex="0" data-result-idx="${idx}">
          <span class="city-result-pin" aria-hidden="true">📍</span>
          <div>
            <div class="city-result-name">${escHtml(r.name)}</div>
            <div class="city-result-region">
              ${r.admin1 ? escHtml(r.admin1) + ', ' : ''}${r.admin2 ? escHtml(r.admin2) + ' · ' : ''}${escHtml(r.country)}
            </div>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error('[Modal] Şehir arama hatası:', err);
    cityInp.classList.add('error');
    cityHint.className   = 'form-hint error';
    cityHint.textContent = err.message || 'Şehir bulunamadı';
    showToast('❗ ' + (err.message || 'Şehir bulunamadı'));
    saveBtn.disabled   = false;
    saveBtn.innerHTML  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Kaydet`;
  }
}

/**
 * Seçilen şehir sonucuyla üyeyi kaydeder.
 * @param {string} name
 * @param {string} city - Kullanıcının yazdığı şehir
 * @param {import('./models.js').GeoResult} geo
 */
async function proceedWithCityResult(name, city, geo) {
  const cityHint        = document.getElementById('city-hint');
  const cityResultsList = document.getElementById('city-results-list');
  const saveBtn         = document.getElementById('btn-modal-save');

  // Seçilen sonucu önbelleğe al
  setGeoCache(normalizeCity(city), geo);

  const avatar = getSelectedAvatar();

  if (state.editingMemberId) {
    updateMember(state.editingMemberId, {
      name, city,
      cityNormalized: geo.name,
      latitude:       geo.latitude,
      longitude:      geo.longitude,
      avatar,
    });
    delete state.weatherData[state.editingMemberId];
  } else {
    addMember({
      name, city,
      cityNormalized: geo.name,
      latitude:       geo.latitude,
      longitude:      geo.longitude,
      avatar,
    });
  }

  if (cityHint) {
    cityHint.className = 'form-hint success';
    cityHint.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ${escHtml(geo.name)}${geo.admin1 ? ', ' + escHtml(geo.admin1) : ''}, ${escHtml(geo.country)} ✓
    `;
  }
  if (cityResultsList) cityResultsList.hidden = true;
  if (saveBtn) {
    saveBtn.disabled  = false;
    saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Kaydet`;
  }
  state.pendingCityResults = null;

  setTimeout(async () => {
    closeModal();
    await loadAllData();
  }, 600);
}

// ─────────────────────────────────────────────
// Tema Yönetimi
// ─────────────────────────────────────────────

/**
 * Kaydedilmiş temayı uygular.
 */
function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggle(theme);
}

/**
 * Tema toggle butonunu günceller.
 * @param {'dark'|'light'} theme
 */
function updateThemeToggle(theme) {
  const btn = document.getElementById('btn-theme-toggle');
  if (!btn) return;
  btn.setAttribute('aria-label', theme === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
  btn.innerHTML = theme === 'dark'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`;
}

// ─────────────────────────────────────────────
// Drag-and-Drop Sıralama
// ─────────────────────────────────────────────

/**
 * Members listesi için drag-and-drop event'lerini kurar.
 * @param {HTMLElement} container
 */
function setupDragAndDrop(container) {
  // ── Mouse / Desktop ──
  container.addEventListener('dragstart', (e) => {
    const handle = e.target.closest('[data-drag-id]');
    if (!handle) { e.preventDefault(); return; }
    _dragSourceId = handle.dataset.dragId;
    const card    = handle.closest('.family-card');
    if (card) card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.family-card[data-member-id]');
    container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    if (card && card.dataset.memberId !== _dragSourceId) card.classList.add('drag-over');
  });

  container.addEventListener('dragleave', (e) => {
    if (!container.contains(e.relatedTarget)) {
      container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetCard = e.target.closest('.family-card[data-member-id]');
    if (!targetCard || targetCard.dataset.memberId === _dragSourceId) return;
    reorderMembers(_dragSourceId, targetCard.dataset.memberId);
  });

  container.addEventListener('dragend', () => {
    container.querySelectorAll('.dragging, .drag-over').forEach(el => {
      el.classList.remove('dragging', 'drag-over');
    });
    _dragSourceId = null;
  });

  // ── Touch / Mobile ──
  let _touchDragId   = null;
  let _lastTouchCard = null;

  container.addEventListener('touchstart', (e) => {
    const handle = e.target.closest('[data-drag-id]');
    if (!handle) return;
    _touchDragId = handle.dataset.dragId;
    const card   = handle.closest('.family-card');
    if (card) card.classList.add('dragging');
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!_touchDragId) return;
    e.preventDefault();
    const touch = e.touches[0];
    const el    = document.elementFromPoint(touch.clientX, touch.clientY);
    const card  = el?.closest('.family-card[data-member-id]');
    container.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (card && card.dataset.memberId !== _touchDragId) {
      card.classList.add('drag-over');
      _lastTouchCard = card.dataset.memberId;
    } else {
      _lastTouchCard = null;
    }
  }, { passive: false });

  container.addEventListener('touchend', () => {
    if (_touchDragId && _lastTouchCard) reorderMembers(_touchDragId, _lastTouchCard);
    container.querySelectorAll('.dragging, .drag-over').forEach(c => {
      c.classList.remove('dragging', 'drag-over');
    });
    _touchDragId   = null;
    _lastTouchCard = null;
  });
}

/**
 * İki üyenin sırasını değiştirir ve kaydeder.
 * @param {string} sourceId
 * @param {string} targetId
 */
function reorderMembers(sourceId, targetId) {
  const members   = [...state.members].sort((a, b) => a.order - b.order);
  const srcIdx    = members.findIndex(m => m.id === sourceId);
  const tgtIdx    = members.findIndex(m => m.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;

  const [removed] = members.splice(srcIdx, 1);
  members.splice(tgtIdx, 0, removed);
  members.forEach((m, i) => { m.order = i; });
  saveMembers(members);
  state.members = getMembers();
  renderHome();
}

// ─────────────────────────────────────────────
// Veri Yükleme
// ─────────────────────────────────────────────

/**
 * Tüm aile üyelerini ve hava verilerini yükler.
 * @param {boolean} [showLoader=true]
 */
async function loadAllData(showLoader = true) {
  state.members = getMembers();

  if (showLoader) {
    // Kartları yükleniyor durumunda göster
    state.members.forEach(m => {
      state.weatherData[m.id] = null;
    });
    renderHome();
  }

  if (state.members.length === 0) {
    renderHome();
    return;
  }

  state.isRefreshing = true;
  setRefreshIcon(true);

  try {
    const results = await fetchAllWeather(state.members);

    results.forEach(({ member, current, forecast, error }) => {
      state.weatherData[member.id] = { current, forecast, error, aqi: null };
    });

    state.lastUpdate = Date.now();
    renderHome();

    // AQI verisini arka planda çek (her üye için paralel)
    results.forEach(({ member, current, error }) => {
      if (!error && current) {
        fetchAQI(member.latitude, member.longitude)
          .then(aqi => {
            if (state.weatherData[member.id]) {
              state.weatherData[member.id].aqi = aqi;
              if (state.currentView === 'home') renderHome();
            }
          })
          .catch(() => {}); // AQI hatası diğer verileri etkilemesin
      }
    });

    // Ana sayfada AI chip'leri için arka planda önerileri çek
    results.forEach(({ member, current, error }) => {
      if (!error && current) {
        getAIAdvice({ ...current, weatherDescription: getWeatherLabel(current.weatherCode) }, member.name)
          .then(result => {
            if (state.weatherData[member.id]) {
              state.weatherData[member.id].aiAdvice = result;
              if (state.currentView === 'home') renderHome();
            }
          })
          .catch(() => {});
      }
    });

    // Giyinme uyarısı kontrolü
    checkDressingWarnings(state.members, state.weatherData);

    // Sabah bildirimini planla (uygulama açık tutulursa çalışır)
    scheduleMorningNotification(state.weatherData);

  } catch (err) {
    console.error('[App] Genel veri yükleme hatası:', err);
    showToast('❗ Veriler güncellenirken hata oluştu');
  } finally {
    state.isRefreshing = false;
    setRefreshIcon(false);
  }
}

/**
 * Yenile butonunun ikonunu döndürür / durdurur.
 * @param {boolean} spinning
 */
function setRefreshIcon(spinning) {
  const btn = document.getElementById('btn-refresh');
  if (!btn) return;
  const svg = btn.querySelector('svg');
  if (svg) svg.classList.toggle('spinning', spinning);
}

// ─────────────────────────────────────────────
// Yardımcı — HTML Escape (XSS önlemi)
// ─────────────────────────────────────────────

/**
 * Kullanıcı girdisini HTML için güvenli hale getirir.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────
// Event Listener'lar
// ─────────────────────────────────────────────

/**
 * Tüm event listener'ları kurar.
 */
function setupEventListeners() {

  // ── Header Butonları ──
  document.getElementById('btn-add-member')?.addEventListener('click', () => openModal());
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    if (!state.isRefreshing) loadAllData(false);
  });

  // ── Tema Toggle ──
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const current = getTheme();
    const next    = current === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    updateThemeToggle(next);
  });

  // ── Drag-and-Drop ──
  const membersList = document.getElementById('members-list');
  if (membersList) setupDragAndDrop(membersList);

  // ── Kartlara Tıklama (Event Delegation) ──
  document.getElementById('members-list')?.addEventListener('click', (e) => {
    // Pin butonu
    const pinBtn = e.target.closest('[data-pin-id]');
    if (pinBtn) {
      e.stopPropagation();
      const member = state.members.find(m => m.id === pinBtn.dataset.pinId);
      if (!member) return;
      updateMember(member.id, { pinned: !member.pinned });
      state.members = getMembers();
      renderHome();
      showToast(member.pinned ? '📌 Sabitleme kaldırıldı' : '📌 Kart sabitlendi');
      return;
    }

    // Düzenle butonu
    const editBtn = e.target.closest('[data-edit-id]');
    if (editBtn) {
      e.stopPropagation();
      openModal(editBtn.dataset.editId);
      return;
    }
    // Kart tıklama → detay
    const card = e.target.closest('.family-card[data-member-id]');
    if (card) renderDetail(card.dataset.memberId);

    // Ekle butonu
    if (e.target.closest('#card-add-btn')) openModal();
  });

  // Klavye desteği (kart navigasyonu)
  document.getElementById('members-list')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.family-card[data-member-id]');
      if (card) { e.preventDefault(); renderDetail(card.dataset.memberId); }
    }
  });

  // ── Geri Butonu ──
  document.getElementById('btn-back')?.addEventListener('click', () => showView('home', 'left'));
  document.getElementById('btn-settings-back')?.addEventListener('click', () => showView('home', 'left'));

  // ── Ayarlar ──
  document.getElementById('btn-settings')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderSettings();
    showView('settings', 'right');
  });

  // Sıcaklık birimi toggle
  document.getElementById('unit-celsius')?.addEventListener('click', () => {
    saveSettings({ unit: 'celsius' });
    renderSettings();
    renderHome();
  });
  document.getElementById('unit-fahrenheit')?.addEventListener('click', () => {
    saveSettings({ unit: 'fahrenheit' });
    renderSettings();
    renderHome();
  });

  // Önbellek TTL kaydırma
  document.getElementById('cache-ttl')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('cache-ttl-value').textContent = `${val} dk`;
    saveSettings({ cacheTTL: val });
  });

  // API Anahtarı Kaydet
  document.getElementById('btn-save-api-key')?.addEventListener('click', () => {
    const input = document.getElementById('api-key-input');
    const key   = input?.value.trim();
    if (!key) { showToast('❗ API anahtarı boş'); return; }
    if (!key.startsWith('AIza')) { showToast('❗ Geçersiz Gemini API anahtarı formatı'); return; }
    if (saveApiKey(key)) {
      input.value = '';
      updateApiKeyStatus();
      showToast('✅ API anahtarı kaydedildi');
    } else {
      showToast('❗ Anahtar kaydedilemedi');
    }
  });

  // Enter ile API anahtarı kaydet
  document.getElementById('api-key-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-save-api-key')?.click();
  });

  // Verileri Sıfırla
  document.getElementById('btn-reset-data')?.addEventListener('click', () => {
    if (!confirm('Tüm aile üyeleri ve ayarlar silinecek. Emin misin?')) return;
    resetAllData();
    state.members     = [];
    state.weatherData = {};
    state.lastUpdate  = 0;
    renderHome();
    showView('home', 'left');
    showToast('🗑️ Tüm veriler silindi');
  });

  // PWA Güncelle
  document.getElementById('btn-update-pwa')?.addEventListener('click', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.update();
          navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    showToast('🔄 Güncelleme kontrol ediliyor...');
  });

  // ── Modal ──
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-save')?.addEventListener('click', handleModalSave);

  // Modal dışına tıklama ile kapat
  document.getElementById('modal-member')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-member') closeModal();
  });

  // Enter ile modal kaydet
  document.getElementById('input-city')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleModalSave();
  });
  document.getElementById('input-name')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('input-city')?.focus();
    // Hata sınıfını temizle
    e.target.classList.remove('error');
  });
  document.getElementById('input-city')?.addEventListener('input', (e) => {
    e.target.classList.remove('error');
  });

  // Avatar Seçimi
  document.getElementById('avatar-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.avatar-option');
    if (btn) setSelectedAvatar(btn.dataset.avatar);
  });

  // ── Şehir Seçim Listesi ──
  document.getElementById('city-results-list')?.addEventListener('click', async (e) => {
    const item = e.target.closest('.city-result-item[data-result-idx]');
    if (!item || !state.pendingCityResults) return;
    const idx = parseInt(item.dataset.resultIdx, 10);
    const { name, city, results } = state.pendingCityResults;
    if (results[idx]) await proceedWithCityResult(name, city, results[idx]);
  });

  document.getElementById('city-results-list')?.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.city-result-item[data-result-idx]');
    if (!item || !state.pendingCityResults) return;
    e.preventDefault();
    const idx = parseInt(item.dataset.resultIdx, 10);
    const { name, city, results } = state.pendingCityResults;
    if (results[idx]) await proceedWithCityResult(name, city, results[idx]);
  });

  // Üye Sil
  document.getElementById('btn-delete-member')?.addEventListener('click', () => {
    if (!state.editingMemberId) return;
    const member = state.members.find(m => m.id === state.editingMemberId);
    if (!member) return;
    if (!confirm(`${member.name} silinsin mi?`)) return;

    deleteMember(state.editingMemberId);
    delete state.weatherData[state.editingMemberId];
    closeModal();
    state.members = getMembers();
    renderHome();
    showToast(`🗑️ ${member.name} silindi`);
  });

  // ── Detay sayfası ──
  document.getElementById('btn-ai-refresh')?.addEventListener('click', () => {
    if (!state.selectedMemberId) return;
    const wd = state.weatherData[state.selectedMemberId];
    if (!wd?.current) return;
    loadAIAdvice(state.selectedMemberId, wd.current, true);
  });

  // Paylaş butonu
  document.getElementById('btn-share-card')?.addEventListener('click', async () => {
    if (!state.selectedMemberId) return;
    const member = state.members.find(m => m.id === state.selectedMemberId);
    const wd     = state.weatherData[state.selectedMemberId];
    if (!member || !wd?.current) return;

    const settings = getSettings();
    try {
      const result = await shareWeatherCard(member, wd, settings.unit);
      if (result === 'downloaded') showToast('📥 Kart indirildi');
      else if (result === 'shared') showToast('✅ Paylaşıldı');
    } catch (err) {
      console.error('[Share] Paylaşım hatası:', err);
      showToast('❗ Paylaşım başarısız');
    }
  });

  // ── Ayarlar — Bildirim Toggle ──
  document.getElementById('btn-notif-toggle')?.addEventListener('click', async () => {
    const settings = getNotificationSettings();
    if (!settings.enabled) {
      // Açmaya çalışıyor
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        showToast('❗ Bildirim izni verilmedi');
        return;
      }
      saveNotificationSettings({ enabled: true });
      scheduleMorningNotification(state.weatherData);
      showToast('🔔 Bildirimler açıldı');
    } else {
      saveNotificationSettings({ enabled: false });
      cancelAllNotifications();
      showToast('🔕 Bildirimler kapatıldı');
    }
    renderSettings();
  });

  document.getElementById('toggle-notif-morning')?.addEventListener('click', () => {
    const s = getNotificationSettings();
    saveNotificationSettings({ morning: !s.morning });
    renderSettings();
  });

  document.getElementById('toggle-notif-dressing')?.addEventListener('click', () => {
    const s = getNotificationSettings();
    saveNotificationSettings({ dressing: !s.dressing });
    renderSettings();
  });

  // ── Klavye: Escape ile modal/detay kapat ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('modal-member')?.classList.contains('open')) {
        closeModal();
      } else if (state.currentView !== 'home') {
        showView('home', 'left');
      }
    }
  });

  // ── Offline / Online Algılama ──
  window.addEventListener('offline', () => {
    document.getElementById('offline-banner')?.classList.add('visible');
  });
  window.addEventListener('online', () => {
    document.getElementById('offline-banner')?.classList.remove('visible');
    showToast('📶 Bağlantı yeniden kuruldu');
    if (!state.isRefreshing) loadAllData(false);
  });

  // SW güncellemesi
  document.addEventListener('sw-update-available', () => {
    showToast('🔄 Yeni sürüm mevcut — ayarlardan güncelleyebilirsin', 6000);
  });

  // Eski veri bildirimi
  document.addEventListener('stale-data', () => {
    showToast('⚠️ Çevrimdışısın — eski veriler gösteriliyor', 4000);
  });

  // ── Hash tabanlı routing ──
  window.addEventListener('hashchange', handleHashChange);
}

/**
 * URL hash değişimini işler.
 */
function handleHashChange() {
  const hash = window.location.hash;

  if (hash.startsWith('#detail/')) {
    const id = hash.slice(8);
    if (id && state.members.find(m => m.id === id)) {
      renderDetail(id);
    }
  } else if (hash === '#settings') {
    renderSettings();
    showView('settings', 'right');
  } else {
    showView('home', 'left');
  }
}

// ─────────────────────────────────────────────
// Uygulama Başlatma
// ─────────────────────────────────────────────

/**
 * Uygulamayı başlatır.
 */
async function init() {
  // Temayı başlat
  initTheme();

  // Event listener'ları kur
  setupEventListeners();

  // İlk görünüm
  showView('home');

  // Veriyi yükle
  await loadAllData();

  // Offline durumu kontrol et
  if (!navigator.onLine) {
    document.getElementById('offline-banner')?.classList.add('visible');
  }
}

// ─── Başlat ───
init().catch(err => console.error('[App] Başlatma hatası:', err));
