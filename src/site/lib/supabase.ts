import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { clientEnv, hasSupabaseClientEnv, readOptionalClientEnv } from "./env";

export type { User };

export interface ProfileRecord {
  id: string;
  username: string;
  email: string;
  is_banned?: boolean;
  banned_reason?: string | null;
  banned_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

const SUPABASE_URL = readOptionalClientEnv("VITE_SUPABASE_URL") || "https://example.invalid";
const SUPABASE_PUBLISHABLE_KEY =
  readOptionalClientEnv("VITE_SUPABASE_PUBLISHABLE_KEY") || "sb_publishable_placeholder";

export const isSupabaseConfigured = hasSupabaseClientEnv();
export const SUPABASE_CONFIG_ERROR_MESSAGE =
  "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.";

export const CLOUD_TABLE = "projects";
export const SHARE_QUERY_PARAM = "share";
export const AUTH_STATE_EVENT_NAME = "text2scratch.auth.changed";
const AUTH_REQUEST_TIMEOUT_MS = 8_000;

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export function createEphemeralSupabaseClient() {
  ensureSupabaseConfigured();
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
  if (/supabase environment variables are missing/i.test(message)) {
    return SUPABASE_CONFIG_ERROR_MESSAGE;
  }
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
  if (/resolve_login_email|is_username_available|delete_current_account|admin_list_projects|admin_restrict_account|admin_network_ban|is_network_banned/i.test(message)) {
    return "Supabase RPC functions are missing. Apply supabase/schema.sql in Supabase SQL Editor.";
  }
  if (/Username not found/i.test(message)) {
    return "Username not found.";
  }
  return message;
}

export function dispatchAuthStateEvent(state: "signed_in" | "signed_out") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT_NAME, {
    detail: {
      state,
      emittedAt: new Date().toISOString()
    }
  }));
}

export async function signOutSupabaseSession(client: SupabaseClient = supabaseClient) {
  ensureSupabaseConfigured();

  const globalResult = await withTimeout(
    client.auth.signOut({ scope: "global" }),
    AUTH_REQUEST_TIMEOUT_MS,
    "Global sign-out timed out."
  );
  if (!globalResult.error) {
    dispatchAuthStateEvent("signed_out");
    return { mode: "global" as const, warning: "" };
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

  dispatchAuthStateEvent("signed_out");
  return {
    mode: "local" as const,
    warning: `Global sign-out failed, but the local session was cleared. ${primaryMessage}`
  };
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
  return clientEnv.turnstileSiteKey;
}

export function getHcaptchaSiteKey() {
  return clientEnv.hcaptchaSiteKey;
}

export function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR_MESSAGE);
  }
}

function buildAppPageUrl(pageName: string) {
  const basePath = window.location.pathname.split("/").slice(0, -1).join("/") + "/";
  return new URL(pageName, `${window.location.origin}${basePath}`);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
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
