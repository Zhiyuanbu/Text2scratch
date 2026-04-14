import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_PUBLISHABLE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

// Optional: set this if Supabase Bot Detection (hCaptcha) is enabled.
// Leave empty to disable captcha widget in signup UI.
const HCAPTCHA_SITE_KEY = String(import.meta.env.VITE_HCAPTCHA_SITE_KEY || "").trim();

export const CLOUD_TABLE = "projects";
export const SHARE_QUERY_PARAM = "share";
const AUTH_REQUEST_TIMEOUT_MS = 8_000;

export function createSupabaseClient() {
  if (!SUPABASE_URL) {
    throw new Error("Supabase URL is missing.");
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase publishable key is missing.");
  }
  if (!SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") && !SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ")) {
    throw new Error("Supabase key format looks invalid. Use publishable (or anon) key.");
  }

  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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

export function getHomePageUrl() {
  return new URL("index.html", window.location.href).toString();
}

export function getConverterPageUrl() {
  return new URL("converter.html", window.location.href).toString();
}

export function getIndexPageUrl() {
  return getHomePageUrl();
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
  const url = new URL(getConverterPageUrl());
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
  if (/resolve_login_email|is_username_available|delete_current_account|admin_list_projects|admin_restrict_account|admin_network_ban/i.test(message)) {
    return "Supabase RPC functions are missing. Apply supabase/schema.sql in Supabase SQL Editor.";
  }
  return message;
}

export async function signOutSupabaseSession(client) {
  const globalResult = await withTimeout(
    client.auth.signOut({ scope: "global" }),
    AUTH_REQUEST_TIMEOUT_MS,
    "Global sign-out timed out."
  );
  if (!globalResult.error) {
    return { mode: "global", warning: "" };
  }

  const primaryMessage = formatSupabaseError(globalResult.error);
  const localResult = await withTimeout(
    client.auth.signOut({ scope: "local" }),
    AUTH_REQUEST_TIMEOUT_MS,
    "Local sign-out timed out."
  );
  if (localResult.error) {
    throw new Error(primaryMessage);
  }

  return {
    mode: "local",
    warning: `Global sign-out failed, but the local session was cleared. ${primaryMessage}`
  };
}

export function isMissingRowError(error) {
  return String(error?.code || "") === "PGRST116" || /0 rows/i.test(String(error?.message || ""));
}

export function isDuplicateError(error) {
  return String(error?.code || "") === "23505" || /duplicate key/i.test(String(error?.message || ""));
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}
