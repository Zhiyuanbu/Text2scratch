const NAV_LINK_SELECTOR = "a[href]";
const INTERNAL_EXTENSIONS = [".html", "/"];

initCommonUi();

function initCommonUi() {
  initMobileMenu();
  initPageAnimation();
  initNavigationPrefetch();
  warmCommonAssets();
}

function initMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const mainNav = document.querySelector(".main-nav");
  if (!toggle || !mainNav) {
    return;
  }

  const setMenuState = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    mainNav.classList.toggle("active", open);
    toggle.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    setMenuState(!expanded);
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) {
      setMenuState(false);
    }
  });

  document.addEventListener("click", (event) => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (!expanded) {
      return;
    }
    if (event.target === toggle || toggle.contains(event.target) || mainNav.contains(event.target)) {
      return;
    }
    setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      setMenuState(false);
    }
  });
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
