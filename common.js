const NAV_LINK_SELECTOR = "a[href]";
const INTERNAL_EXTENSIONS = [".html", "/"];
const SIDEBAR_BREAKPOINT = 960;
const SIDEBAR_STORAGE_KEY = "text2scratch.sidebar.collapsed";
const SIDEBAR_HASH_LINK_SELECTOR = ".main-nav a[href*='#']";
const LOADER_MIN_VISIBLE_MS = 560;
const LOADER_FAILSAFE_MS = 5000;
const TOAST_LIFETIME_MS = 3500;
const REVEAL_ROOT_MARGIN = "0px 0px -10% 0px";
const LOADER_MESSAGES = {
  default: "Preparing text2scratch...",
  home: "Loading product overview...",
  converter: "Preparing converter workspace...",
  docs: "Loading syntax documentation...",
  auth: "Securing account portal...",
  account: "Loading account workspace...",
  community: "Loading community projects...",
  legal: "Opening policy archive...",
  error: "Recovering the missing route..."
};
const toastState = {
  host: null
};

initCommonUi();

function initCommonUi() {
  initGlobalToast();
  initPageLoader();
  initSidebar();
  initSidebarHashLinks();
  initPageAnimation();
  initRevealObserver();
  initNavigationPrefetch();
  warmCommonAssets();
}

function initPageLoader() {
  if (!document.body) {
    return;
  }

  const loader = buildPageLoader();
  const messageNode = loader.querySelector("[data-loader-message]");
  const progressNode = loader.querySelector("[data-loader-progress]");
  if (messageNode) {
    messageNode.textContent = getLoaderMessage(window.location.pathname);
  }

  let progress = 16;
  let resolved = false;
  let hideTimer = null;
  const startedAt = performance.now();
  const progressTimer = window.setInterval(() => {
    if (!progressNode || resolved) {
      return;
    }
    progress = Math.min(92, progress + Math.random() * 9);
    progressNode.style.width = `${progress}%`;
  }, 170);

  document.body.prepend(loader);
  document.body.classList.add("is-loading");

  const finish = () => {
    if (resolved) {
      return;
    }
    resolved = true;
    window.clearInterval(progressTimer);
    if (progressNode) {
      progressNode.style.width = "100%";
    }

    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);
    hideTimer = window.setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
      loader.addEventListener("transitionend", () => loader.remove(), { once: true });
      window.setTimeout(() => loader.remove(), 900);
    }, wait);
  };

  if (document.readyState === "complete") {
    finish();
  } else {
    window.addEventListener("load", finish, { once: true });
  }

  window.setTimeout(finish, LOADER_FAILSAFE_MS);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      finish();
    }
  });

  window.addEventListener("beforeunload", () => {
    window.clearTimeout(hideTimer);
  });
}

