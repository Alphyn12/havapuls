/**
 * @fileoverview HavaPuls — Gemini AI öneri motoru
 * Gemini 2.0 Flash API entegrasyonu ve kural tabanlı yedek sistem.
 * @module ai
 */

'use strict';

import { RULE_ENGINE } from './models.js';
import { getApiKey, getAiCache, setAiCache, deleteAiCache } from './storage.js';

// ─────────────────────────────────────────────
// Gemini API Sabiti
// ─────────────────────────────────────────────

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';


// ─────────────────────────────────────────────
// Önbellek Anahtarı Üretimi
// ─────────────────────────────────────────────

/**
 * Hava koşullarından önbellek hash'i üretir.
 * Aynı şehir + aynı hava kodu + aynı sıcaklık → aynı hash.
 * @param {import('./models.js').WeatherData} weatherData
 * @returns {string}
 */
function buildCacheHash(weatherData) {
  const city  = (weatherData.city || '').replace(/\s/g, '_').toLowerCase();
  const code  = weatherData.weatherCode || 0;
  const temp  = Math.round(weatherData.temperature || 0);
  return `${city}_${code}_${temp}`;
}

// ─────────────────────────────────────────────
// Kural Tabanlı Yedek Sistem
// ─────────────────────────────────────────────

/**
 * Hava verisine göre kural tabanlı öneri üretir.
 * Gemini API başarısız olursa veya API anahtarı yoksa kullanılır.
 * @param {import('./models.js').WeatherData} weatherData
 * @returns {{ advice: string, level: 'good'|'warning'|'danger', isAI: false }}
 */
function getRuleBasedAdvice(weatherData) {
  for (const rule of RULE_ENGINE) {
    if (rule.condition(weatherData)) {
      return { advice: rule.advice, level: rule.level, isAI: false };
    }
  }
  // Hiçbir kural eşleşmezse varsayılan öneri
  return {
    advice: '🌤️ Bugün hava normal görünüyor. Giyimine göre çıkabilirsin.',
    level:  'good',
    isAI:   false,
  };
}

// ─────────────────────────────────────────────
// Gemini API Çağrısı
// ─────────────────────────────────────────────

/**
 * Gemini 2.0 Flash API'ye hava danışmanlığı isteği gönderir.
 * @param {import('./models.js').WeatherData} weatherData
 * @param {string} memberName - Aile üyesinin adı
 * @param {string} apiKey - Gemini API anahtarı
 * @returns {Promise<string>} AI önerisi metni
 * @throws {Error} API hatası durumunda
 */
async function callGeminiAPI(weatherData, memberName, apiKey) {
  const systemContext = `Sen HavaPuls uygulamasının hava durumu danışmanısın.
Kullanıcının aile üyelerine hava durumuna göre Türkçe, samimi ve kısa öneriler veriyorsun.
Yanıtın maksimum 3 cümle olsun. Emoji kullan. Resmi değil, sıcak bir dil kullan.
Format: Her öneri kendi satırında, emoji ile başlasın.
Asla "Merhaba" veya "Günaydın" ile başlama, direkt öneriye gir.
Sadece öneri ver, açıklama yapma.`;

  const userPrompt = `${memberName} için hava durumu raporu:
- Şehir: ${weatherData.city}
- Sıcaklık: ${Math.round(weatherData.temperature)}°C (Hissedilen: ${Math.round(weatherData.apparentTemperature)}°C)
- Hava: ${weatherData.weatherDescription || 'Bilinmiyor'}
- Nem: %${weatherData.humidity}
- Rüzgar: ${Math.round(weatherData.windSpeed)} km/h
- UV indeksi: ${weatherData.uvIndex}
- Yağış olasılığı: %${weatherData.precipitationProbability || 0}

Bu kişi dışarı çıkmayı planlıyor. Ne önerirsin?`;

  const fullPrompt = `${systemContext}\n\n${userPrompt}`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature:     0.7,
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini API hatası ${response.status}: ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API boş yanıt döndü');

  return text.trim();
}

// ─────────────────────────────────────────────
// Ana Öneri Fonksiyonu
// ─────────────────────────────────────────────

/**
 * @typedef {Object} AdviceResult
 * @property {string} advice - Öneri metni
 * @property {'good'|'warning'|'danger'} level - Önem seviyesi
 * @property {boolean} isAI - Gemini'den mi geldi?
 * @property {boolean} fromCache - Önbellekten mi?
 */

/**
 * Aile üyesi için akıllı hava durumu önerisi üretir.
 * Sırasıyla: önbellek → Gemini API → kural tabanlı sistem.
 * @param {import('./models.js').WeatherData} weatherData
 * @param {string} memberName - Üye adı
 * @param {boolean} [forceRefresh=false] - Önbelleği yoksay ve yeniden çek
 * @returns {Promise<AdviceResult>}
 */
async function getAIAdvice(weatherData, memberName, forceRefresh = false) {
  const hash   = buildCacheHash(weatherData);
  const apiKey = getApiKey();

  // Force refresh ise localStorage önbelleğini temizle
  if (forceRefresh) {
    deleteAiCache(hash);
  } else {
    // 1. Önbellek kontrolü
    const cached = getAiCache(hash);
    if (cached) {
      return {
        advice:    cached.advice,
        level:     'good',
        isAI:      true,
        fromCache: true,
      };
    }
  }

  // 2. API anahtarı yoksa kural tabanlı sisteme düş
  if (!apiKey) {
    return { ...getRuleBasedAdvice(weatherData), fromCache: false };
  }

  // 3. Gemini API çağrısı
  try {
    const advice = await callGeminiAPI(weatherData, memberName, apiKey);

    // Önbelleğe kaydet
    setAiCache(hash, advice);

    return { advice, level: 'good', isAI: true, fromCache: false };
  } catch (err) {
    console.error('[AI] Gemini API başarısız, kural motoruna düşülüyor:', err.message);
    return { ...getRuleBasedAdvice(weatherData), fromCache: false };
  }
}

