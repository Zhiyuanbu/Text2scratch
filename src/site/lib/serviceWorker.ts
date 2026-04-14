export function registerServiceWorker() {
  if (import.meta.env.DEV || typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}
