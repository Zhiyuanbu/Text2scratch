import {
  createSupabaseClient,
  formatSupabaseError,
  getHcaptchaSiteKey,
  getIndexPageUrl,
  getLoginPageUrl
} from "./supabase-client.js";

const ui = {
  form: document.getElementById("authForm"),
  email: document.getElementById("authEmailInput"),
  password: document.getElementById("authPasswordInput"),
  confirm: document.getElementById("authConfirmPasswordInput"),
  submit: document.getElementById("authSubmitBtn"),
  status: document.getElementById("authStatus"),
  hcaptchaMount: document.getElementById("hcaptchaMount"),
  hcaptchaHint: document.getElementById("hcaptchaHint")
};

const mode = document.body?.dataset?.authMode === "signup" ? "signup" : "login";

let supabaseClient = null;
let hcaptchaWidgetId = null;
let hcaptchaRequired = false;

init().catch((error) => {
  setStatus(`Startup error: ${error.message}`, "error");
});

async function init() {
  if (!ui.form || !ui.email || !ui.password || !ui.submit || !ui.status) {
    return;
  }

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error.message, "error");
    setFormEnabled(false);
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(`Auth warning: ${formatSupabaseError(error)}`, "warning");
  }

  const userEmail = data?.session?.user?.email || "";
  if (userEmail && mode === "login") {
    setStatus(`Already signed in as ${userEmail}. You can open converter now.`, "success");
  }

  await initHcaptchaIfEnabled();

  ui.form.addEventListener("submit", onSubmit);
  showQueryFeedback();
}

async function onSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("Supabase client is not ready.", "error");
    return;
  }

  const email = String(ui.email.value || "").trim();
  const password = String(ui.password.value || "");
  if (!email || !email.includes("@")) {
    setStatus("Enter a valid email address.", "warning");
    return;
  }
  if (password.length < 6) {
    setStatus("Password must be at least 6 characters.", "warning");
    return;
  }

  setFormEnabled(false);

  if (mode === "signup") {
    await handleSignUp(email, password);
  } else {
    await handleSignIn(email, password);
  }

  setFormEnabled(true);
}

async function handleSignIn(email, password) {
  const payload = { email, password };
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

  ui.password.value = "";
  setStatus("Signed in. Redirecting to converter...", "success");
  window.location.href = getIndexPageUrl();
}

async function handleSignUp(email, password) {
  const confirmPassword = String(ui.confirm?.value || "");
  if (confirmPassword !== password) {
    setStatus("Password and confirmation must match.", "warning");
    return;
  }

  const options = {
    emailRedirectTo: getLoginPageUrl()
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

  window.text2scratchRum?.trackAccountCreated({ method: "email_password" });

  if (data?.session?.user) {
    setStatus("Account created and signed in. Redirecting to converter...", "success");
    window.location.href = getIndexPageUrl();
    return;
  }

  setStatus("Account created. Check your email, then log in.", "success");
  resetCaptcha();
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
  ui.submit.disabled = !enabled;
  ui.email.disabled = !enabled;
  ui.password.disabled = !enabled;
  if (ui.confirm) {
    ui.confirm.disabled = !enabled;
  }
}

function setStatus(message, severity = "info") {
  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
}

function showQueryFeedback() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("signup") === "success") {
    setStatus("Account created. Check your email to confirm, then log in.", "success");
  } else if (params.get("signed_out") === "1") {
    setStatus("Signed out.", "success");
  }

  if (mode === "login" && params.get("mode") === "signup") {
    setStatus("Use this page to log in after email verification.", "info");
  }

  if (mode === "signup" && params.get("mode") === "login") {
    setStatus("Already have an account? Use the login form.", "info");
  }
}
