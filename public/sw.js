const CACHE_VERSION = "flutter-films-shell-v4";
const SHELL_URLS = ["/", "/offline", "/install"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isPrivateRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/account") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup")
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest")
  );
}

/** Next.js flight/RSC and dev tooling must bypass the offline HTML fallback. */
function isPassthroughRequest(url, request) {
  if (url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/_next/static/")) return true;
  if (request.headers.get("RSC")) return true;
  if (request.headers.get("Next-Router-Prefetch")) return true;
  if (request.headers.get("Next-Router-State-Tree")) return true;
  return false;
}

function isDocumentNavigation(request) {
  return request.mode === "navigate";
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivateRequest(url)) return;
  if (isPassthroughRequest(url, event.request)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(event.request).then((cached) => {
          const network = fetch(event.request)
            .then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached ?? network;
        }),
      ),
    );
    return;
  }

  // Only full page loads may fall back to the offline shell.
  // Client-side Next.js navigations use RSC fetches and must not receive HTML.
  if (!isDocumentNavigation(event.request)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          void caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached ?? caches.match("/offline")),
      ),
  );
});
