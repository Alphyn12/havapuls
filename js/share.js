/**
 * @fileoverview HavaPuls — Hava Durumu Kartı Paylaşma
 * Canvas tabanlı görsel üretimi + navigator.share() entegrasyonu.
 * @module share
 */

'use strict';

import { WMO_CODES } from './models.js';

// ─────────────────────────────────────────────
// Renk Paleti (Hava Kategorisine Göre)
// ─────────────────────────────────────────────

const WEATHER_GRADIENTS = {
  clear:   ['#f59e0b', '#dc6803'],
  night:   ['#1e1b4b', '#3730a3'],
  cloudy:  ['#475569', '#1e293b'],
  rain:    ['#1e40af', '#1d4ed8'],
  drizzle: ['#2563eb', '#1d4ed8'],
  snow:    ['#38bdf8', '#0284c7'],
  storm:   ['#4c1d95', '#7c3aed'],
  fog:     ['#4b5563', '#374151'],
};

// ─────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────

function getWeatherCategory(weatherCode, isDay) {
  const entry = WMO_CODES[weatherCode];
  if (!entry) return 'clear';
  if (entry.category === 'clear' && !isDay) return 'night';
  return entry.category;
}

function formatTemp(celsius, unit) {
  if (unit === 'fahrenheit') return `${Math.round(celsius * 9 / 5 + 32)}°F`;
  return `${Math.round(celsius)}°C`;
}

function getLabel(weatherCode) {
  return WMO_CODES[weatherCode]?.label || 'Bilinmiyor';
}

/**
 * Canvas'a köşe yuvarlak dikdörtgen çizer (roundRect polyfill).
 */
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ─────────────────────────────────────────────
// Canvas Çizimi
// ─────────────────────────────────────────────

/**
 * Hava durumu kartını canvas'a çizer ve paylaşır.
 * @param {import('./models.js').FamilyMember} member
 * @param {{ current: import('./models.js').WeatherData, aiAdvice?: any }} weatherData
 * @param {'celsius'|'fahrenheit'} unit
 * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
 */
async function shareWeatherCard(member, weatherData, unit = 'celsius') {
  const { current, aiAdvice } = weatherData;
  if (!current) throw new Error('Hava verisi yok');

  const canvas = document.getElementById('share-canvas');
  if (!canvas) throw new Error('Canvas elementi bulunamadı');

  const W = 420, H = 230;
  canvas.width  = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const category = getWeatherCategory(current.weatherCode, current.isDay !== false);
  const [c1, c2] = WEATHER_GRADIENTS[category] || WEATHER_GRADIENTS.clear;

  // ── Arka Plan ──
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  roundRect(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // ── Üstte yarı-şeffaf overlay ──
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, 'rgba(0,0,0,0.15)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = overlay;
  ctx.beginPath();
  roundRect(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // ── Avatar dairesi ──
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(46, 46, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.font      = '26px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText(member.avatar, 46, 55);

  // ── İsim + Şehir ──
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 17px "DM Sans", system-ui, sans-serif';
  ctx.fillText(member.name, 82, 36);

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font      = '13px "DM Sans", system-ui, sans-serif';
  ctx.fillText(member.city, 82, 56);

  // ── Büyük Sıcaklık ──
  const tempStr = formatTemp(current.temperature, unit);
  ctx.fillStyle  = '#ffffff';
  ctx.font       = 'bold 60px "DM Mono", monospace';
  ctx.textAlign  = 'center';
  ctx.fillText(tempStr, W / 2, 138);

  // ── Hava Açıklaması ──
  const desc    = getLabel(current.weatherCode);
  ctx.font      = '15px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(desc, W / 2, 159);

  // ── Metrik Satırı ──
  ctx.font      = '12px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  const metrics = [
    `💧 %${current.humidity}`,
    `💨 ${Math.round(current.windSpeed)} km/h`,
    `☀️ UV ${current.uvIndex}`,
  ];
  const metricSpacing = W / (metrics.length + 1);
  metrics.forEach((m, i) => {
    ctx.textAlign = 'center';
    ctx.fillText(m, metricSpacing * (i + 1), 180);
  });

  // ── AI Tavsiyesi ──
  if (aiAdvice?.advice) {
    const tip = aiAdvice.advice.replace(/\n/g, ' ').slice(0, 60);
    ctx.font      = 'italic 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.textAlign = 'left';
    ctx.fillText(`💡 ${tip}`, 14, 203);
  }

  // ── Marka ──
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font      = '11px "DM Sans", system-ui, sans-serif';
  ctx.fillText('HavaPuls', W - 14, 218);

  // ── Paylaş / İndir ──
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error('Görsel oluşturulamadı')); return; }

      const fileName = `havapuls-${member.name}-${member.city}.png`.replace(/\s/g, '-');
      const file     = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: `${member.name} — ${member.city}: ${tempStr}`,
            text:  `${desc}${aiAdvice?.advice ? ' · ' + aiAdvice.advice.split('\n')[0] : ''}`,
            files: [file],
          });
          resolve('shared');
        } catch (err) {
          if (err.name === 'AbortError') resolve('cancelled');
          else reject(err);
        }
      } else {
        // Masaüstü fallback — PNG olarak indir
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve('downloaded');
      }
    }, 'image/png');
  });
}

export { shareWeatherCard };
