/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_HCAPTCHA_SITE_KEY?: string;
  readonly VITE_API_RATE_LIMIT_WINDOW_MS?: string;
  readonly VITE_API_RATE_LIMIT_MAX_REQUESTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
