import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, Loader2, Menu, MoonStar, SunMedium, Trash2, X } from "lucide-react";
import { mobileNavLinks, primaryNavLinks, type AppPageKey } from "../config/pages";
import { createErrorReport } from "../lib/errorReports";
import { buildAvatarLabel, buildUserHandle } from "../lib/supabase";
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
  const [updateAvailable, setUpdateAvailable] = useState(false);
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
    if (import.meta.env.DEV || updateAvailable) {
      return;
    }

    const interval = setInterval(() => {
      fetch(window.location.origin + window.location.pathname, { method: "HEAD", cache: "no-store" })
        .then((response) => {
          const etag = response.headers.get("etag");
          const lastModified = response.headers.get("last-modified");
          const currentEtag = readSessionValue("text2scratch.deploy_etag");
          const currentLastModified = readSessionValue("text2scratch.deploy_lastmod");
          const hasChanged = (
            (currentEtag && etag && currentEtag !== etag)
            || (currentLastModified && lastModified && currentLastModified !== lastModified)
          );

          if (hasChanged) {
            if (page === "converter") {
              setUpdateAvailable(true);
            } else {
              window.location.reload();
            }
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
  }, [page, updateAvailable]);

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
  const accountLabel = buildUserHandle(user, profile?.username, "Profile");

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
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#eef1f7] dark:bg-[#07090f]">
        <div className="mb-6 h-16 w-16 animate-bounce">
          <img
            src={logoUrl}
            alt="text2scratch logo"
            className="h-full w-full rounded-2xl bg-white p-1.5 shadow-xl dark:bg-slate-800"
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
    <div className="site-shell min-h-screen text-slate-900 selection:bg-blue-500/25 dark:text-slate-200">
      <a
        href="#main-content"
        className="sr-only z-[120] rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3 dark:bg-slate-900 dark:text-white"
      >
        Skip to main content
      </a>

      <div ref={shellContentRef}>
        {/* ── Header ── */}
        <header
          className="sticky top-0 z-50 h-12 border-b border-white/10 text-white dark:border-slate-800/70"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #0c1426 0%, #111c30 100%)"
              : "linear-gradient(135deg, #2573e8 0%, #4d97ff 60%, #5ea4ff 100%)",
            boxShadow: isDark
              ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)"
              : "0 1px 0 rgba(255,255,255,0.15), 0 4px 20px rgba(37,115,232,0.35)",
          }}
        >
          <div className="mx-auto flex h-full items-center gap-4 px-2">
            <a href="index.html" className="flex min-w-[130px] items-center gap-2 hover:opacity-90" aria-label="Open the text2scratch home page">
              <img src={logoUrl} alt="text2scratch logo" className="h-6 w-6 rounded-lg bg-white/15 p-0.5 shadow-sm ring-1 ring-white/20" />
              <span className="text-[0.9rem] font-black tracking-tighter drop-shadow-sm">
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
                  className={`rounded-lg px-3 py-1.5 text-[0.74rem] font-bold uppercase tracking-wider transition-all ${
                    link.page === page
                      ? "bg-white/22 text-white shadow-sm ring-1 ring-white/25"
                      : "text-white/75 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Notifications */}
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
                  className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/15 ${notifsOpen ? "bg-white/15" : ""}`}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-white/20" aria-hidden="true" />
                  )}
                </button>

                {notifsOpen && (
                  <div
                    id="notifications-panel"
                    role="dialog"
                    aria-modal="false"
                    aria-label="Notifications"
                    className="dropdown-content absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-[#101827]/95"
                  >
                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 p-2 dark:border-slate-800">
                      <span className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">Notifications</span>
                      <button
                        type="button"
                        data-autofocus
                        onClick={clearAll}
                        aria-label="Clear notifications"
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="max-h-64 space-y-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">No signals</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-xl border border-transparent p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                            }`}
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <span className="text-[0.68rem] font-black uppercase tracking-tight text-[#4d97ff]">
                                {notification.title}
                              </span>
                              <span className="text-[0.63rem] font-bold text-slate-400">{notification.time}</span>
                            </div>
                            <p className="text-[0.7rem] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                              {notification.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setMode(isDark ? "light" : "dark")}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/15"
              >
                {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
              </button>

              {/* Account or sign in */}
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
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/12 px-2 py-1 transition-colors hover:bg-white/22"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-700/70 text-[0.6rem] font-black uppercase ring-1 ring-white/20">
                      {buildAvatarLabel(accountLabel)}
                    </span>
                    <span className="max-w-[80px] truncate text-[0.73rem] font-bold uppercase">{accountLabel}</span>
                    <ChevronDown size={11} className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                  </button>

                  {accountOpen && (
                    <div
                      id="account-menu"
                      role="menu"
                      className="absolute right-0 top-full mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 py-1 text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-[#101827]/95 dark:text-slate-200"
                    >
                      <a
                        href="dashboard.html"
                        role="menuitem"
                        data-autofocus
                        className="block px-4 py-2 text-[0.73rem] font-bold transition-colors hover:bg-[#4d97ff] hover:text-white"
                      >
                        DASHBOARD
                      </a>
                      <a
                        href="dashboard.html#profile"
                        role="menuitem"
                        className="block px-4 py-2 text-[0.73rem] font-bold transition-colors hover:bg-[#4d97ff] hover:text-white"
                      >
                        SETTINGS
                      </a>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" aria-hidden="true" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleSignOut()}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-[0.73rem] font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        SIGN OUT
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <a href="login.html" className="text-[0.73rem] font-black uppercase text-white/85 hover:text-white hover:underline">Sign In</a>
                  <a href="signup.html" className="rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-[0.73rem] font-black uppercase text-white shadow-sm hover:bg-white/25 active:scale-95">
                    Join
                  </a>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                ref={mobileButtonRef}
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                aria-haspopup="dialog"
                aria-label="Open mobile navigation"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 lg:hidden"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </header>

        {updateAvailable && (
          <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950 dark:border-amber-900/30 dark:bg-amber-900/15 dark:text-amber-100">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <p>A new deployment is available. Refresh when you are ready so unsaved workspace changes are not lost.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-widest text-white hover:bg-amber-700"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className={isWorkspace ? "h-[calc(100vh-3rem)] overflow-hidden" : "pt-4"}>
          {children}
        </main>

        {!isWorkspace && (
          <footer className="mt-16 border-t border-slate-200/70 py-10 dark:border-slate-800/60" style={{ background: isDark ? "linear-gradient(180deg, #07090f 0%, #0a0d15 100%)" : "linear-gradient(180deg, #f8fafd 0%, #ffffff 100%)" }}>
            <div className="mx-auto max-w-5xl px-4 text-center sm:text-left">
              <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                <div className="flex items-center gap-2.5">
                  <img src={logoUrl} alt="text2scratch logo" className="h-6 w-6 rounded-lg border border-slate-200/80 p-0.5 shadow-sm dark:border-slate-700" />
                  <span className="text-sm font-black tracking-tighter text-slate-800 dark:text-slate-200">text2scratch</span>
                </div>
                <div className="flex gap-6 text-[0.73rem] font-black uppercase tracking-widest text-slate-400">
                  <a href="privacy.html" className="hover:text-[#4d97ff] transition-colors">Privacy</a>
                  <a href="terms.html" className="hover:text-[#4d97ff] transition-colors">Terms</a>
                  <a href="docs.html" className="hover:text-[#4d97ff] transition-colors">Docs</a>
                  <a href="https://github.com/Zhiyuanbu/Text2scratch" className="hover:text-[#4d97ff] transition-colors">GitHub</a>
                </div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-400">2026 text2scratch</p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            ref={mobileDialogRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="ml-auto h-full w-64 bg-white/95 p-5 shadow-2xl backdrop-blur-xl duration-200 animate-in slide-in-from-right dark:bg-[#0d1423]/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">Navigation</span>
              <button
                ref={mobileCloseButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close mobile navigation"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="grid gap-1" aria-label="Mobile">
              {mobileNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={link.page === page ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                    link.page === page
                      ? "bg-blue-50 text-[#4d97ff] dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
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
