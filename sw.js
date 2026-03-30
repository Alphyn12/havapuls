/**
 * @fileoverview HavaPuls — Service Worker
 * Cache-first (statik dosyalar) + Network-first (API) stratejisi.
 * Offline-first PWA desteği.
 */

'use strict';

const STATIC_CACHE  = 'havapuls-static-v2';
const API_CACHE     = 'havapuls-api-v2';
const NETWORK_TIMEOUT = 5000; // 5 saniye

/** Kurulum sırasında önbelleğe alınacak statik dosyalar */
const STATIC_ASSETS = [
  './',
  'index.html',
  'styles/main.css',
  'styles/animations.css',
  'js/app.js',
  'js/api.js',
  'js/ai.js',
  'js/storage.js',
  'js/models.js',
  'js/history.js',
  'js/share.js',
  'js/notifications.js',
  'manifest.json',
];

/** API isteklerini tanımlamak için URL desenleri */
const API_PATTERNS = [
  'api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'generativelanguage.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com',
];

// ─────────────────────────────────────────────
// Kurulum (install)
// ─────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Statik dosya önbellekleme hatası:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────
// Aktivasyon (activate) — Eski önbellekleri temizle
// ─────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const geçerliÖnbellekler = [STATIC_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys().then((önbellekAdları) => {
      return Promise.all(
        önbellekAdları
          .filter((ad) => !geçerliÖnbellekler.includes(ad))
          .map((ad) => {
            console.log('[SW] Eski önbellek siliniyor:', ad);
            return caches.delete(ad);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// Fetch — İstek Stratejisi
// ─────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST isteklerini (Gemini API) SW'ye müdahale ettirme
  if (request.method !== 'GET') return;

  // Harici API istekleri → Network-first
  const isApiRequest = API_PATTERNS.some((pattern) => request.url.includes(pattern));

  if (isApiRequest) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Statik dosyalar → Cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
});

// ─────────────────────────────────────────────
// Cache-First Stratejisi (Statik Dosyalar)
// ─────────────────────────────────────────────

/**
 * Önce önbelleğe bakar, yoksa ağdan alıp önbelleğe kaydeder.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Çevrimdışı: önbelleğe bakılmıştı, 404 döndür
    return new Response('Çevrimdışı — bu sayfa önbellekte yok.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// ─────────────────────────────────────────────
// Network-First Stratejisi (API Çağrıları)
// ─────────────────────────────────────────────

/**
 * Önce ağdan almaya çalışır (5s timeout).
 * Başarısız olursa önbellekteki eski veriyi döner.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirstStrategy(request) {
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    // Ağ hatası → önbellekten sun
    const cached = await caches.match(request);
    if (cached) {
      // İstemciye "eski veri" bildirimi gönder
      notifyClients({ type: 'STALE_DATA', url: request.url });
      return cached;
    }

    return new Response(JSON.stringify({ error: 'Çevrimdışı ve önbellekte yok' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─────────────────────────────────────────────
// Mesaj Yönetimi (İstemci ↔ SW)
// ─────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CACHE_URLS') {
    const { urls } = event.data;
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(urls))
    );
  }
});

/**
 * Tüm istemcilere mesaj gönderir.
 * @param {Object} message
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}
