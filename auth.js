import {
  createSupabaseClient,
  formatSupabaseError,
  getHcaptchaSiteKey,
  getIndexPageUrl,
  getLoginPageUrl
} from "./supabase-client.js";

const ui = {
  form: document.getElementById("authForm"),
  loginIdentifier: document.getElementById("authLoginInput"),
  username: document.getElementById("authUsernameInput"),
  email: document.getElementById("authEmailInput"),
  password: document.getElementById("authPasswordInput"),
  confirm: document.getElementById("authConfirmPasswordInput"),
  submit: document.getElementById("authSubmitBtn"),
  status: document.getElementById("authStatus"),
  hcaptchaMount: document.getElementById("hcaptchaMount"),
  hcaptchaHint: document.getElementById("hcaptchaHint"),
  resetForm: document.getElementById("resetForm"),
  resetIdentifier: document.getElementById("resetIdentifierInput"),
  resetSubmit: document.getElementById("resetSubmitBtn"),
  resetBack: document.getElementById("resetBackBtn"),
  showResetPanel: document.getElementById("showResetPanelBtn"),
  recoveryForm: document.getElementById("recoveryForm"),
  recoveryPassword: document.getElementById("recoveryPasswordInput"),
  recoveryConfirm: document.getElementById("recoveryConfirmInput"),
  recoverySubmit: document.getElementById("recoverySubmitBtn"),
  authLinkRow: document.getElementById("authLinkRow")
};

const mode = document.body?.dataset?.authMode === "signup" ? "signup" : "login";

let supabaseClient = null;
let hcaptchaWidgetId = null;
let hcaptchaRequired = false;
let activeLoginPanel = "login";

init().catch((error) => {
  setStatus(`Startup error: ${error.message}`, "error");
});

async function init() {
  if (!ui.form || !ui.password || !ui.submit || !ui.status) {
    return;
  }

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error.message, "error");
    setFormEnabled(false);
    return;
  }

  const urlAuthState = await handleAuthActionFromUrl();

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(`Auth warning: ${formatSupabaseError(error)}`, "warning");
  }

  const currentUser = data?.session?.user || null;
  if (currentUser && mode === "login" && !urlAuthState.handled) {
    const currentEmail = String(currentUser.email || "").trim();
    if (currentEmail) {
      setStatus(`Already signed in as ${currentEmail}.`, "success");
    }
  }

  await initHcaptchaIfEnabled();
  bindEventHandlers();
  applyInitialViewMode(urlAuthState.panel);
  showQueryFeedback(urlAuthState.handled);
}

function bindEventHandlers() {
  ui.form.addEventListener("submit", onPrimarySubmit);

  if (mode === "login") {
    ui.showResetPanel?.addEventListener("click", () => setLoginPanel("reset"));
    ui.resetBack?.addEventListener("click", () => setLoginPanel("login"));
    ui.resetForm?.addEventListener("submit", onResetSubmit);
    ui.recoveryForm?.addEventListener("submit", onRecoverySubmit);
  }
}

function applyInitialViewMode(panelOverride = "") {
  if (mode !== "login") {
    return;
  }

  if (panelOverride === "login" || panelOverride === "reset" || panelOverride === "recovery") {
    setLoginPanel(panelOverride);
    return;
  }

  if (isRecoverySession()) {
    setLoginPanel("recovery");
    setStatus("Set a new password to finish recovery.", "warning");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "reset") {
    setLoginPanel("reset");
    return;
  }

  setLoginPanel("login");
}

function setLoginPanel(panel) {
  activeLoginPanel = panel;

  if (ui.form) {
    ui.form.hidden = panel !== "login";
  }
  if (ui.resetForm) {
    ui.resetForm.hidden = panel !== "reset";
  }
  if (ui.recoveryForm) {
    ui.recoveryForm.hidden = panel !== "recovery";
  }
  if (ui.authLinkRow) {
    ui.authLinkRow.hidden = panel === "recovery";
  }
}

function isRecoverySession() {
  const search = new URLSearchParams(window.location.search);
  const hash = String(window.location.hash || "");
  return search.get("mode") === "recovery"
    || search.get("type") === "recovery"
    || hash.includes("type=recovery");
}

async function handleAuthActionFromUrl() {
  if (mode !== "login" || !supabaseClient) {
    return { panel: null, handled: false };
  }

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
  const tokenHash = String(search.get("token_hash") || "").trim();
  const authCode = String(search.get("code") || "").trim();
  const actionType = normalizeOtpType(search.get("type") || hash.get("type"));

  if (tokenHash && actionType) {
    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        token_hash: tokenHash,
        type: actionType
      });
      if (error) {
        throw error;
      }

      clearAuthUrlState();
      if (actionType === "recovery") {
        setStatus("Recovery link verified. Set your new password below.", "warning");
        return { panel: "recovery", handled: true };
      }

      setStatus("Email verified. You can now sign in.", "success");
      return { panel: "login", handled: true };
    } catch (error) {
      setStatus(`Verification failed: ${formatSupabaseError(error)}`, "error");
      return { panel: "login", handled: true };
    }
  }

  if (authCode) {
    try {
      const { error } = await supabaseClient.auth.exchangeCodeForSession(authCode);
      if (error) {
        throw error;
      }

      clearAuthUrlState();
      if (actionType === "recovery" || search.get("mode") === "recovery") {
        setStatus("Recovery link verified. Set your new password below.", "warning");
        return { panel: "recovery", handled: true };
      }

      setStatus("Email verified. You can now sign in.", "success");
      return { panel: "login", handled: true };
    } catch (error) {
      setStatus(`Verification failed: ${formatSupabaseError(error)}`, "error");
      return { panel: "login", handled: true };
    }
  }

  if (actionType === "recovery" || search.get("mode") === "recovery") {
    return { panel: "recovery", handled: false };
  }

  return { panel: null, handled: false };
}

