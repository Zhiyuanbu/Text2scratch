import {
  createSupabaseClient,
  formatSupabaseError,
  getLoginPageUrl
} from "../supabase-client.js";

type Severity = "info" | "success" | "warning" | "error";

interface ConfirmAction {
  tokenHash: string;
  authCode: string;
  actionType: string;
  modeHint: "recovery" | "login" | "";
}

const REDIRECT_DELAY_MS = 1350;
const OTP_TYPES = new Set(["signup", "recovery", "invite", "email", "email_change", "magiclink"]);

const ui = {
  status: document.getElementById("confirmStatus") as HTMLParagraphElement | null,
  loginLink: document.getElementById("confirmLoginLink") as HTMLAnchorElement | null,
  signupLink: document.getElementById("confirmSignupLink") as HTMLAnchorElement | null,
  resetForm: document.getElementById("confirmResetForm") as HTMLFormElement | null,
  password: document.getElementById("confirmPassword") as HTMLInputElement | null,
  passwordConfirm: document.getElementById("confirmPasswordConfirm") as HTMLInputElement | null,
  submit: document.getElementById("confirmResetSubmit") as HTMLButtonElement | null
};

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;
let recoveryReady = false;

void init().catch((error) => {
  setStatus(`Startup error: ${formatSupabaseError(error)}`, "error");
});

async function init() {
  if (!ui.status) {
    return;
  }

  if (ui.loginLink) {
    ui.loginLink.href = getLoginPageUrl();
  }
  if (ui.signupLink) {
    ui.signupLink.href = new URL("signup.html", window.location.href).toString();
  }
  ui.resetForm?.addEventListener("submit", onResetSubmit);

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Supabase setup failed.", "error");
    setResetFormVisible(false);
    return;
  }

  const action = parseActionFromUrl();
  if (!action.tokenHash && !action.authCode) {
    if (action.modeHint === "recovery" && await hasRecoverySession()) {
      showRecoveryForm();
      return;
    }

    setStatus("This confirmation link is incomplete. Request a fresh email and try again.", "warning");
    return;
  }

  try {
    const result = await completeAuthAction(action);
    const resolvedType = result.type || action.modeHint || "";
    clearVerificationParams(action.modeHint);

    if (resolvedType === "recovery") {
      showRecoveryForm();
      return;
    }

    setStatus("Email verified successfully. Redirecting to login...", "success");
    redirectToLogin("login", {
      verified: "1"
    });
  } catch (error) {
    setStatus(`Verification failed: ${formatSupabaseError(error)}`, "error");
    setResetFormVisible(false);
  }
}

async function onResetSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (!supabaseClient || !recoveryReady || !ui.password || !ui.passwordConfirm || !ui.submit) {
    setStatus("Recovery session is not ready yet.", "warning");
    return;
  }

  const password = ui.password.value;
  const confirmation = ui.passwordConfirm.value;
  if (password.length < 6) {
    setStatus("New password must be at least 6 characters.", "warning");
    return;
  }
  if (password !== confirmation) {
    setStatus("New password confirmation must match.", "warning");
    return;
  }

  setResetPending(true);
  try {
    const { error } = await supabaseClient.auth.updateUser({
      password
    });
    if (error) {
      throw error;
    }

    await supabaseClient.auth.signOut();
    ui.password.value = "";
    ui.passwordConfirm.value = "";
    recoveryReady = false;
    setResetFormVisible(false);
    setStatus("Password updated. Redirecting to login...", "success");
    redirectToLogin("login", {
      updated: "1"
    });
  } catch (error) {
    setStatus(`Password update failed: ${formatSupabaseError(error)}`, "error");
  } finally {
    setResetPending(false);
  }
}

function parseActionFromUrl(): ConfirmAction {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));

  return {
    tokenHash: String(search.get("token_hash") || hash.get("token_hash") || "").trim(),
    authCode: String(search.get("code") || hash.get("code") || "").trim(),
    actionType: normalizeOtpType(search.get("type") || hash.get("type")),
    modeHint: normalizeMode(search.get("mode") || hash.get("mode"))
  };
}

async function completeAuthAction(action: ConfirmAction) {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  if (action.authCode) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(action.authCode);
    if (error) {
      throw error;
    }
    return { type: action.actionType || action.modeHint || "" };
  }

  const candidateTypes = buildCandidateOtpTypes(action.actionType, action.modeHint);
  let lastError: unknown = null;

  for (const type of candidateTypes) {
    const { error } = await supabaseClient.auth.verifyOtp({
      token_hash: action.tokenHash,
      type
    });

    if (!error) {
      return { type };
    }

    lastError = error;
  }

  throw lastError || new Error("Unable to verify this confirmation link.");
}

function buildCandidateOtpTypes(actionType: string, modeHint: ConfirmAction["modeHint"]) {
  if (actionType) {
    return [actionType];
  }

  const candidates = [];
  if (modeHint === "recovery") {
    candidates.push("recovery");
  }

  candidates.push("signup", "email", "invite", "magiclink", "email_change");

  if (modeHint !== "recovery") {
    candidates.push("recovery");
  }

  return [...new Set(candidates)];
}

function normalizeOtpType(value: string | null) {
  const type = String(value || "").trim().toLowerCase();
  return OTP_TYPES.has(type) ? type : "";
}

function normalizeMode(value: string | null): ConfirmAction["modeHint"] {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "recovery") {
    return "recovery";
  }
  if (mode === "verify") {
    return "login";
  }
  return "";
}

async function hasRecoverySession() {
  if (!supabaseClient) {
    return false;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    return false;
  }

  return Boolean(data.session?.user);
}

function showRecoveryForm() {
  recoveryReady = true;
  setResetFormVisible(true);
  setStatus("Recovery link verified. Set a new password below.", "success");
}

function setResetFormVisible(visible: boolean) {
  if (ui.resetForm) {
    ui.resetForm.hidden = !visible;
  }
}

function setResetPending(pending: boolean) {
  if (ui.submit) {
    ui.submit.disabled = pending;
    ui.submit.innerHTML = pending
      ? '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Updating...'
      : '<i class="fas fa-key" aria-hidden="true"></i> Update password';
  }
}

function redirectToLogin(mode?: string, extraParams: Record<string, string> = {}) {
  const url = new URL(getLoginPageUrl());
  if (mode) {
    url.searchParams.set("mode", mode);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  window.setTimeout(() => {
    window.location.replace(url.toString());
  }, REDIRECT_DELAY_MS);
}

function clearVerificationParams(modeHint: ConfirmAction["modeHint"]) {
  const url = new URL(window.location.href);
  [
    "token_hash",
    "code",
    "type",
    "access_token",
    "refresh_token",
    "expires_at",
    "expires_in",
    "token_type"
  ].forEach((key) => {
    url.searchParams.delete(key);
  });

  const hash = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
  [
    "token_hash",
    "code",
    "type",
    "access_token",
    "refresh_token",
    "expires_at",
    "expires_in",
    "token_type"
  ].forEach((key) => hash.delete(key));

  if (modeHint) {
    url.searchParams.set("mode", modeHint);
  }

  const nextHash = hash.toString();
  window.history.replaceState(null, "", `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ""}`);
}

function setStatus(message: string, severity: Severity = "info") {
  if (!ui.status) {
    return;
  }

  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
}
