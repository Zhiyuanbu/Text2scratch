import {
  createSupabaseClient,
  formatSupabaseError,
  getConfirmPageUrl
} from "./supabase-client.js";

const ui = {
  guestView: document.getElementById("accountGuestView"),
  userView: document.getElementById("accountUserView"),
  userAvatar: document.getElementById("accountUserAvatar"),
  userDisplayName: document.getElementById("accountUserDisplayName"),
  userEmail: document.getElementById("accountUserEmail"),
  sendReset: document.getElementById("accountSendResetBtn"),
  signOut: document.getElementById("accountSignOutBtn"),
  deleteAccount: document.getElementById("accountDeleteBtn"),
  status: document.getElementById("accountStatus")
};
const CAPTCHA_CACHE_KEY = "text2scratch.hcaptcha.token";
const CAPTCHA_CACHE_MAX_AGE_MS = 20 * 60 * 1000;

let supabaseClient = null;
let currentUser = null;

init().catch((error) => {
  setStatus(`Startup error: ${formatSupabaseError(error)}`, "error");
});

async function init() {
  if (!ui.status) {
    return;
  }

  ui.status.classList.add("status-toast-mirror");

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error.message, "error");
    setActionsEnabled(false);
    return;
  }

  bindEvents();
  await refreshSessionState();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    renderAccountState();
  });
}

function bindEvents() {
  ui.sendReset?.addEventListener("click", onSendResetClick);
  ui.signOut?.addEventListener("click", onSignOutClick);
  ui.deleteAccount?.addEventListener("click", onDeleteAccountClick);
}

async function refreshSessionState() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(`Auth warning: ${formatSupabaseError(error)}`, "warning");
    return;
  }

  currentUser = data?.session?.user || null;
  renderAccountState();

  if (currentUser) {
    setStatus("Account loaded.", "success");
  } else {
    setStatus("Not signed in. Use Login or Sign Up below.", "info");
  }
}

function renderAccountState() {
  const signedIn = Boolean(currentUser);

  if (ui.guestView) {
    ui.guestView.hidden = signedIn;
  }
  if (ui.userView) {
    ui.userView.hidden = !signedIn;
  }

  if (!signedIn || !currentUser) {
    setActionsEnabled(false);
    return;
  }

  const displayName = getUserDisplayName(currentUser);
  const email = String(currentUser.email || "").trim();
  const avatar = buildAvatarText(displayName || email || "U");

  if (ui.userAvatar) {
    ui.userAvatar.textContent = avatar;
  }
  if (ui.userDisplayName) {
    ui.userDisplayName.textContent = displayName || "User";
  }
  if (ui.userEmail) {
    ui.userEmail.textContent = email || "No email";
  }

  setActionsEnabled(true);
}

async function onSendResetClick() {
  if (!ensureSignedIn()) {
    return;
  }

  const email = String(currentUser?.email || "").trim();
  if (!email) {
    setStatus("Current account has no email. Reset cannot be sent.", "warning");
    return;
  }

  setActionsEnabled(false);
  try {
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

    setStatus("Password reset email sent.", "success");
  } catch (error) {
    setStatus(`Password reset failed: ${formatSupabaseError(error)}`, "error");
  } finally {
    renderAccountState();
  }
}

async function onSignOutClick() {
  if (!supabaseClient) {
    return;
  }

  setActionsEnabled(false);
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }

    currentUser = null;
    renderAccountState();
    setStatus("Signed out.", "success");
  } catch (error) {
    setStatus(`Sign-out failed: ${formatSupabaseError(error)}`, "error");
    renderAccountState();
  }
}

async function onDeleteAccountClick() {
  if (!ensureSignedIn()) {
    return;
  }

  const confirmed = window.confirm("Delete your account and all cloud projects permanently?");
  if (!confirmed) {
    return;
  }

  setActionsEnabled(false);
  try {
    const { error } = await supabaseClient.rpc("delete_current_account");
    if (error) {
      throw error;
    }

    await supabaseClient.auth.signOut();
    currentUser = null;
    renderAccountState();
    setStatus("Account deleted.", "success");
  } catch (error) {
    setStatus(`Account deletion failed: ${formatSupabaseError(error)}`, "error");
    renderAccountState();
  }
}

function ensureSignedIn() {
  if (currentUser) {
    return true;
  }

  setStatus("Sign in first to manage account actions.", "warning");
  return false;
}

function setActionsEnabled(enabled) {
  [ui.sendReset, ui.signOut, ui.deleteAccount].forEach((button) => {
    if (button) {
      button.disabled = !enabled;
    }
  });
}

function setStatus(message, severity = "info") {
  if (!ui.status) {
    return;
  }

  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
  window.text2scratchToast?.show?.(message, severity);
}

function getUserDisplayName(user) {
  const fromMeta = String(user?.user_metadata?.username || "").trim();
  if (fromMeta) {
    return fromMeta;
  }

  const email = String(user?.email || "").trim();
  if (email.includes("@")) {
    return email.split("@")[0];
  }

  return "Profile";
}

function buildAvatarText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "?";
  }
  return text[0].toUpperCase();
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
