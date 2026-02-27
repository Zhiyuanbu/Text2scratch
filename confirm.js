import {
  createSupabaseClient,
  formatSupabaseError,
  getLoginPageUrl
} from "./supabase-client.js";

const ui = {
  status: document.getElementById("confirmStatus"),
  loginLink: document.getElementById("confirmLoginLink"),
  signupLink: document.getElementById("confirmSignupLink")
};

const REDIRECT_DELAY_MS = 1350;
const OTP_TYPES = new Set(["signup", "recovery", "invite", "email", "email_change", "magiclink"]);

let supabaseClient = null;

init().catch((error) => {
  setStatus(`Startup error: ${formatSupabaseError(error)}`, "error");
});

async function init() {
  if (!ui.status) {
    return;
  }

  ui.status.classList.add("status-toast-mirror");

  if (ui.loginLink) {
    ui.loginLink.href = getLoginPageUrl();
  }
  if (ui.signupLink) {
    ui.signupLink.href = new URL("signup.html", window.location.href).toString();
  }

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }

  const action = parseActionFromUrl();
  if (!action.tokenHash && !action.authCode) {
    setStatus("This confirmation link is incomplete. Request a fresh email and retry.", "warning");
    return;
  }

  try {
    const result = await completeAuthAction(action);
    const resolvedType = result.type || action.modeHint || "";
    const recoveryFlow = resolvedType === "recovery";

    if (recoveryFlow) {
      setStatus("Recovery link verified. Redirecting to password reset...", "success");
      redirectToLogin("recovery");
      return;
    }

    setStatus("Email verified successfully. Redirecting to login...", "success");
    redirectToLogin("login");
  } catch (error) {
    setStatus(`Verification failed: ${formatSupabaseError(error)}`, "error");
  }
}

function parseActionFromUrl() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));

  return {
    tokenHash: String(search.get("token_hash") || hash.get("token_hash") || "").trim(),
    authCode: String(search.get("code") || hash.get("code") || "").trim(),
    actionType: normalizeOtpType(search.get("type") || hash.get("type")),
    modeHint: normalizeMode(search.get("mode") || hash.get("mode"))
  };
}

async function completeAuthAction(action) {
  if (action.authCode) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(action.authCode);
    if (error) {
      throw error;
    }
    return { type: action.actionType || action.modeHint || "" };
  }

  const candidateTypes = buildCandidateOtpTypes(action.actionType, action.modeHint);
  let lastError = null;

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

function buildCandidateOtpTypes(actionType, modeHint) {
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

function normalizeOtpType(value) {
  const type = String(value || "").trim().toLowerCase();
  return OTP_TYPES.has(type) ? type : "";
}

function normalizeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "recovery") {
    return "recovery";
  }
  if (mode === "verify") {
    return "login";
  }
  return "";
}

function redirectToLogin(mode) {
  const url = new URL(getLoginPageUrl());
  url.searchParams.set("mode", mode);
  url.searchParams.set("verified", "1");

  window.setTimeout(() => {
    window.location.replace(url.toString());
  }, REDIRECT_DELAY_MS);
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
