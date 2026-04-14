type RequiredClientEnvKey =
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_PUBLISHABLE_KEY";

type OptionalClientEnvKey =
  | "VITE_TURNSTILE_SITE_KEY"
  | "VITE_HCAPTCHA_SITE_KEY"
  | "VITE_API_RATE_LIMIT_WINDOW_MS"
  | "VITE_API_RATE_LIMIT_MAX_REQUESTS";

function readEnv(key: RequiredClientEnvKey | OptionalClientEnvKey) {
  return String(import.meta.env[key] || "").trim();
}

export function readRequiredClientEnv(key: RequiredClientEnvKey) {
  const value = readEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function readOptionalClientEnv(key: RequiredClientEnvKey | OptionalClientEnvKey) {
  return readEnv(key);
}

export function readOptionalClientNumberEnv(key: OptionalClientEnvKey, fallback: number) {
  const rawValue = readEnv(key);
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function hasSupabaseClientEnv() {
  return Boolean(readEnv("VITE_SUPABASE_URL") && readEnv("VITE_SUPABASE_PUBLISHABLE_KEY"));
}

export const clientEnv = {
  get supabaseUrl() {
    return readRequiredClientEnv("VITE_SUPABASE_URL");
  },
  get supabasePublishableKey() {
    return readRequiredClientEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  },
  get turnstileSiteKey() {
    return readOptionalClientEnv("VITE_TURNSTILE_SITE_KEY");
  },
  get hcaptchaSiteKey() {
    return readOptionalClientEnv("VITE_HCAPTCHA_SITE_KEY");
  },
  get apiRateLimitWindowMs() {
    return readOptionalClientNumberEnv("VITE_API_RATE_LIMIT_WINDOW_MS", 60_000);
  },
  get apiRateLimitMaxRequests() {
    return readOptionalClientNumberEnv("VITE_API_RATE_LIMIT_MAX_REQUESTS", 12);
  }
};
