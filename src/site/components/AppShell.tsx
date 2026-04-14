import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, Loader2, Menu, MoonStar, SunMedium, Trash2, X } from "lucide-react";
import { mobileNavLinks, primaryNavLinks, type AppPageKey } from "../config/pages";
import { createErrorReport } from "../lib/errorReports";
import { buildAvatarLabel } from "../lib/supabase";
import { useOptionalAuth, useTheme, useNotifications, useToast } from "../providers/AppProviders";

interface AppShellProps {
  page: AppPageKey;
  children: ReactNode;
}

const AUTH_BLOCKING_PAGES = new Set<AppPageKey>(["converter"]);
const logoUrl = "/apple-touch-icon.png";

function readSessionValue(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and continue.
  }
}

export function AppShell({ page, children }: AppShellProps) {
  const { user, profile, signOut, isLoading: authLoading } = useOptionalAuth();
  const { resolvedMode, setMode } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const { pushToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const notifsMenuRef = useRef<HTMLDivElement | null>(null);
  const notifsButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDialogRef = useRef<HTMLDivElement | null>(null);
  const shellContentRef = useRef<HTMLDivElement | null>(null);
  const fullBrandName = "text2scratch";

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    const interval = setInterval(() => {
      fetch(window.location.origin + window.location.pathname, { method: "HEAD", cache: "no-store" })
        .then((response) => {
          const etag = response.headers.get("etag");
          const lastModified = response.headers.get("last-modified");
          const currentEtag = readSessionValue("text2scratch.deploy_etag");
          const currentLastModified = readSessionValue("text2scratch.deploy_lastmod");

          if (currentEtag && etag && currentEtag !== etag) {
            window.location.reload();
            return;
          }

          if (currentLastModified && lastModified && currentLastModified !== lastModified) {
            window.location.reload();
            return;
          }

          if (etag) {
            writeSessionValue("text2scratch.deploy_etag", etag);
          }
          if (lastModified) {
            writeSessionValue("text2scratch.deploy_lastmod", lastModified);
          }
        })
        .catch(() => undefined);
    }, 1000 * 60 * 5);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (readSessionValue("text2scratch.intro_played")) {
      setTypewriterText(fullBrandName);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      setTypewriterText(fullBrandName.slice(0, index));
      index += 1;
      if (index > fullBrandName.length) {
        clearInterval(interval);
        writeSessionValue("text2scratch.intro_played", "true");
      }
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target) && !accountButtonRef.current?.contains(target)) {
        setAccountOpen(false);
      }
      if (notifsMenuRef.current && !notifsMenuRef.current.contains(target) && !notifsButtonRef.current?.contains(target)) {
        setNotifsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (mobileOpen) {
        setMobileOpen(false);
        mobileButtonRef.current?.focus();
        return;
      }

      if (accountOpen) {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
        return;
      }

      if (notifsOpen) {
        setNotifsOpen(false);
        notifsButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [accountOpen, mobileOpen, notifsOpen]);

  useEffect(() => {
    const shellContent = shellContentRef.current as (HTMLDivElement & { inert?: boolean }) | null;

    if (!mobileOpen) {
      document.body.style.removeProperty("overflow");
      if (shellContent) {
        shellContent.inert = false;
      }
      return;
    }

    document.body.style.overflow = "hidden";
    if (shellContent) {
      shellContent.inert = true;
    }
    window.setTimeout(() => mobileCloseButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.removeProperty("overflow");
      if (shellContent) {
        shellContent.inert = false;
      }
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !mobileDialogRef.current) {
      return;
    }

    const dialog = mobileDialogRef.current;
    const handleTrapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((item) => !item.hasAttribute("hidden"));

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      const activeItem = document.activeElement;

      if (event.shiftKey && activeItem === firstItem) {
        event.preventDefault();
        lastItem.focus();
        return;
      }

      if (!event.shiftKey && activeItem === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    dialog.addEventListener("keydown", handleTrapFocus);
    return () => dialog.removeEventListener("keydown", handleTrapFocus);
  }, [mobileOpen]);

  useEffect(() => {
    if (!accountOpen) {
      return;
    }

    const firstItem = accountMenuRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    window.setTimeout(() => firstItem?.focus(), 0);
  }, [accountOpen]);

  useEffect(() => {
    if (!notifsOpen) {
      return;
    }

    const firstItem = notifsMenuRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    window.setTimeout(() => firstItem?.focus(), 0);
  }, [notifsOpen]);

  const isDark = resolvedMode === "dark";
  const isWorkspace = page === "converter";
  const accountLabel = profile?.username?.trim()
    || String(user?.user_metadata?.username || "").trim()
    || user?.email?.split("@")[0]
    || "Profile";

  const handleSignOut = async () => {
    try {
      await signOut();
      setAccountOpen(false);
      setMobileOpen(false);
      if (page === "converter" || page === "dashboard") {
        window.location.assign("index.html?signed_out=1");
        return;
      }
      pushToast({ title: "Signed out", variant: "success" });
    } catch (error) {
      const report = createErrorReport(error, { area: "sign out" });
      pushToast({ title: "Sign-out failed", description: report.summary, variant: "error" });
    }
  };

  if (authLoading && AUTH_BLOCKING_PAGES.has(page)) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f9f9f9] dark:bg-[#0d1117]">
        <div className="mb-6 h-16 w-16 animate-bounce">
          <img
            src={logoUrl}
            alt="text2scratch logo"
            className="h-full w-full rounded-xl bg-white p-1 shadow-lg dark:bg-slate-800"
          />
        </div>
        <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#4d97ff]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Synchronizing registry...
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell min-h-screen bg-[#f0f0f0] text-slate-900 selection:bg-blue-500/30 dark:bg-[#0d1117] dark:text-slate-200">
      <a
        href="#main-content"
        className="sr-only z-[120] rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3 dark:bg-slate-900 dark:text-white"
      >
        Skip to main content
      </a>

      <div ref={shellContentRef}>
        <header className="sticky top-0 z-50 h-12 border-b border-black/10 bg-[#4d97ff] text-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto flex h-full items-center gap-4 px-2">
          <a href="index.html" className="flex min-w-[130px] items-center gap-2 hover:opacity-90" aria-label="Open the text2scratch home page">
            <img src={logoUrl} alt="text2scratch logo" className="h-6 w-6 rounded bg-white p-0.5" />
            <span className="text-[0.9rem] font-black tracking-tighter">
              {typewriterText}
              <span className="animate-pulse" aria-hidden="true">|</span>
            </span>
          </a>

          <div className="h-5 w-px bg-white/20" aria-hidden="true" />

          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            {primaryNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={link.page === page ? "page" : undefined}
                className={`rounded px-3 py-1 text-[0.75rem] font-bold uppercase tracking-wider transition-colors ${
                  link.page === page
                    ? "bg-black/15 text-white"
                    : "text-white/80 hover:bg-black/5 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div ref={notifsMenuRef} className="relative">
              <button
                ref={notifsButtonRef}
                type="button"
                onClick={() => {
                  const nextOpen = !notifsOpen;
                  setNotifsOpen(nextOpen);
                  if (nextOpen) {
                    markAllRead();
                  }
                }}
                aria-expanded={notifsOpen}
                aria-controls="notifications-panel"
                aria-label="Open notifications"
                className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/10 ${notifsOpen ? "bg-black/10" : ""}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#4d97ff] dark:ring-[#161b22]" aria-hidden="true" />
                )}
              </button>

              {notifsOpen && (
                <div
                  id="notifications-panel"
                  role="dialog"
                  aria-modal="false"
                  aria-label="Notifications"
                  className="dropdown-content absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-[#161b22]"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-slate-50 p-2 dark:border-slate-800">
                    <span className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Notifications</span>
                    <button
                      type="button"
                      data-autofocus
                      onClick={clearAll}
                      aria-label="Clear notifications"
                      className="text-slate-400 transition-colors hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">No signals</div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-lg border border-transparent p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            !notification.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                          }`}
                        >
                          <div className="mb-1 flex items-start justify-between">
                            <span className="text-[0.7rem] font-black uppercase tracking-tight text-[#4d97ff] dark:text-blue-400">
                              {notification.title}
                            </span>
                            <span className="text-[0.65rem] font-bold text-slate-400">{notification.time}</span>
                          </div>
                          <p className="text-[0.7rem] font-medium leading-tight text-slate-600 dark:text-slate-400">
                            {notification.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMode(isDark ? "light" : "dark")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/10"
            >
              {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
            </button>

            {user ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  ref={accountButtonRef}
                  type="button"
                  onClick={() => setAccountOpen((current) => !current)}
                  aria-expanded={accountOpen}
                  aria-controls="account-menu"
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  className="flex items-center gap-2 rounded bg-black/10 px-2 py-1 transition-colors hover:bg-black/20"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-blue-600 text-[0.6rem] font-black uppercase">
                    {buildAvatarLabel(accountLabel)}
                  </span>
                  <span className="max-w-[80px] truncate text-[0.75rem] font-bold uppercase">{accountLabel}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                </button>

                {accountOpen && (
                  <div
                    id="account-menu"
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded border border-slate-200 bg-white py-1 text-slate-900 shadow-xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-200"
                  >
                    <a
                      href="dashboard.html"
                      role="menuitem"
                      data-autofocus
                      className="block px-4 py-1.5 text-[0.75rem] font-bold transition-colors hover:bg-[#4d97ff] hover:text-white"
                    >
                      DASHBOARD
                    </a>
                    <a
                      href="dashboard.html#profile"
                      role="menuitem"
                      className="block px-4 py-1.5 text-[0.75rem] font-bold transition-colors hover:bg-[#4d97ff] hover:text-white"
                    >
                      SETTINGS
                    </a>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" aria-hidden="true" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-[0.75rem] font-bold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      SIGN OUT
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a href="login.html" className="text-[0.75rem] font-black uppercase hover:underline">Sign In</a>
                <a href="signup.html" className="rounded bg-white px-3 py-1 text-[0.75rem] font-black uppercase text-[#4d97ff] shadow-sm transition-transform hover:bg-slate-50 active:scale-95">
                  Join
                </a>
              </div>
            )}

            <button
              ref={mobileButtonRef}
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-haspopup="dialog"
              aria-label="Open mobile navigation"
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/10 lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className={isWorkspace ? "h-[calc(100vh-3rem)] overflow-hidden" : "pt-4"}>
          {children}
        </main>

        {!isWorkspace && (
          <footer className="mt-12 border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-[#0d1117]">
            <div className="mx-auto max-w-5xl px-4 text-center sm:text-left">
              <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="text2scratch logo" className="h-6 w-6 rounded border border-slate-100 p-0.5" />
                  <span className="text-sm font-black tracking-tighter">text2scratch</span>
                </div>
                <div className="flex gap-6 text-[0.75rem] font-black uppercase tracking-widest text-slate-500">
                  <a href="privacy.html" className="hover:text-[#4d97ff]">Privacy</a>
                  <a href="terms.html" className="hover:text-[#4d97ff]">Terms</a>
                  <a href="docs.html" className="hover:text-[#4d97ff]">Docs</a>
                  <a href="https://github.com/Zhiyuanbu/Text2scratch" className="hover:text-[#4d97ff]">GitHub</a>
                </div>
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-slate-400">2026 text2scratch</p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            ref={mobileDialogRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="ml-auto h-full w-64 bg-white p-4 shadow-2xl duration-200 animate-in slide-in-from-right dark:bg-[#0d1117]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Navigation</span>
              <button
                ref={mobileCloseButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close mobile navigation"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="grid gap-1" aria-label="Mobile">
              {mobileNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={link.page === page ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-3 py-2 text-sm font-bold uppercase transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
