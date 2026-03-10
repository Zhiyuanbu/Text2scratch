import { getHcaptchaSiteKey } from "./supabase";

const CAPTCHA_CACHE_KEY = "text2scratch.hcaptcha.token";
const CAPTCHA_CACHE_MAX_AGE_MS = 20 * 60 * 1000;
const HCAPTCHA_SCRIPT_URL = "https://js.hcaptcha.com/1/api.js?render=explicit";

interface HcaptchaApi {
  render: (container: Element, options: Record<string, unknown>) => string | number;
  reset: (widgetId?: string | number) => void;
  remove?: (widgetId?: string | number) => void;
  getResponse: (widgetId?: string | number) => string;
}

declare global {
  interface Window {
    hcaptcha?: HcaptchaApi;
  }
}

export interface HcaptchaController {
  isRequired: boolean;
  getToken: () => string;
  reset: (options?: { clearCache?: boolean }) => void;
}

export type HcaptchaStatus = "idle" | "cached" | "verified" | "expired" | "error" | "disabled";

export function getHcaptchaScriptUrl() {
  return HCAPTCHA_SCRIPT_URL;
}

export function readCachedCaptchaToken() {
  try {
    const raw = window.localStorage.getItem(CAPTCHA_CACHE_KEY);
    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw);
    const token = String(parsed?.token || "").trim();
    const savedAt = Number(parsed?.savedAt || 0);
    if (!token || !Number.isFinite(savedAt)) {
      clearCachedCaptchaToken();
      return "";
    }

    if (Date.now() - savedAt > CAPTCHA_CACHE_MAX_AGE_MS) {
      clearCachedCaptchaToken();
      return "";
    }

    return token;
  } catch (_error) {
    clearCachedCaptchaToken();
    return "";
  }
}

export function saveCachedCaptchaToken(token: string) {
  const value = String(token || "").trim();
  if (!value) {
    return;
  }

  try {
    window.localStorage.setItem(CAPTCHA_CACHE_KEY, JSON.stringify({
      token: value,
      savedAt: Date.now()
    }));
  } catch (_error) {
    // Ignore storage failures.
  }
}

export function clearCachedCaptchaToken() {
  try {
    window.localStorage.removeItem(CAPTCHA_CACHE_KEY);
  } catch (_error) {
    // Ignore storage failures.
  }
}

export function getInitialCaptchaStatus(): HcaptchaStatus {
  if (!getHcaptchaSiteKey()) {
    return "disabled";
  }
  return readCachedCaptchaToken() ? "cached" : "idle";
}

export function isCaptchaError(error: unknown) {
  return /\bcaptcha\b/i.test(String((error as { message?: string } | null)?.message || ""));
}