// ─────────────────────────────────────────────
// Kıyafet Öneri Sistemi
// ─────────────────────────────────────────────

/**
 * Sıcaklık + hava koşuluna göre kural tabanlı kıyafet önerisi.
 * @param {import('./models.js').WeatherData} weatherData
 * @returns {{ outfit: string, level: 'good'|'warning'|'danger' }}
 */
function getRuleBasedOutfit(weatherData) {
  const { temperature: t, weatherCode: code, windSpeed, precipitationProbability: precip } = weatherData;

  let layers = [];
  let extras = [];
  let level = 'good';

  // Üst + Alt katman
  if (t < 0) {
    layers = ['🧥 Kalın kaban', '🧣 Atkı + bere + eldiven', '👖 Termal iç çamaşır', '🥾 Su geçirmez bot'];
    level = 'danger';
  } else if (t < 6) {
    layers = ['🧥 Palto veya kalın mont', '🧤 Eldiven + bere', '👖 Kalın pantolon', '👢 Bot'];
    level = 'warning';
  } else if (t < 11) {
    layers = ['🧥 Mont', '👕 Kazak veya sweatshirt', '👖 Jean', '👟 Spor ayakkabı'];
    level = 'warning';
  } else if (t < 16) {
    layers = ['🧥 İnce ceket veya hırka', '👕 Gömlek veya tişört', '👖 Jean', '👟 Spor ayakkabı'];
    level = 'good';
  } else if (t < 21) {
    layers = ['👕 Tişört + ince dış katman', '👖 Jean veya chino', '👟 Spor ayakkabı'];
    level = 'good';
  } else if (t < 26) {
    layers = ['👕 Tişört', '👖 İnce pantolon veya şort', '👟 Spor ayakkabı veya sandalet'];
    level = 'good';
  } else if (t < 32) {
    layers = ['👕 İnce, hafif tişört', '🩳 Şort veya ince pantolon', '👡 Sandalet'];
    extras.push('🧢 Şapka önerilir');
    level = 'warning';
  } else {
    layers = ['👕 Açık renkli, serin kumaş', '🩳 Şort', '👡 Sandalet'];
    extras.push('🧢 Şapka ve 🕶️ güneş gözlüğü şart');
    level = 'warning';
  }

  // Yağmur / kar
  if ([61, 63, 65, 80, 81, 82, 51, 53, 55].includes(code) || precip > 50) {
    extras.push('☂️ Şemsiye veya yağmurluk');
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    extras.push('🥾 Su geçirmez bot, kaygan zemine dikkat');
  }
  // Rüzgar
  if (windSpeed > 40) {
    extras.push('💨 Rüzgara karşı rüzgarlık giy');
  }
  // UV
  if (weatherData.uvIndex > 7) {
    extras.push('🧴 Güneş kremi + 🕶️ güneş gözlüğü');
  }

  const lines = [...layers, ...(extras.length ? ['', ...extras] : [])];
  return { outfit: lines.join('\n'), level };
}

/**
 * Gemini'den kıyafet önerisi ister.
 * @param {import('./models.js').WeatherData} weatherData
 * @param {string} memberName
 * @param {string} apiKey
 * @returns {Promise<string>}
 */
async function callGeminiForOutfit(weatherData, memberName, apiKey) {
  const prompt = `Sen bir moda danışmanısın. ${memberName} için dışarı çıkış kıyafeti öner.
Hava: ${Math.round(weatherData.temperature)}°C, ${weatherData.weatherDescription || ''}, rüzgar ${Math.round(weatherData.windSpeed)} km/h, UV ${weatherData.uvIndex}.
Kısa ve net, 4-6 madde halinde emoji ile listele. Türkçe yaz.`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.6 },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`Gemini API hatası: ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Boş yanıt');
  return text.trim();
}

/**
 * Aile üyesi için kıyafet önerisi üretir.
 * @param {import('./models.js').WeatherData} weatherData
 * @param {string} memberName
 * @returns {Promise<{ outfit: string, level: 'good'|'warning'|'danger', isAI: boolean }>}
 */
async function getClothingAdvice(weatherData, memberName) {
  const cacheKey = `outfit_${Math.round(weatherData.temperature)}_${weatherData.weatherCode}`;
  const cached = getAiCache(cacheKey);
  if (cached) return { outfit: cached.advice, level: 'good', isAI: true };

  const apiKey = getApiKey();

  if (!apiKey) {
    return { ...getRuleBasedOutfit(weatherData), isAI: false };
  }

  try {
    const outfit = await callGeminiForOutfit(weatherData, memberName, apiKey);
    setAiCache(cacheKey, outfit);
    return { outfit, level: 'good', isAI: true };
  } catch {
    return { ...getRuleBasedOutfit(weatherData), isAI: false };
  }
}

export { getAIAdvice, getRuleBasedAdvice, getClothingAdvice };
