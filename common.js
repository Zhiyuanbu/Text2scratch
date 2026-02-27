const NAV_LINK_SELECTOR = "a[href]";
const INTERNAL_EXTENSIONS = [".html", "/"];
const SIDEBAR_BREAKPOINT = 960;
const SIDEBAR_STORAGE_KEY = "text2scratch.sidebar.collapsed";
const SIDEBAR_HASH_LINK_SELECTOR = ".main-nav a[href*='#']";
const LOADER_MIN_VISIBLE_MS = 560;
const LOADER_FAILSAFE_MS = 5000;
const TOAST_LIFETIME_MS = 3500;
const LOADER_MESSAGES = {
  default: "Compiling interface surfaces...",
  converter: "Preparing converter workspace...",
  docs: "Loading command playbook...",
  auth: "Securing account portal...",
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
  if (route.endsWith("/index.html") || route.endsWith("/") || route.endsWith("index.html")) {
    return LOADER_MESSAGES.converter;
  }
  if (route.includes("docs") || route.includes("reference")) {
    return LOADER_MESSAGES.docs;
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
    show: showToast
  };
}

function ensureToastHost() {
  if (toastState.host) {
    return toastState.host;
  }

  const host = document.createElement("div");
  host.className = "toast-stack";
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-atomic", "true");
  document.body.appendChild(host);

  toastState.host = host;
  return host;
}

function showToast(message, severity = "info") {
  const text = String(message || "").trim();
  if (!text) {
    return;
  }

  const host = ensureToastHost();
  const toast = document.createElement("div");
  toast.className = `toast toast-${severity}`;
  toast.setAttribute("role", severity === "error" ? "alert" : "status");
  toast.textContent = text.length > 220 ? `${text.slice(0, 220)}...` : text;
  host.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  window.setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 280);
  }, TOAST_LIFETIME_MS);
}

function initSidebar() {
  if (document.body.classList.contains("page-not-found")) {
    document.body.classList.add("layout-no-sidebar");
    return;
  }

  const toggle = document.getElementById("mobileMenuToggle");
  const header = document.querySelector(".site-header");
  const mainNav = document.querySelector(".main-nav");
  const brand = document.querySelector(".brand");

  if (!toggle || !header || !mainNav) {
    document.body.classList.add("layout-no-sidebar");
    return;
  }

  applySidebarLinkA11yLabels(mainNav);
  document.body.classList.add("layout-sidebar");

  let dockButton = null;
  let mobileOpen = false;
  let collapsed = readSidebarPreference();

  const isMobile = () => window.innerWidth <= SIDEBAR_BREAKPOINT;

  const ensureDockButton = () => {
    if (dockButton) {
      return dockButton;
    }

    dockButton = document.createElement("button");
    dockButton.type = "button";
    dockButton.className = "sidebar-dock-toggle";
    dockButton.setAttribute("aria-label", "Open sidebar");
    dockButton.innerHTML = '<i class="fas fa-bars"></i>';
    dockButton.addEventListener("click", () => {
      if (isMobile()) {
        mobileOpen = true;
      } else {
        collapsed = false;
        persistSidebarPreference(false);
      }
      syncSidebarLayout();
    });

    document.body.appendChild(dockButton);
    return dockButton;
  };

  const syncSidebarLayout = () => {
    const mobile = isMobile();
    const desktopCollapsed = !mobile && collapsed;

    mainNav.classList.toggle("active", mobile && mobileOpen);
    document.body.classList.toggle("sidebar-open", mobile && mobileOpen);
    document.body.classList.toggle("sidebar-collapsed", desktopCollapsed);

    const expanded = mobile ? mobileOpen : !desktopCollapsed;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.innerHTML = expanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';

    const dock = ensureDockButton();
    dock.hidden = mobile ? mobileOpen : !desktopCollapsed;
  };

  toggle.addEventListener("click", () => {
    if (isMobile()) {
      mobileOpen = !mobileOpen;
      syncSidebarLayout();
      return;
    }

    collapsed = !collapsed;
    persistSidebarPreference(collapsed);
    syncSidebarLayout();
  });

  mainNav.addEventListener("click", (event) => {
    if (isMobile() && event.target.closest("a[href]")) {
      mobileOpen = false;
      syncSidebarLayout();
    }
  });

  brand?.addEventListener("click", (event) => {
    if (isMobile() || !collapsed) {
      return;
    }

    event.preventDefault();
    collapsed = false;
    persistSidebarPreference(collapsed);
    syncSidebarLayout();
  });

  document.addEventListener("click", (event) => {
    if (!isMobile() || !mobileOpen) {
      return;
    }

    if (event.target === toggle || toggle.contains(event.target) || header.contains(event.target)) {
      return;
    }

    mobileOpen = false;
    syncSidebarLayout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (isMobile() && mobileOpen) {
      mobileOpen = false;
      syncSidebarLayout();
      return;
    }

    if (!isMobile() && !collapsed) {
      collapsed = true;
      persistSidebarPreference(collapsed);
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

function stripHash(value) {
  return value.split("#")[0];
}
