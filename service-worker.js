const CACHE_NAME = 'scheduler-v4';
const ASSETS = [
  '/nai-com-s-schedule/',
  '/nai-com-s-schedule/index.html',
  '/nai-com-s-schedule/style.css?v=1.2',
  '/nai-com-s-schedule/app.js?v=1.2',
  '/nai-com-s-schedule/firebase-sync.js?v=1.0',
  '/nai-com-s-schedule/manifest.json',
  '/nai-com-s-schedule/icon-192.png',
  '/nai-com-s-schedule/icon-512.png'
];

// 설치 시 리소스 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 리소스 요청 시 네트워크 우선 + 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크 응답을 캐시에 저장
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 제공
        return caches.match(event.request);
      })
  );
});
