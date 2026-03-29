import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, LogOut, Menu, MoonStar, PanelTop, SunMedium, X } from "lucide-react";
import logoUrl from "../../../logo.png";
import { mobileNavLinks, primaryNavLinks, type AppPageKey } from "../config/pages";
import { buildAvatarLabel } from "../lib/supabase";
import { useAuth, useTheme } from "../providers/AppProviders";

interface AppShellProps {
  page: AppPageKey;
  children: ReactNode;
}

export function AppShell({ page, children }: AppShellProps) {
  const { user, profile, signOut } = useAuth();
  const { mode, resolvedMode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountLabel = profile?.username?.trim()
    || String(user?.user_metadata?.username || "").trim()
    || user?.email?.split("@")[0]
    || "Profile";
  const userEmail = user?.email?.trim() || "";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current || accountMenuRef.current.contains(event.target as Node)) {
        return;
      }

      setAccountOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      setAccountOpen(false);
    }
  }, [mobileOpen]);

  const isDark = resolvedMode === "dark";
  const dashboardLink = "dashboard.html#profile";

  return (
    <div className="site-shell min-h-screen text-slate-950 dark:text-white selection:bg-blue-600/10 selection:text-blue-700 dark:selection:bg-blue-500/20 dark:selection:text-blue-300">
      <header className="sticky top-0 z-40 pt-6">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-4 rounded-[2rem] border border-slate-200/60 bg-white/70 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition-all duration-300 hover:border-slate-300/60 hover:shadow-[0_25px_70px_rgba(15,23,42,0.1)] dark:border-slate-800/40 dark:bg-slate-950/60 dark:hover:border-slate-700/60">
            <a href="index.html" className="group flex min-w-0 items-center gap-3.5">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-transform duration-300 group-hover:scale-105 dark:border-slate-700/40 dark:bg-slate-900/50">
                <img src={logoUrl} alt="text2scratch logo" className="h-full w-full object-cover" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block text-[1.05rem] font-bold tracking-tight text-slate-950 transition-colors duration-300 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  text2scratch
                </span>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 xl:block dark:text-slate-500">
                  Authoring platform
                </span>
              </span>
            </a>

            <nav className="hidden flex-1 justify-center lg:flex" aria-label="Primary">
              <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-1.5 backdrop-blur-sm dark:border-slate-800/40 dark:bg-slate-900/40">
                {primaryNavLinks.map((link) => {
                  const active = link.page === page;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-5 py-2.5 text-[0.88rem] font-bold transition-all duration-200 ${
                        active
                          ? "bg-white text-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.08)] dark:bg-slate-800 dark:text-blue-400"
                          : "text-slate-500 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <a
                href="converter.html"
                className={`hidden items-center rounded-xl px-5 py-2.5 text-[0.88rem] font-bold transition-all duration-300 sm:inline-flex ${
                  page === "converter"
                    ? "bg-blue-600 text-white shadow-[0_15px_35px_rgba(37,99,235,0.22)] dark:bg-blue-500"
                    : "border border-slate-200/60 bg-white/50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-white hover:text-slate-950 hover:shadow-md dark:border-slate-800/40 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/60 dark:hover:text-white"
                }`}
              >
                Workspace
              </a>

              <button
                type="button"
                onClick={() => setMode(mode === "dark" || isDark ? "light" : "dark")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-white hover:text-slate-950 hover:shadow-md dark:border-slate-800/40 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/60 dark:hover:text-white"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
              </button>

              {user ? (
                <div ref={accountMenuRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((current) => !current)}
                    className={`inline-flex max-w-[15rem] items-center gap-3.5 rounded-xl border px-3.5 py-2 text-left text-[0.88rem] font-bold transition-all duration-300 ${
                      accountOpen
                        ? "border-blue-600 bg-blue-600 text-white shadow-[0_15px_35px_rgba(37,99,235,0.22)] dark:border-blue-500 dark:bg-blue-500"
                        : "border-slate-200/60 bg-white/50 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:text-slate-950 hover:shadow-md dark:border-slate-800/40 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/60 dark:hover:text-white"
                    }`}
                    aria-expanded={accountOpen}
                  >
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm ${
                      accountOpen
                        ? "bg-white text-blue-600 dark:bg-slate-900"
                        : "bg-blue-600 text-white dark:bg-blue-500"
                    }`}>
                      {buildAvatarLabel(accountLabel)}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[8rem] truncate font-bold">{accountLabel}</span>
                      <span className={`block max-w-[8rem] truncate text-[9px] uppercase tracking-[0.25em] ${
                        accountOpen ? "text-white/70" : "text-slate-400"
                      }`}>
                        Account
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${accountOpen ? "rotate-180" : ""}`} />
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[19rem] overflow-hidden rounded-[1.8rem] border border-slate-200/60 bg-white/95 p-2.5 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-slate-800/40 dark:bg-slate-950/95">
                      <div className="rounded-[1.4rem] border border-slate-200/50 bg-slate-50/50 p-4 dark:border-slate-800/40 dark:bg-slate-900/40">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-[1.1rem] font-bold text-white shadow-lg dark:bg-blue-500">
                            {buildAvatarLabel(accountLabel)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[1rem] font-bold text-slate-950 dark:text-white">{accountLabel}</p>
                            {userEmail ? <p className="truncate text-[0.8rem] text-slate-500 dark:text-slate-400">{userEmail}</p> : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 grid gap-1">
                        <a
                          href={dashboardLink}
                          onClick={() => setAccountOpen(false)}
                          className="rounded-xl px-4.5 py-3.5 text-[0.9rem] font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                          Profile and settings
                        </a>
                        <a
                          href="dashboard.html"
                          onClick={() => setAccountOpen(false)}
                          className="rounded-xl px-4.5 py-3.5 text-[0.9rem] font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                          Dashboard overview
                        </a>
                        <div className="mx-2 my-1 border-t border-slate-100 dark:border-white/5"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            void signOut();
                          }}
                          className="inline-flex items-center gap-3 rounded-xl px-4.5 py-3.5 text-[0.9rem] font-bold text-rose-600 transition-all duration-200 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4.5 w-4.5" />
                          Sign out of session
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <a
                    href="login.html"
                    className={`hidden rounded-xl px-5 py-2.5 text-[0.88rem] font-bold transition-all duration-300 md:inline-flex ${
                      page === "login"
                        ? "bg-blue-600 text-white shadow-lg dark:bg-blue-500"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    Login
                  </a>
                  <a
                    href="signup.html"
                    className="inline-flex rounded-xl bg-blue-600 px-6 py-2.5 text-[0.88rem] font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_15px_35px_rgba(37,99,235,0.3)] dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    Sign up
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 text-slate-500 transition-all duration-300 hover:border-blue-400/30 hover:bg-white lg:hidden dark:border-slate-800/40 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/60"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileOpen ? (
            <div className="mt-4 overflow-hidden rounded-[2.2rem] border border-slate-200/60 bg-white/95 p-3.5 shadow-[0_30px_80px_rgba(15,23,42,0.15)] backdrop-blur-2xl lg:hidden dark:border-slate-800/40 dark:bg-slate-950/92">
              <nav aria-label="Mobile primary" className="grid gap-1.5">
                {mobileNavLinks.map((link) => {
                  const active = link.page === page;
                  return (
                    <a
                      key={`mobile-${link.href}`}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-2xl px-5 py-4 text-[0.95rem] font-bold transition-all duration-200 ${
                        active
                          ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}

                {user ? (
                  <div className="mt-3 rounded-[1.8rem] border border-slate-200/50 bg-slate-50/50 p-4 dark:border-slate-800/40 dark:bg-slate-900/40">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-[1rem] font-bold text-white shadow-md dark:bg-blue-500">
                        {buildAvatarLabel(accountLabel)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[0.95rem] font-bold text-slate-950 dark:text-white">{accountLabel}</p>
                        {userEmail ? <p className="truncate text-[0.75rem] text-slate-500 dark:text-slate-400">{userEmail}</p> : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <a
                        href={dashboardLink}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-xl border border-slate-200/60 bg-white px-4 py-3 text-center text-[0.85rem] font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Dashboard
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          void signOut();
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-[0.85rem] font-bold text-white shadow-md transition-colors hover:bg-rose-700 dark:bg-rose-500"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <a
                      href="login.html"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl border border-slate-200/60 bg-white px-5 py-4 text-center text-[0.95rem] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Login
                    </a>
                    <a
                      href="signup.html"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl bg-blue-600 px-5 py-4 text-center text-[0.95rem] font-bold text-white shadow-[0_10px_25px_rgba(37,99,235,0.2)] transition-colors hover:bg-blue-700 dark:bg-blue-500"
                    >
                      Sign up
                    </a>
                  </div>
                )}
              </nav>
            </div>
          ) : null}
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-slate-200/50 bg-white/60 pb-16 pt-20 dark:border-slate-800/50 dark:bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md space-y-6">
              <div className="flex items-center gap-3.5">
                <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800/60 dark:bg-slate-900/40">
                  <img src={logoUrl} alt="text2scratch logo" className="h-full w-full object-cover" />
                </span>
                <span className="text-[1.25rem] font-extrabold tracking-tight text-slate-950 dark:text-white">text2scratch</span>
              </div>
              <p className="text-[1rem] leading-relaxed text-slate-600 dark:text-slate-400">
                The ultimate plain-text authoring platform for Scratch. Create complex projects with precision, speed, and real syntax validation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
              <div className="space-y-5">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400">Platform</p>
                <nav className="grid gap-3.5 text-[0.9rem] font-semibold">
                  <a href="converter.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Workspace</a>
                  <a href="community.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Community</a>
                  <a href="dashboard.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Dashboard</a>
                  <a href="docs.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Documentation</a>
                </nav>
              </div>
              <div className="space-y-5">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400">Legal</p>
                <nav className="grid gap-3.5 text-[0.9rem] font-semibold">
                  <a href="privacy.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Privacy Policy</a>
                  <a href="terms.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">Terms of Service</a>
                  <a href="license.html" className="text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">License</a>
                </nav>
              </div>
              <div className="hidden space-y-5 sm:block">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400">Dev</p>
                <nav className="grid gap-3.5 text-[0.9rem] font-semibold">
                  <a href="dev/" className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                    <PanelTop className="h-4.5 w-4.5" />
                    Internal Tools
                  </a>
                </nav>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 border-t border-slate-100 pt-10 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.85rem] font-medium text-slate-400">
              &copy; {new Date().getFullYear()} text2scratch. Built for the next generation of Scratch creators.
            </p>
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[0.75rem] font-bold text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                System Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