function normalizeOtpType(value) {
  const type = String(value || "").trim().toLowerCase();
  if (type === "signup" || type === "recovery" || type === "invite" || type === "email" || type === "email_change") {
    return type;
  }
  return "";
}

function clearAuthUrlState() {
  const url = new URL(window.location.href);
  const searchKeys = [
    "token_hash",
    "type",
    "code",
    "mode",
    "access_token",
    "refresh_token",
    "expires_at",
    "expires_in",
    "token_type"
  ];

  searchKeys.forEach((key) => {
    url.searchParams.delete(key);
  });

  const hashParams = new URLSearchParams(String(url.hash || "").replace(/^#/, ""));
  let hashChanged = false;
  searchKeys.forEach((key) => {
    if (hashParams.has(key)) {
      hashParams.delete(key);
      hashChanged = true;
    }
  });

  if (hashChanged) {
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
  } else if (String(url.hash || "").includes("access_token=") || String(url.hash || "").includes("refresh_token=")) {
    url.hash = "";
  }

  window.history.replaceState({}, "", url.toString());
}

async function onPrimarySubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("Supabase client is not ready.", "error");
    return;
  }

  setFormEnabled(false);
  try {
    if (mode === "signup") {
      await handleSignUp();
    } else if (activeLoginPanel === "login") {
      await handleSignIn();
    } else {
      setStatus("Select the correct auth panel before submitting.", "warning");
    }
  } catch (error) {
    setStatus(`Auth failed: ${formatSupabaseError(error)}`, "error");
    resetCaptcha();
  } finally {
    setFormEnabled(true);
  }
}

async function handleSignIn() {
  const identifier = String(ui.loginIdentifier?.value || "").trim();
  const password = String(ui.password?.value || "");

  if (!identifier) {
    setStatus("Enter username or email.", "warning");
    return;
  }
  if (password.length < 6) {
    setStatus("Password must be at least 6 characters.", "warning");
    return;
  }

  const payload = {
    email: await resolveEmailFromIdentifier(identifier),
    password
  };

  if (hcaptchaRequired) {
    const token = getHcaptchaToken();
    if (!token) {
      setStatus("Complete the captcha before signing in.", "warning");
      return;
    }
    payload.options = { captchaToken: token };
  }

  const { error } = await supabaseClient.auth.signInWithPassword(payload);
  if (error) {
    setStatus(`Sign-in failed: ${formatSupabaseError(error)}`, "error");
    resetCaptcha();
    return;
  }

  if (ui.password) {
    ui.password.value = "";
  }
  setStatus("Signed in. Redirecting to converter...", "success");
  window.location.href = getIndexPageUrl();
}

async function handleSignUp() {
  const username = normalizeUsername(ui.username?.value || "");
  const email = String(ui.email?.value || "").trim().toLowerCase();
  const password = String(ui.password?.value || "");
  const confirmPassword = String(ui.confirm?.value || "");

  if (!isValidUsername(username)) {
    setStatus("Username must be 3-32 chars: letters, numbers, underscores.", "warning");
    return;
  }
  if (!email.includes("@")) {
    setStatus("Enter a valid email address.", "warning");
    return;
  }
  if (password.length < 6) {
    setStatus("Password must be at least 6 characters.", "warning");
    return;
  }
  if (confirmPassword !== password) {
    setStatus("Password and confirmation must match.", "warning");
    return;
  }

  const available = await isUsernameAvailable(username);
  if (!available) {
    setStatus("Username is already taken.", "warning");
    return;
  }

  const options = {
    emailRedirectTo: `${getLoginPageUrl()}?mode=login`,
    data: { username }
  };

  if (hcaptchaRequired) {
    const token = getHcaptchaToken();
    if (!token) {
      setStatus("Complete the captcha before signing up.", "warning");
      return;
    }
    options.captchaToken = token;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options
  });

  if (error) {
    setStatus(`Sign-up failed: ${formatSupabaseError(error)}`, "error");
    resetCaptcha();
    return;
  }

  ui.password.value = "";
  if (ui.confirm) {
    ui.confirm.value = "";
  }

  window.text2scratchRum?.trackAccountCreated({ method: "username_password" });

  if (data?.session?.user) {
    setStatus("Account created and signed in. Redirecting...", "success");
    window.location.href = getIndexPageUrl();
    return;
  }

  setStatus("Account created. Check your email, then log in.", "success");
  resetCaptcha();
}

