export type TurnstileStatus = "idle" | "verified" | "expired" | "error" | "disabled" | "cached";

export interface TurnstileController {
  isRequired: boolean;
  getToken: () => string;
  reset: (options?: { clearCache?: boolean }) => void;
}

const TOKEN_CACHE_KEY = "text2scratch.turnstile.token";

export function getTurnstileScriptUrl() {
  return "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
}

export function saveCachedTurnstileToken(token: string) {
  if (!token) {
    return;
  }
  window.localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify({
    token,
    at: Date.now()
  }));
}

export function readCachedTurnstileToken(): string {
  try {
    const raw = window.localStorage.getItem(TOKEN_CACHE_KEY);
    if (!raw) {
      return "";
    }
    const { token, at } = JSON.parse(raw);
    if (Date.now() - at > 180000) { // 3 min cache
      clearCachedTurnstileToken();
      return "";
    }
    return String(token || "");
  } catch {
    return "";
  }
}

export function clearCachedTurnstileToken() {
  window.localStorage.removeItem(TOKEN_CACHE_KEY);
}

export function getInitialTurnstileStatus(): TurnstileStatus {
  return readCachedTurnstileToken() ? "cached" : "idle";
}
