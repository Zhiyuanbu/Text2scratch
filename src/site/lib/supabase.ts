import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type { User };

export interface ProfileRecord {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ytsrvbrdxhyrazhnqohb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nY7QGrGczrV6Q9SEEcnuBQ_vAtCqUW0";
const TURNSTILE_SITE_KEY = "0x4AAAAAACxhNG0J87F16OOI";

export const CLOUD_TABLE = "projects";
export const SHARE_QUERY_PARAM = "share";

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export function createEphemeralSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: `text2scratch-ephemeral-${Date.now()}`
    }
  });
}

export function formatSupabaseError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message || "Unknown Supabase error");
  if (/relation .* does not exist/i.test(message)) {
    return "Supabase tables are missing. Run the project schema in SQL Editor first.";
  }
  if (/row-level security|permission denied/i.test(message)) {
    return "Supabase RLS blocked this request.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Invalid username, email, or password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Email not confirmed yet. Check your inbox before logging in.";
  }
  if (/captcha/i.test(message)) {
    return "Captcha verification failed. Complete captcha again, then retry.";
  }
  if (/resolve_login_email|is_username_available|delete_current_account/i.test(message)) {
    return "Supabase RPC functions are missing. Re-run the project schema in SQL Editor.";
  }
  if (/Username not found/i.test(message)) {
    return "Username not found.";
  }
  return message;
}

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,32}$/.test(value);
}

export function buildAvatarLabel(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "?";
}

export function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatDateTime(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function buildConfirmUrl(mode = "verify") {
  const url = buildAppPageUrl("confirm.html");
  url.searchParams.set("mode", mode);
  return url.toString();
}

export function buildLoginUrl(mode?: string) {
  const url = buildAppPageUrl("login.html");
  if (mode) {
    url.searchParams.set("mode", mode);
  }
  return url.toString();
}

export function buildShareUrl(slug: string) {
  const url = buildAppPageUrl("converter.html");
  url.searchParams.set(SHARE_QUERY_PARAM, slug);
  return url.toString();
}

export function getTurnstileSiteKey() {
  return TURNSTILE_SITE_KEY.trim();
}

export function getHcaptchaSiteKey() {
  return "a52804d0-570c-4f04-83d0-65b60e3a93c2";
}

function buildAppPageUrl(pageName: string) {
  const basePath = window.location.pathname.split("/").slice(0, -1).join("/") + "/";
  return new URL(pageName, `${window.location.origin}${basePath}`);
}