function buildPageLoader() {
  const loader = document.createElement("div");
  loader.className = "page-loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML = `
    <div class="page-loader__backdrop"></div>
    <div class="page-loader__panel">
      <div class="page-loader__top">
        <span class="page-loader__brand">
          <img src="logo.png" alt="">
          text2scratch
        </span>
        <span class="page-loader__ring"></span>
      </div>
      <p class="page-loader__message" data-loader-message></p>
      <div class="page-loader__bar">
        <span data-loader-progress></span>
      </div>
    </div>
  `;
  return loader;
}

function getLoaderMessage(pathname) {
  const route = String(pathname || "").toLowerCase();
  if (route.endsWith("/index.html") || route.endsWith("/") || route.endsWith("index.html") || route.endsWith("home.html")) {
    return LOADER_MESSAGES.home;
  }
  if (route.endsWith("converter.html")) {
    return LOADER_MESSAGES.converter;
  }
  if (route.includes("docs") || route.includes("reference")) {
    return LOADER_MESSAGES.docs;
  }
  if (route.includes("community")) {
    return LOADER_MESSAGES.community;
  }
  if (route.includes("account")) {
    return LOADER_MESSAGES.account;
  }
  if (route.includes("login") || route.includes("signup")) {
    return LOADER_MESSAGES.auth;
  }
  if (route.includes("404")) {
    return LOADER_MESSAGES.error;
  }
  if (route.includes("privacy") || route.includes("terms") || route.includes("license")) {
    return LOADER_MESSAGES.legal;
  }
  return LOADER_MESSAGES.default;
}

function initGlobalToast() {
  window.text2scratchToast = {
    ensureHost: ensureToastHost,
    show: showToast,
    dismissAll: dismissAllToasts
  };
}

function ensureToastHost() {
  if (toastState.host) {
    return toastState.host;
  }

  const existingHost = document.querySelector(".toast-stack");
  if (existingHost) {
    toastState.host = existingHost;
    return existingHost;
  }

  const host = document.createElement("div");
  host.className = "toast-stack";
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-atomic", "false");
  document.body.appendChild(host);

  toastState.host = host;
  return host;
}

function normalizeToastInput(input, fallbackSeverity = "info") {
  if (typeof input === "object" && input !== null) {
    const severity = String(input.severity || fallbackSeverity || "info").trim().toLowerCase();
    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();
    const action = input.action && typeof input.action === "object"
      ? {
          label: String(input.action.label || "").trim(),
          href: String(input.action.href || "").trim(),
          onClick: typeof input.action.onClick === "function" ? input.action.onClick : null
        }
      : null;

    return {
      severity,
      title,
      description,
      action
    };
  }

  return {
    severity: String(fallbackSeverity || "info").trim().toLowerCase(),
    title: "",
    description: String(input || "").trim(),
    action: null
  };
}

function getToastMeta(severity) {
  switch (severity) {
    case "success":
      return { icon: "fa-circle-check", title: "Saved" };
    case "warning":
      return { icon: "fa-triangle-exclamation", title: "Check this" };
    case "error":
      return { icon: "fa-circle-xmark", title: "Action failed" };
    default:
      return { icon: "fa-circle-info", title: "Update" };
  }
}

function dismissToast(toast) {
  if (!toast || toast.dataset.closing === "true") {
    return;
  }

  toast.dataset.closing = "true";
  toast.classList.remove("show");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  window.setTimeout(() => toast.remove(), 320);
}

function dismissAllToasts() {
  ensureToastHost()
    .querySelectorAll(".toast")
    .forEach((toast) => dismissToast(toast));
}

function showToast(message, severity = "info") {
  const toastData = normalizeToastInput(message, severity);
  if (!toastData.description && !toastData.title) {
    return;
  }

  const severityName = ["info", "success", "warning", "error"].includes(toastData.severity)
    ? toastData.severity
    : "info";
  const meta = getToastMeta(severityName);
  const host = ensureToastHost();
  const toast = document.createElement("div");
  const description = toastData.description.length > 220
    ? `${toastData.description.slice(0, 220)}...`
    : toastData.description;
  const title = toastData.title || meta.title;
  toast.className = `toast toast-${severityName}`;
  toast.setAttribute("role", severityName === "error" ? "alert" : "status");
  toast.innerHTML = `
    <div class="toast__icon" aria-hidden="true">
      <i class="fas ${meta.icon}"></i>
    </div>
    <div class="toast__body">
      <p class="toast__title">${escapeHtml(title)}</p>
      <p class="toast__description">${escapeHtml(description)}</p>
    </div>
    <button type="button" class="toast__dismiss" aria-label="Dismiss notification">
      <i class="fas fa-xmark" aria-hidden="true"></i>
    </button>
  `;
  host.appendChild(toast);

  toast.querySelector(".toast__dismiss")?.addEventListener("click", () => {
    dismissToast(toast);
  });

  if (toastData.action?.label && (toastData.action.href || toastData.action.onClick)) {
    const actions = document.createElement("div");
    actions.className = "toast__actions";

    if (toastData.action.href) {
      const actionLink = document.createElement("a");
      actionLink.className = "toast__action";
      actionLink.href = toastData.action.href;
      actionLink.textContent = toastData.action.label;
      actions.appendChild(actionLink);
    } else if (toastData.action.onClick) {
      const actionButton = document.createElement("button");
      actionButton.type = "button";
      actionButton.className = "toast__action";
      actionButton.textContent = toastData.action.label;
      actionButton.addEventListener("click", () => {
        toastData.action.onClick();
        dismissToast(toast);
      });
      actions.appendChild(actionButton);
    }

    if (actions.childElementCount > 0) {
      toast.appendChild(actions);
    }
  }

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  window.setTimeout(() => {
    dismissToast(toast);
  }, TOAST_LIFETIME_MS);
}

function initSidebar() {
  const toggle = document.getElementById("mobileMenuToggle");
  const header = document.querySelector(".site-header");
  const mainNav = document.querySelector(".main-nav");

  if (!toggle || !mainNav) {
    return;
  }

  applySidebarLinkA11yLabels(mainNav);
  document.body.classList.add("layout-topnav");
  let mobileOpen = false;
  const isMobile = () => window.innerWidth <= SIDEBAR_BREAKPOINT;

  const syncSidebarLayout = () => {
    const mobile = isMobile();
    const expanded = !mobile || mobileOpen;

    mainNav.classList.toggle("active", mobile && mobileOpen);
    document.body.classList.toggle("nav-open", mobile && mobileOpen);
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.innerHTML = expanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    toggle.hidden = !mobile;
  };

  toggle.addEventListener("click", () => {
    mobileOpen = !mobileOpen;
    syncSidebarLayout();
  });

  mainNav.addEventListener("click", (event) => {
    if (isMobile() && event.target.closest("a[href]")) {
      mobileOpen = false;
      syncSidebarLayout();
    }
  });

  document.addEventListener("click", (event) => {
    if (!isMobile() || !mobileOpen || !header) {
      return;
    }

    if (event.target === toggle || toggle.contains(event.target) || header.contains(event.target)) {
      return;
    }

    mobileOpen = false;
    syncSidebarLayout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMobile() && mobileOpen) {
      mobileOpen = false;
      syncSidebarLayout();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      mobileOpen = false;
    }
    syncSidebarLayout();
  });

  syncSidebarLayout();
}

function applySidebarLinkA11yLabels(mainNav) {
  const links = [...mainNav.querySelectorAll("a[href]")];
  links.forEach((link) => {
    const label = String(link.querySelector(".nav-label")?.textContent || "").trim();
    if (!label) {
      return;
    }

    link.setAttribute("aria-label", label);
    link.setAttribute("title", label);
  });
}

function initSidebarHashLinks() {
  const currentPath = canonicalPath(window.location.pathname);
  const links = document.querySelectorAll(SIDEBAR_HASH_LINK_SELECTOR);
  links.forEach((link) => {
    let url;
    try {
      url = new URL(link.getAttribute("href") || "", window.location.href);
    } catch (_error) {
      return;
    }

    if (!url.hash || url.origin !== window.location.origin) {
      return;
    }

    if (canonicalPath(url.pathname) === currentPath) {
      link.setAttribute("href", url.hash);
    }
  });
}

function canonicalPath(pathname) {
  const value = String(pathname || "").trim();
  if (!value || value === "/") {
    return "/index.html";
  }
  if (value.endsWith("/")) {
    return `${value}index.html`;
  }
  return value;
}

function persistSidebarPreference(collapsed) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  } catch (_error) {
    // Ignore local storage failures.
  }
}

function readSidebarPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch (_error) {
    return false;
  }
}

function initPageAnimation() {
  document.body.classList.add("page-animate");
  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !isSameOriginPageLink(link)) {
      return;
    }

    if (link.target && link.target !== "_self") {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    document.body.classList.add("page-leaving");
  });
}

function initRevealObserver() {
  const revealTargets = [...document.querySelectorAll("[data-reveal]")];
  if (revealTargets.length === 0) {
    return;
  }

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealTargets.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      activeObserver.unobserve(entry.target);
    });
  }, {
    rootMargin: REVEAL_ROOT_MARGIN,
    threshold: 0.12
  });

  revealTargets.forEach((node) => observer.observe(node));
}

function initNavigationPrefetch() {
  const links = [...document.querySelectorAll(NAV_LINK_SELECTOR)].filter((link) => isSameOriginPageLink(link));
  links.forEach((link) => {
    const href = link.href;
    const prefetch = () => addPrefetchLink(href);
    link.addEventListener("mouseenter", prefetch, { once: true });
    link.addEventListener("touchstart", prefetch, { once: true, passive: true });
    link.addEventListener("focus", prefetch, { once: true });
  });
}

function warmCommonAssets() {
  if (window.fetch) {
    fetch("blocks.json", { cache: "force-cache" }).catch(() => {});
  }
}

function addPrefetchLink(href) {
  if ([...document.head.querySelectorAll("link[data-prefetch-href]")].some((node) => node.getAttribute("data-prefetch-href") === href)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = href;
  link.setAttribute("data-prefetch-href", href);
  document.head.appendChild(link);
}

function isSameOriginPageLink(link) {
  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch (_error) {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }
  if (url.hash && stripHash(url.href) === stripHash(window.location.href)) {
    return false;
  }

  return INTERNAL_EXTENSIONS.some((suffix) => url.pathname.endsWith(suffix));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHash(value) {
  return value.split("#")[0];
}
