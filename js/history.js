/**
 * @fileoverview HavaPuls — 24 Saatlik Sıcaklık Grafiği
 * SVG tabanlı sıcaklık eğrisi çizimi.
 * @module history
 */

'use strict';

// ─────────────────────────────────────────────
// SVG Grafik Render
// ─────────────────────────────────────────────

/**
 * 24 saatlik sıcaklık verisinden SVG grafik üretir.
 * @param {string[]} times  - ISO saat dizisi (24 adet)
 * @param {number[]} temps  - Sıcaklık değerleri (24 adet, °C)
 * @param {'celsius'|'fahrenheit'} [unit='celsius']
 * @returns {string} SVG HTML string
 */
function renderTempChart(times, temps, unit = 'celsius') {
  if (!times || !temps || temps.length < 2) {
    return `<div class="chart-empty">Grafik verisi yüklenemedi.</div>`;
  }

  const W   = 320;
  const H   = 110;
  const PAD = { top: 18, right: 14, bottom: 26, left: 34 };

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  // Sıcaklık değerleri (birimsiz, hesaplama için °C kullan)
  const rawMin = Math.min(...temps);
  const rawMax = Math.max(...temps);
  const range  = rawMax - rawMin || 1;

  // Görüntülenecek değerler
  const displayTemps = unit === 'fahrenheit'
    ? temps.map(t => Math.round(t * 9 / 5 + 32))
    : temps.map(t => Math.round(t));
  const displayMin = Math.min(...displayTemps);
  const displayMax = Math.max(...displayTemps);
  const displayUnit = unit === 'fahrenheit' ? '°F' : '°C';

  // Koordinat fonksiyonları
  const xFn = (i) => PAD.left + (i / (temps.length - 1)) * innerW;
  const yFn = (t) => PAD.top + innerH - ((t - rawMin) / range) * innerH;

  // SVG path (Catmull-Rom benzeri smooth bezier)
  let pathD  = '';
  let fillD  = '';

  for (let i = 0; i < temps.length; i++) {
    const x = xFn(i);
    const y = yFn(temps[i]);

    if (i === 0) {
      pathD += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      fillD += `M ${x.toFixed(1)} ${(H - PAD.bottom).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      const px  = xFn(i - 1);
      const py  = yFn(temps[i - 1]);
      const cpX = ((px + x) / 2).toFixed(1);
      pathD += ` C ${cpX} ${py.toFixed(1)}, ${cpX} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
      fillD += ` C ${cpX} ${py.toFixed(1)}, ${cpX} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  fillD += ` L ${xFn(temps.length - 1).toFixed(1)} ${(H - PAD.bottom).toFixed(1)} Z`;

  // Şu anki saat
  const nowHour   = new Date().getHours();
  const clampedHr = Math.min(nowHour, temps.length - 1);
  const nowX      = xFn(clampedHr).toFixed(1);
  const nowY      = yFn(temps[clampedHr]).toFixed(1);
  const nowDisplay = displayTemps[clampedHr];

  // Eksen etiketleri (00:00, 06:00, 12:00, 18:00, 23:00)
  const labelHours = [0, 6, 12, 18, 23];
  const xLabels = labelHours.map(h => ({
    x:     xFn(Math.min(h, temps.length - 1)).toFixed(1),
    label: `${String(h).padStart(2, '0')}:00`,
  }));

  // Izgara çizgisi Y pozisyonu (orta sıcaklık)
  const midY = yFn((rawMin + rawMax) / 2).toFixed(1);

  return `
<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}"
     xmlns="http://www.w3.org/2000/svg"
     aria-label="24 saatlik sıcaklık grafiği"
     class="temp-chart-svg">
  <defs>
    <linearGradient id="chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="var(--clr-accent)" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="var(--clr-accent)" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Arka ızgara -->
  <line x1="${PAD.left}" y1="${PAD.top}" x2="${W - PAD.right}" y2="${PAD.top}"
        stroke="var(--clr-border)" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="${PAD.left}" y1="${midY}" x2="${W - PAD.right}" y2="${midY}"
        stroke="var(--clr-border)" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="${PAD.left}" y1="${H - PAD.bottom}" x2="${W - PAD.right}" y2="${H - PAD.bottom}"
        stroke="var(--clr-border)" stroke-width="1"/>

  <!-- Doldurma alanı -->
  <path d="${fillD}" fill="url(#chart-fill-grad)"/>

  <!-- Sıcaklık çizgisi -->
  <path d="${pathD}"
        stroke="var(--clr-accent)" stroke-width="2"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Şu an çizgisi -->
  <line x1="${nowX}" y1="${PAD.top}" x2="${nowX}" y2="${H - PAD.bottom}"
        stroke="var(--clr-warn)" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.8"/>
  <circle cx="${nowX}" cy="${nowY}" r="4"
          fill="var(--clr-warn)" stroke="var(--clr-bg)" stroke-width="2"/>
  <text x="${nowX}" y="${Number(nowY) - 8}"
        text-anchor="middle" font-size="9" font-weight="600"
        fill="var(--clr-warn)" font-family="DM Mono,monospace">
    ${nowDisplay}${displayUnit}
  </text>

  <!-- Min/Max Y etiketleri -->
  <text x="${PAD.left - 4}" y="${(PAD.top + 4).toFixed(1)}"
        text-anchor="end" font-size="9" fill="var(--clr-text-2)"
        font-family="DM Mono,monospace">${displayMax}${displayUnit}</text>
  <text x="${PAD.left - 4}" y="${(H - PAD.bottom).toFixed(1)}"
        text-anchor="end" font-size="9" fill="var(--clr-text-2)"
        font-family="DM Mono,monospace">${displayMin}${displayUnit}</text>

  <!-- Saat etiketleri -->
  ${xLabels.map(l => `
  <text x="${l.x}" y="${H - 4}"
        text-anchor="middle" font-size="9"
        fill="var(--clr-text-3)" font-family="DM Mono,monospace">${l.label}</text>`).join('')}
</svg>`;
}

// ─────────────────────────────────────────────
// Saatlik Hava Tablosu
// ─────────────────────────────────────────────

/**
 * Şu andan itibaren 12 saatlik hava detay tablosu üretir.
 * @param {string[]} times  - ISO saat dizisi (24 adet)
 * @param {number[]} temps  - Sıcaklık (°C)
 * @param {number[]} precip - Yağış olasılığı (%)
 * @param {number[]} wind   - Rüzgar hızı (km/h)
 * @param {'celsius'|'fahrenheit'} [unit='celsius']
 * @returns {string} HTML string
 */
function renderHourlyTable(times, temps, precip, wind, unit = 'celsius') {
  if (!times || !temps || times.length === 0) {
    return '<div class="chart-empty">Saatlik veri yüklenemedi.</div>';
  }

  const nowHour    = new Date().getHours();
  const displayUnit = unit === 'fahrenheit' ? '°F' : '°C';
  const startIdx   = Math.min(nowHour, times.length - 1);
  const endIdx     = Math.min(startIdx + 12, times.length);
  const rows       = [];

  for (let i = startIdx; i < endIdx; i++) {
    const hour      = new Date(times[i]).getHours();
    const temp      = unit === 'fahrenheit'
      ? Math.round(temps[i] * 9 / 5 + 32)
      : Math.round(temps[i]);
    const precipVal = precip?.[i] ?? 0;
    const windVal   = Math.round(wind?.[i] ?? 0);
    const isNow     = i === startIdx;

    rows.push(`
      <div class="hourly-row${isNow ? ' now' : ''}">
        <span class="hourly-time">${String(hour).padStart(2, '0')}:00</span>
        <span class="hourly-temp">${temp}${displayUnit}</span>
        <div class="hourly-precip-wrap" title="Yağış olasılığı: %${precipVal}">
          <div class="hourly-precip-bar">
            <div class="hourly-precip-fill" style="width:${precipVal}%"></div>
          </div>
          <span class="hourly-precip-pct">${precipVal > 0 ? '%' + precipVal : '—'}</span>
        </div>
        <span class="hourly-wind">${windVal} <span class="hourly-wind-unit">km/h</span></span>
      </div>
    `);
  }

  return `
    <div class="hourly-table">
      <div class="hourly-header">
        <span>Saat</span>
        <span>Sıcaklık</span>
        <span>Yağış</span>
        <span>Rüzgar</span>
      </div>
      ${rows.join('')}
    </div>
  `;
}

export { renderTempChart, renderHourlyTable };
