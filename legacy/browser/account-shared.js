import {
  createSupabaseClient,
  formatSupabaseError,
  getConfirmPageUrl,
  isMissingRowError
} from "./supabase-client.js";

export {
  createSupabaseClient,
  formatSupabaseError
};

const CAPTCHA_CACHE_KEY = "text2scratch.hcaptcha.token";
const CAPTCHA_CACHE_MAX_AGE_MS = 20 * 60 * 1000;
const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

export async function getSessionUser(supabaseClient) {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    throw error;
  }
  return data?.session?.user || null;
}

export async function getProfileRecord(supabaseClient, user) {
  if (!supabaseClient || !user?.id) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, email, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return data || null;
  }

  if (isMissingRowError(error) || /relation .* does not exist/i.test(String(error.message || ""))) {
    return null;
  }

  throw error;
}

export async function canUseUsername(supabaseClient, candidateUsername, currentUsername = "") {
  const normalized = normalizeUsername(candidateUsername);
  if (!normalized) {
    return false;
  }

  if (normalized === normalizeUsername(currentUsername)) {
    return true;
  }

  const { data, error } = await supabaseClient.rpc("is_username_available", {
    candidate_username: normalized
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function updateUserProfile(supabaseClient, user, updates) {
  const username = normalizeUsername(updates?.username);
  if (!isValidUsername(username)) {
    throw new Error("Username must be 3 to 32 characters using lowercase letters, numbers, or underscores.");
  }

  const { error: authError } = await supabaseClient.auth.updateUser({
    data: {
      username
    }
  });

  if (authError) {
    throw authError;
  }

  const payload = {
    id: user.id,
    username,
    email: String(user.email || "").trim().toLowerCase()
  };

  const { data, error } = await supabaseClient
    .from("profiles")
    .upsert(payload, {
      onConflict: "id"
    })
    .select("id, username, email, created_at, updated_at")
    .maybeSingle();

  if (error) {
    if (/relation .* does not exist/i.test(String(error.message || ""))) {
      return payload;
    }
    throw error;
  }

  return data || payload;
}

export async function sendPasswordResetForCurrentUser(supabaseClient, user) {
  const email = String(user?.email || "").trim();
  if (!email) {
    throw new Error("Current account has no email. Reset cannot be sent.");
  }

  const options = {
    redirectTo: `${getConfirmPageUrl()}?mode=recovery`
  };

  const cachedCaptchaToken = readCachedCaptchaToken();
  if (cachedCaptchaToken) {
    options.captchaToken = cachedCaptchaToken;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, options);
  if (error) {
    throw error;
  }
}

export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
}

export function isValidUsername(value) {
  return USERNAME_PATTERN.test(String(value || "").trim());
}

export function getUserDisplayName(user, profile = null) {
  const profileName = String(profile?.username || "").trim();
  if (profileName) {
    return profileName;
  }

  const metadataName = String(user?.user_metadata?.username || "").trim();
  if (metadataName) {
    return metadataName;
  }

  const email = String(user?.email || "").trim();
  if (email.includes("@")) {
    return email.split("@")[0];
  }

  return "Profile";
}

export function getUserEmail(user, profile = null) {
  const email = String(profile?.email || user?.email || "").trim();
  return email || "No email";
}

export function buildAvatarText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "?";
  }
  return text[0].toUpperCase();
}

export function formatDate(value) {
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

export function formatDateTime(value) {
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

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "true");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
  return Promise.resolve();
}

function readCachedCaptchaToken() {
  try {
    const raw = window.localStorage.getItem(CAPTCHA_CACHE_KEY);
    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw);
    const token = String(parsed?.token || "").trim();
    const savedAt = Number(parsed?.savedAt || 0);
    if (!token || !Number.isFinite(savedAt)) {
      return "";
    }

    if (Date.now() - savedAt > CAPTCHA_CACHE_MAX_AGE_MS) {
      return "";
    }

    return token;
  } catch (_error) {
    return "";
  }
}
