const CACHE = "ai-learning-planner-v1"
const ASSETS = ["/", "/manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS)
    }),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  // Only GET
  if (req.method !== "GET") return
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches
            .open(CACHE)
            .then((cache) => cache.put(req, copy))
            .catch(() => {})
          return res
        })
        .catch(() => cached)
    }),
  )
})