async function onResetSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("Supabase client is not ready.", "error");
    return;
  }

  const identifier = String(ui.resetIdentifier?.value || "").trim();
  if (!identifier) {
    setStatus("Enter username or email.", "warning");
    return;
  }

  setFormEnabled(false);
  try {
    const email = await resolveEmailFromIdentifier(identifier);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${getLoginPageUrl()}?mode=recovery`
    });
    if (error) {
      throw error;
    }

    setStatus("Password reset email sent. Check inbox/spam.", "success");
  } catch (error) {
    setStatus(`Reset failed: ${formatSupabaseError(error)}`, "error");
  } finally {
    setFormEnabled(true);
  }
}

async function onRecoverySubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("Supabase client is not ready.", "error");
    return;
  }

  const password = String(ui.recoveryPassword?.value || "");
  const confirm = String(ui.recoveryConfirm?.value || "");
  if (password.length < 6) {
    setStatus("New password must be at least 6 characters.", "warning");
    return;
  }
  if (password !== confirm) {
    setStatus("New password confirmation must match.", "warning");
    return;
  }

  setFormEnabled(false);
  try {
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      throw error;
    }

    setStatus("Password updated. You can now sign in.", "success");
    if (ui.recoveryPassword) {
      ui.recoveryPassword.value = "";
    }
    if (ui.recoveryConfirm) {
      ui.recoveryConfirm.value = "";
    }

    clearAuthUrlState();
    setLoginPanel("login");
  } catch (error) {
    setStatus(`Password update failed: ${formatSupabaseError(error)}`, "error");
  } finally {
    setFormEnabled(true);
  }
}

async function resolveEmailFromIdentifier(identifier) {
  const value = String(identifier || "").trim();
  if (!value) {
    throw new Error("Missing username or email.");
  }

  if (value.includes("@")) {
    return value.toLowerCase();
  }

  const normalized = normalizeUsername(value);
  if (!normalized) {
    throw new Error("Invalid username.");
  }

  const { data, error } = await supabaseClient.rpc("resolve_login_email", {
    login_identifier: normalized
  });

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Username not found.");
  }

  return String(data).toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function isValidUsername(value) {
  return /^[a-z0-9_]{3,32}$/.test(String(value || ""));
}

async function isUsernameAvailable(username) {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return false;
  }

  const { data, error } = await supabaseClient.rpc("is_username_available", {
    candidate_username: normalized
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function initHcaptchaIfEnabled() {
  const siteKey = getHcaptchaSiteKey();
  hcaptchaRequired = siteKey.length > 0;

  if (!ui.hcaptchaMount || !ui.hcaptchaHint) {
    return;
  }

  if (!hcaptchaRequired) {
    ui.hcaptchaHint.textContent = "Captcha is not configured in frontend. Set HCAPTCHA_SITE_KEY in supabase-client.js to enable it.";
    return;
  }

  ui.hcaptchaHint.textContent = mode === "signup"
    ? "Complete captcha before creating an account."
    : "Complete captcha before signing in.";

  try {
    await waitForHcaptcha();
    hcaptchaWidgetId = window.hcaptcha.render(ui.hcaptchaMount, {
      sitekey: siteKey
    });
  } catch (_error) {
    setStatus("hCaptcha failed to load. Check your site key and allowed domain.", "warning");
  }
}

function getHcaptchaToken() {
  if (typeof window.hcaptcha === "object" && hcaptchaWidgetId !== null) {
    return String(window.hcaptcha.getResponse(hcaptchaWidgetId) || "").trim();
  }

  const fallback = document.querySelector("textarea[name='h-captcha-response']");
  return String(fallback?.value || "").trim();
}

function resetCaptcha() {
  if (typeof window.hcaptcha === "object" && hcaptchaWidgetId !== null) {
    window.hcaptcha.reset(hcaptchaWidgetId);
  }
}

function waitForHcaptcha() {
  return new Promise((resolve, reject) => {
    const timeoutAt = Date.now() + 8000;

    const poll = () => {
      if (typeof window.hcaptcha === "object" && typeof window.hcaptcha.render === "function") {
        resolve();
        return;
      }

      if (Date.now() > timeoutAt) {
        reject(new Error("hCaptcha timeout"));
        return;
      }

      window.setTimeout(poll, 100);
    };

    poll();
  });
}

function setFormEnabled(enabled) {
  const nodes = [
    ui.form,
    ui.resetForm,
    ui.recoveryForm
  ].filter(Boolean);

  nodes.forEach((formNode) => {
    [...formNode.querySelectorAll("input,button")].forEach((field) => {
      field.disabled = !enabled;
    });
  });
}

function setStatus(message, severity = "info") {
  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
}

function showQueryFeedback(skip = false) {
  if (skip) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("signup") === "success") {
    setStatus("Account created. Check your email to confirm, then log in.", "success");
  } else if (params.get("signed_out") === "1") {
    setStatus("Signed out.", "success");
  }

  if (mode === "login" && params.get("mode") === "login") {
    setStatus("Use this page to log in after email verification.", "info");
  }
}
