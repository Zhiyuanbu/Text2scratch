const SUPABASE_URL = "https://ytsrvbrdxhyrazhnqohb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nY7QGrGczrV6Q9SEEcnuBQ_vAtCqUW0";

// Optional: set this if Supabase Bot Detection (hCaptcha) is enabled.
// Leave empty to disable captcha widget in signup UI.
const HCAPTCHA_SITE_KEY = "a52804d0-570c-4f04-83d0-65b60e3a93c2";

export const CLOUD_TABLE = "projects";
export const SHARE_QUERY_PARAM = "share";

export function createSupabaseClient() {
  const supabaseGlobal = window.supabase;
  if (!supabaseGlobal || typeof supabaseGlobal.createClient !== "function") {
    throw new Error("Supabase SDK failed to load.");
  }

  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase publishable key is missing.");
  }
  if (!SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") && !SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ")) {
    throw new Error("Supabase key format looks invalid. Use publishable (or anon) key.");
  }

  return supabaseGlobal.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export function getHcaptchaSiteKey() {
  return HCAPTCHA_SITE_KEY.trim();
}

export function getIndexPageUrl() {
  return new URL("index.html", window.location.href).toString();
}

export function getLoginPageUrl() {
  return new URL("login.html", window.location.href).toString();
}

export function getConfirmPageUrl() {
  return new URL("confirm.html", window.location.href).toString();
}

export function getSignupPageUrl() {
  return new URL("signup.html", window.location.href).toString();
}

export function buildShareUrl(slug) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_QUERY_PARAM, slug);
  return url.toString();
}

export function formatSupabaseError(error) {
  const message = String(error?.message || "Unknown Supabase error");
  if (/relation .* does not exist/i.test(message)) {
    return `Table "${CLOUD_TABLE}" is missing. Run supabase-schema.sql in Supabase SQL Editor.`;
  }
  if (/row-level security|permission denied/i.test(message)) {
    return "RLS policy blocked this request. Check your Supabase policies.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Invalid username/email or password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Email not confirmed yet. Check your inbox.";
  }
  if (/captcha/i.test(message)) {
    return "Captcha verification failed. Complete captcha again, then retry.";
  }
  if (/No API key found in request/i.test(message)) {
    return "Supabase API key missing on request. Verify publishable key and SDK loading.";
  }
  if (/resolve_login_email|is_username_available|delete_current_account/i.test(message)) {
    return "Supabase RPC functions are missing. Re-run supabase-schema.sql in SQL Editor.";
  }
  return message;
}

export function isMissingRowError(error) {
  return String(error?.code || "") === "PGRST116" || /0 rows/i.test(String(error?.message || ""));
}

export function isDuplicateError(error) {
  return String(error?.code || "") === "23505" || /duplicate key/i.test(String(error?.message || ""));
}
