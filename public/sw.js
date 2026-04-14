const CACHE_VERSION = "text2scratch-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}:shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}:runtime`;

const APP_SHELL_PATHS = [
  "./",
  "./index.html",
  "./docs.html",
  "./reference.html",
  "./converter.html",
  "./community.html",
  "./dashboard.html",
  "./login.html",
  "./signup.html",
  "./privacy.html",
  "./terms.html",
  "./license.html",
  "./confirm.html",
  "./site.webmanifest",
  "./favicon.ico",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./apple-touch-icon.png",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./offline.html",
  "./og-image.svg",
  "./vendor/scaffolding-min.js",
  "./data/blocks.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_PATHS.map((path) => new URL(path, self.registration.scope).toString()));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return caches.match(new URL("./offline.html", self.registration.scope).toString());
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    void refreshRuntimeCache(request);
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(request);
  }
}

async function refreshRuntimeCache(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response);
  } catch {
    // Ignore refresh failures and keep serving cached content.
  }
}
