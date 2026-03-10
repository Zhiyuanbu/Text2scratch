const STYLE_ID = "text2scratch-dialog-styles";
const BODY_LOCK_CLASS = "t2s-dialog-open";

let activeDialog = null;

export function showAlertDialog(options = {}) {
  return openDialog({
    ...options,
    mode: "alert"
  }).then(() => undefined);
}

export function showConfirmDialog(options = {}) {
  return openDialog({
    ...options,
    mode: "confirm"
  }).then((result) => Boolean(result));
}

export function showPromptDialog(options = {}) {
  return openDialog({
    ...options,
    mode: "prompt"
  }).then((result) => (typeof result === "string" ? result : null));
}

function openDialog(options) {
  ensureDialogStyles();

  if (activeDialog?.forceClose) {
    activeDialog.forceClose(getCancelResult(activeDialog.mode));
  }

  const mode = options.mode || "alert";
  const title = String(options.title || "Confirm action").trim();
  const message = String(options.message || options.description || "").trim();
  const confirmLabel = String(options.confirmLabel || (mode === "alert" ? "OK" : mode === "prompt" ? "Continue" : "Confirm")).trim();
  const cancelLabel = String(options.cancelLabel || "Cancel").trim();
  const tone = options.tone === "danger" ? "danger" : "default";
  const placeholder = String(options.placeholder || "").trim();
  const defaultValue = String(options.defaultValue || "");
  const inputType = String(options.inputType || "text").trim() || "text";
  const validator = typeof options.validate === "function" ? options.validate : null;
  const cancelable = mode !== "alert";

  return new Promise((resolve) => {
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let cleanedUp = false;
    let closed = false;
    const overlay = document.createElement("div");
    overlay.className = "t2s-dialog";
    overlay.innerHTML = `
      <div class="t2s-dialog__backdrop"></div>
      <div class="t2s-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="t2s-dialog-title">
        <div class="t2s-dialog__header">
          <div>
            <p class="t2s-dialog__eyebrow">${tone === "danger" ? "Danger zone" : "Action required"}</p>
            <h2 id="t2s-dialog-title" class="t2s-dialog__title"></h2>
          </div>
          ${
            cancelable
              ? '<button type="button" class="t2s-dialog__icon-btn" aria-label="Close dialog">&times;</button>'
              : ""
          }
        </div>
        ${message ? '<p class="t2s-dialog__message"></p>' : ""}
        ${
          mode === "prompt"
            ? `
              <label class="t2s-dialog__field">
                <span class="t2s-dialog__label">${escapeHtml(options.inputLabel || "Value")}</span>
                <input class="t2s-dialog__input" type="${escapeHtml(inputType)}" autocomplete="off">
              </label>
              <p class="t2s-dialog__error" hidden></p>
            `
            : ""
        }
        <div class="t2s-dialog__actions">
          ${
            cancelable
              ? `<button type="button" class="t2s-dialog__button t2s-dialog__button--secondary" data-dialog-cancel>${escapeHtml(cancelLabel)}</button>`
              : ""
          }
          <button type="button" class="t2s-dialog__button ${tone === "danger" ? "t2s-dialog__button--danger" : "t2s-dialog__button--primary"}" data-dialog-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    const panel = overlay.querySelector(".t2s-dialog__panel");
    const titleNode = overlay.querySelector(".t2s-dialog__title");
    const messageNode = overlay.querySelector(".t2s-dialog__message");
    const input = overlay.querySelector(".t2s-dialog__input");
    const errorNode = overlay.querySelector(".t2s-dialog__error");
    const cancelButton = overlay.querySelector("[data-dialog-cancel]");
    const confirmButton = overlay.querySelector("[data-dialog-confirm]");
    const closeButton = overlay.querySelector(".t2s-dialog__icon-btn");

    if (titleNode) {
      titleNode.textContent = title;
    }
    if (messageNode) {
      messageNode.textContent = message;
    }
    if (input) {
      input.value = defaultValue;
      input.placeholder = placeholder;
    }

    const cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      document.body.classList.remove(BODY_LOCK_CLASS);
      activeDialog = null;
      previousActive?.focus?.();
    };

    const close = (result, immediate = false) => {
      if (closed) {
        return;
      }
      closed = true;

      if (immediate) {
        cleanup();
        resolve(result);
        return;
      }

      overlay.classList.remove("is-open");
      panel?.classList.remove("is-open");
      window.setTimeout(() => {
        cleanup();
        resolve(result);
      }, 180);
    };

    const showError = (messageText) => {
      if (!errorNode) {
        return;
      }
      errorNode.hidden = false;
      errorNode.textContent = String(messageText || "Check this value and try again.");
    };

    const clearError = () => {
      if (!errorNode) {
        return;
      }
      errorNode.hidden = true;
      errorNode.textContent = "";
    };

    const onConfirm = () => {
      if (mode !== "prompt") {
        close(mode === "confirm" ? true : undefined);
        return;
      }

      const value = String(input?.value || "");
      if (validator) {
        const validation = validator(value);
        if (typeof validation === "string" && validation.trim()) {
          showError(validation);
          input?.focus();
          return;
        }
      }

      clearError();
      close(value);
    };

    const onCancel = () => close(getCancelResult(mode));

    const onKeyDown = (event) => {
      if (event.key === "Escape" && cancelable) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === "Enter" && event.target === input) {
        event.preventDefault();
        onConfirm();
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event, overlay);
      }
    };

    confirmButton?.addEventListener("click", onConfirm);
    cancelButton?.addEventListener("click", onCancel);
    closeButton?.addEventListener("click", onCancel);
    overlay.addEventListener("click", (event) => {
      const target = event.target;
      if (
        cancelable
        && (target === overlay || (target instanceof Element && target.classList.contains("t2s-dialog__backdrop")))
      ) {
        onCancel();
      }
    });
    input?.addEventListener("input", clearError);

    document.addEventListener("keydown", onKeyDown, true);
    document.body.appendChild(overlay);
    document.body.classList.add(BODY_LOCK_CLASS);

    activeDialog = {
      mode,
      close: (result) => close(result, false),
      forceClose: (result) => close(result, true)
    };

    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      panel?.classList.add("is-open");
      (input || confirmButton || cancelButton || closeButton)?.focus?.();
    });
  });
}

function ensureDialogStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    body.${BODY_LOCK_CLASS} {
      overflow: hidden;
    }

    .t2s-dialog {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      opacity: 0;
      transition: opacity 160ms ease;
    }

    .t2s-dialog.is-open {
      opacity: 1;
    }

    .t2s-dialog__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.48);
      backdrop-filter: blur(10px);
    }

    .t2s-dialog__panel {
      position: relative;
      z-index: 1;
      width: min(100%, 30rem);
      border: 1px solid rgba(15, 23, 42, 0.1);
      border-radius: 1.75rem;
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24);
      padding: 1.4rem;
      transform: translateY(12px) scale(0.98);
      transition: transform 180ms ease;
    }

    .t2s-dialog__panel.is-open {
      transform: translateY(0) scale(1);
    }

    .t2s-dialog__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .t2s-dialog__eyebrow {
      margin: 0 0 0.35rem;
      color: #475569;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .t2s-dialog__title {
      margin: 0;
      color: #0f172a;
      font-size: 1.35rem;
      line-height: 1.2;
    }

    .t2s-dialog__message {
      margin: 1rem 0 0;
      color: #475569;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .t2s-dialog__field {
      display: grid;
      gap: 0.45rem;
      margin-top: 1rem;
    }

    .t2s-dialog__label {
      color: #334155;
      font-size: 0.92rem;
      font-weight: 600;
    }

    .t2s-dialog__input {
      width: 100%;
      min-height: 3rem;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 1rem;
      background: #f8fafc;
      color: #0f172a;
      padding: 0.9rem 1rem;
      font: inherit;
      outline: none;
    }

    .t2s-dialog__input:focus {
      border-color: rgba(15, 23, 42, 0.3);
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08);
    }

    .t2s-dialog__error {
      margin: 0.55rem 0 0;
      color: #be123c;
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .t2s-dialog__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .t2s-dialog__button,
    .t2s-dialog__icon-btn {
      font: inherit;
      cursor: pointer;
      transition: transform 150ms ease, background-color 150ms ease, border-color 150ms ease, color 150ms ease;
    }

    .t2s-dialog__button {
      min-height: 2.85rem;
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0.8rem 1.15rem;
      font-size: 0.92rem;
      font-weight: 700;
    }

    .t2s-dialog__button:hover,
    .t2s-dialog__icon-btn:hover {
      transform: translateY(-1px);
    }

    .t2s-dialog__button--primary {
      background: #0f172a;
      color: #fff;
    }

    .t2s-dialog__button--primary:hover {
      background: #1e293b;
    }

    .t2s-dialog__button--danger {
      background: #dc2626;
      color: #fff;
    }

    .t2s-dialog__button--danger:hover {
      background: #b91c1c;
    }

    .t2s-dialog__button--secondary {
      border-color: rgba(15, 23, 42, 0.12);
      background: #fff;
      color: #334155;
    }

    .t2s-dialog__button--secondary:hover {
      border-color: rgba(15, 23, 42, 0.22);
      color: #0f172a;
    }

    .t2s-dialog__icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 999px;
      background: #fff;
      color: #64748b;
      font-size: 1.15rem;
      line-height: 1;
    }

    .t2s-dialog__button:focus-visible,
    .t2s-dialog__icon-btn:focus-visible,
    .t2s-dialog__input:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.12);
    }

    html[data-theme="dark"] .t2s-dialog__panel {
      border-color: rgba(255, 255, 255, 0.12);
      background: rgba(2, 6, 23, 0.96);
      box-shadow: 0 32px 80px rgba(2, 6, 23, 0.48);
    }

    html[data-theme="dark"] .t2s-dialog__eyebrow,
    html[data-theme="dark"] .t2s-dialog__message {
      color: #cbd5e1;
    }

    html[data-theme="dark"] .t2s-dialog__title {
      color: #f8fafc;
    }

    html[data-theme="dark"] .t2s-dialog__label {
      color: #e2e8f0;
    }

    html[data-theme="dark"] .t2s-dialog__input,
    html[data-theme="dark"] .t2s-dialog__button--secondary,
    html[data-theme="dark"] .t2s-dialog__icon-btn {
      border-color: rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      color: #f8fafc;
    }

    html[data-theme="dark"] .t2s-dialog__input:focus {
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08);
    }

    html[data-theme="dark"] .t2s-dialog__button--primary {
      background: #f8fafc;
      color: #0f172a;
    }

    html[data-theme="dark"] .t2s-dialog__button--primary:hover {
      background: #e2e8f0;
    }

    @media (max-width: 640px) {
      .t2s-dialog {
        padding: 1rem;
      }

      .t2s-dialog__panel {
        width: 100%;
        border-radius: 1.4rem;
        padding: 1.1rem;
      }

      .t2s-dialog__actions {
        display: grid;
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

function trapFocus(event, root) {
  const focusable = [...root.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");

  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;

  if (event.shiftKey && current === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
}

function getCancelResult(mode) {
  if (mode === "confirm") {
    return false;
  }
  if (mode === "prompt") {
    return null;
  }
  return undefined;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

if (typeof window !== "undefined") {
  window.text2scratchDialog = {
    alert: showAlertDialog,
    confirm: showConfirmDialog,
    prompt: showPromptDialog
  };
}
