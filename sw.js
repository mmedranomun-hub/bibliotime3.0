// Sube este número cada vez que quieras forzar a los usuarios a coger la versión nueva.
const CACHE_NAME = "bibliotime-v58";
// Librerías del CDN con versión fija en la URL (leaflet@1.9.4…): nunca cambian, así que se guardan en
// una caché aparte que no se borra al subir CACHE_NAME (cada versión nueva de la app no las vuelve a bajar).
const CDN_CACHE = "bibliotime-cdn-v1";
const CDN_FIJO = /^https:\/\/(unpkg\.com|cdn\.jsdelivr\.net)\/(npm\/)?[^/@]+@\d+\.\d+\.\d+\//;
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./bibliotecas-espana.js",
  "./temporada-examenes.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(APP_SHELL); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME && k !== CDN_CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Cache-first con refresco en segundo plano para lo propio de la app (HTML/CSS/JS/iconos).
// Lo demás de otros orígenes (Supabase, fuentes, teselas del mapa) pasa directo a la red:
// esos datos tienen que ser siempre frescos, nunca servidos desde caché.
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  if (CDN_FIJO.test(req.url)) {
    event.respondWith(
      caches.open(CDN_CACHE).then(function (cache) {
        return cache.match(req).then(function (cached) {
          return cached || fetch(req).then(function (res) {
            // Los <script> sin crossorigin llegan como respuesta "opaca" (status 0): también se guardan.
            if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var networkFetch = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || networkFetch;
    })
  );
});
