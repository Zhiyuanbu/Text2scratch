const ui = {
  themeOptions: [...document.querySelectorAll("[data-theme-option]")],
  motionOptions: [...document.querySelectorAll("[data-motion-option]")],
  reset: document.getElementById("settingsResetBtn"),
  status: document.getElementById("settingsStatus"),
  themeSummary: document.getElementById("settingsThemeSummary"),
  themeResolved: document.getElementById("settingsThemeResolved"),
  motionSummary: document.getElementById("settingsMotionSummary"),
  motionResolved: document.getElementById("settingsMotionResolved")
};

let themeApi = null;
let motionApi = null;

init().catch((error) => {
  setStatus(error.message, "error");
});

async function init() {
  if (!ui.status) {
    return;
  }

  await waitForPreferenceApis();

  bindEvents();
  syncThemeState({
    mode: themeApi.getMode(),
    resolved: themeApi.getResolvedMode()
  });
  syncMotionState({
    mode: motionApi.getMode(),
    reduced: motionApi.prefersReducedMotion()
  });

  themeApi.subscribe(syncThemeState);
  motionApi.subscribe(syncMotionState);
  setStatus("Settings ready. Changes apply immediately.", "success", {
    toast: false
  });
}

async function waitForPreferenceApis() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (window.text2scratchTheme && window.text2scratchMotion) {
      themeApi = window.text2scratchTheme;
      motionApi = window.text2scratchMotion;
      return;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 25);
    });
  }

  throw new Error("Settings controls are unavailable on this page.");
}

function bindEvents() {
  ui.themeOptions.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.themeOption || "system";
      themeApi.setMode(mode);
      setStatus(`Theme switched to ${humanize(mode)}.`, "success");
    });
  });

  ui.motionOptions.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.motionOption || "system";
      motionApi.setMode(mode);
      setStatus(`Motion preference set to ${humanize(mode)}.`, "success");
    });
  });

  ui.reset?.addEventListener("click", () => {
    themeApi.setMode("system");
    motionApi.setMode("system");
    setStatus("Theme and motion returned to system defaults.", "success");
  });
}

function syncThemeState(state) {
  if (ui.themeSummary) {
    ui.themeSummary.textContent = humanize(state.mode);
  }
  if (ui.themeResolved) {
    ui.themeResolved.textContent = humanize(state.resolved);
  }

  ui.themeOptions.forEach((button) => {
    const active = button.dataset.themeOption === state.mode;
    button.setAttribute("aria-checked", String(active));
  });
}

function syncMotionState(state) {
  if (ui.motionSummary) {
    ui.motionSummary.textContent = humanize(state.mode);
  }
  if (ui.motionResolved) {
    ui.motionResolved.textContent = state.reduced ? "Yes" : "No";
  }

  ui.motionOptions.forEach((button) => {
    const active = button.dataset.motionOption === state.mode;
    button.setAttribute("aria-checked", String(active));
  });
}

function setStatus(message, severity = "info", options = {}) {
  if (!ui.status) {
    return;
  }

  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
  if (options.toast === false) {
    return;
  }

  window.text2scratchToast?.show?.({
    severity,
    title: severity === "success" ? "Settings updated" : severity === "error" ? "Settings issue" : "Settings",
    description: message
  });
}

function humanize(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "Unknown";
  }
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}
