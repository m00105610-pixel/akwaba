/* Fonctionnement hors connexion : le jeu et les polices sont gardés en mémoire après la première visite. */
var CACHE = "akwaba-v1";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var same = url.origin === location.origin;
  var font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (x) { x.put("index.html", c); }); return r; })
        .catch(function () { return caches.match("index.html"); })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req)
        .then(function (r) {
          if (r && (r.ok || r.type === "opaque")) { var c = r.clone(); caches.open(CACHE).then(function (x) { x.put(req, c); }); }
          return r;
        })
        .catch(function () { return hit; });
      return hit || net;
    })
  );
});
