/**
 * @fileoverview HavaPuls — Bildirim Sistemi
 * Sabah özeti ve giyinme uyarısı bildirimleri.
 * Not: Bildirimlerin çalışması için uygulama açık olmalıdır.
 * @module notifications
 */

'use strict';

import { getMembers, getNotificationSettings } from './storage.js';

/** Zamanlayıcı referansı */
let _morningTimer = null;

// ─────────────────────────────────────────────
// İzin Yönetimi
// ─────────────────────────────────────────────

/**
 * Bildirim izni ister.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Mevcut bildirim iznini döner.
 * @returns {boolean}
 */
function hasNotificationPermission() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// ─────────────────────────────────────────────
// Sabah Bildirimi Zamanlama
// ─────────────────────────────────────────────

/**
 * Sabah 07:00 özeti bildirimini planlar.
 * Uygulama açık olduğu sürece çalışır.
 * @param {Object.<string, any>} allWeatherData - State'teki weatherData objesi
 */
function scheduleMorningNotification(allWeatherData) {
  cancelMorningNotification();

  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.morning) return;
  if (!hasNotificationPermission()) return;

  const now   = new Date();
  const alarm = new Date();
  alarm.setHours(7, 0, 0, 0);
  if (alarm <= now) alarm.setDate(alarm.getDate() + 1);

  const msUntil = alarm - now;

  _morningTimer = setTimeout(() => {
    showMorningSummary(allWeatherData);
    // Bir sonraki gün için yeniden planla
    scheduleMorningNotification(allWeatherData);
  }, msUntil);
}

/**
 * Sabah bildirim zamanlayıcısını iptal eder.
 */
function cancelMorningNotification() {
  if (_morningTimer !== null) {
    clearTimeout(_morningTimer);
    _morningTimer = null;
  }
}

// ─────────────────────────────────────────────
// Bildirim Gösterimi
// ─────────────────────────────────────────────

/**
 * Sabah hava özeti bildirimini gösterir.
 * @param {Object.<string, any>} allWeatherData
 */
function showMorningSummary(allWeatherData) {
  if (!hasNotificationPermission()) return;
  const members = getMembers();
  if (members.length === 0) return;

  const parts = members
    .sort((a, b) => a.order - b.order)
    .map(m => {
      const wd = allWeatherData[m.id];
      if (!wd?.current) return null;
      return `${m.name}: ${Math.round(wd.current.temperature)}°C`;
    })
    .filter(Boolean);

  if (parts.length === 0) return;

  const body = parts.join(' · ');

  try {
    new Notification('🌤️ HavaPuls — Sabah Özeti', {
      body,
      icon:  'icons/icon-192.png',
      badge: 'icons/icon-72.png',
      tag:   'havapuls-morning',
    });
  } catch (err) {
    console.error('[Notifications] Bildirim gösterilemedi:', err);
  }
}

/**
 * Giyinme uyarısı bildirimini gösterir.
 * @param {string} memberName
 * @param {string} city
 * @param {number} tempDrop - Gün içi sıcaklık düşüşü (°C)
 */
function showDressingWarning(memberName, city, tempDrop) {
  if (!hasNotificationPermission()) return;
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dressing) return;

  try {
    new Notification(`🧥 ${memberName} için Giyinme Uyarısı`, {
      body: `${city}'da bugün yaklaşık ${Math.round(tempDrop)}°C sıcaklık düşüşü bekleniyor. Katmanlı giyinmeyi düşün!`,
      icon: 'icons/icon-192.png',
      tag:  `havapuls-dressing-${memberName}`,
    });
  } catch (err) {
    console.error('[Notifications] Giyinme uyarısı gösterilemedi:', err);
  }
}

/**
 * Tüm aktif bildirimleri ve zamanlayıcıları iptal eder.
 */
function cancelAllNotifications() {
  cancelMorningNotification();
}

/**
 * Hava verisi yüklendiğinde çağrılır.
 * Giyinme uyarısı koşullarını kontrol eder.
 * @param {import('./models.js').FamilyMember[]} members
 * @param {Object.<string, any>} allWeatherData
 */
function checkDressingWarnings(members, allWeatherData) {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dressing) return;
  if (!hasNotificationPermission()) return;

  members.forEach(member => {
    const wd = allWeatherData[member.id];
    if (!wd?.forecast?.length) return;

    const today = wd.forecast[0];
    const drop  = today.maxTemp - today.minTemp;
    if (drop >= 10) {
      showDressingWarning(member.name, member.city, drop);
    }
  });
}

export {
  requestNotificationPermission,
  hasNotificationPermission,
  scheduleMorningNotification,
  cancelAllNotifications,
  showMorningSummary,
  checkDressingWarnings,
};
