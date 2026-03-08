import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, LogOut, Menu, MoonStar, PanelTop, SunMedium, X } from "lucide-react";
import logoUrl from "../../logo.png";
import { buildAvatarLabel } from "../lib/supabase";
import { useAuth, useTheme } from "../providers/AppProviders";

type PageKey =
  | "home"
  | "docs"
  | "reference"
  | "converter"
  | "community"
  | "login"
  | "signup"
  | "dashboard"
  | "terms"
  | "license"
  | "notfound";

interface AppShellProps {
  page: PageKey;
  children: ReactNode;
}

const primaryLinks: Array<{ href: string; label: string; page: PageKey }> = [
  { href: "docs.html", label: "Docs", page: "docs" },
  { href: "reference.html", label: "Reference", page: "reference" },
  { href: "community.html", label: "Community", page: "community" }
];

const mobileLinks: Array<{ href: string; label: string; page?: PageKey }> = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "docs.html", label: "Docs", page: "docs" },
  { href: "reference.html", label: "Reference", page: "reference" },
  { href: "converter.html", label: "Workspace", page: "converter" },
  { href: "community.html", label: "Community", page: "community" }
];

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
    <div className="site-shell min-h-screen text-slate-950 dark:text-white">
      <header className="sticky top-0 z-40 pt-4">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-5">
          <div className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/82 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/78">
            <a href="index.html" className="group flex min-w-0 items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:border-slate-700/60 dark:bg-slate-900/70">
                <img src={logoUrl} alt="text2scratch logo" className="h-full w-full object-cover" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block text-[0.98rem] font-semibold tracking-tight text-slate-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-200">
                  text2scratch
                </span>
                <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 xl:block dark:text-slate-500">
                  Plain-text Scratch authoring
                </span>
              </span>
            </a>

            <nav className="hidden flex-1 justify-center lg:flex" aria-label="Primary">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/90 p-1 dark:border-slate-700/60 dark:bg-slate-900/72">
                {primaryLinks.map((link) => {
                  const active = link.page === page;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] dark:bg-blue-500 dark:text-white"
                          : "text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <a
                href="converter.html"
                className={`hidden items-center rounded-full px-4 py-2.5 text-sm font-semibold transition sm:inline-flex ${
                  page === "converter"
                    ? "bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] dark:bg-blue-500 dark:text-white"
                    : "border border-slate-200/80 bg-white/82 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:text-slate-950 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:text-white"
                }`}
              >
                Workspace
              </a>

              <button
                type="button"
                onClick={() => setMode(mode === "dark" || isDark ? "light" : "dark")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-slate-950 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:text-white"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </button>

              {user ? (
                <div ref={accountMenuRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((current) => !current)}
                    className={`inline-flex max-w-[15rem] items-center gap-3 rounded-full border px-3 py-2 text-left text-sm font-medium transition ${
                      accountOpen
                        ? "border-blue-600 bg-blue-600 text-white shadow-[0_16px_36px_rgba(37,99,235,0.24)] dark:border-blue-500 dark:bg-blue-500 dark:text-white"
                        : "border-slate-200/80 bg-white/82 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:text-slate-950 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:text-white"
                    }`}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                  >
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      accountOpen
                        ? "bg-white text-blue-700 dark:bg-slate-950 dark:text-white"
                        : "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                    }`}>
                      {buildAvatarLabel(accountLabel)}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[8rem] truncate font-semibold">{accountLabel}</span>
                      <span className={`block max-w-[8rem] truncate text-[11px] uppercase tracking-[0.14em] ${
                        accountOpen ? "text-white/70 dark:text-slate-500" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        Account
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition ${accountOpen ? "rotate-180" : ""}`} />
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.8rem)] w-[18rem] overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/96 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/96">
                      <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/60 dark:bg-slate-900/72">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-blue-500 dark:text-white">
                            {buildAvatarLabel(accountLabel)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{accountLabel}</p>
                            {userEmail ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userEmail}</p> : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1.5">
                        <a
                          href={dashboardLink}
                          onClick={() => setAccountOpen(false)}
                          className="rounded-[1.1rem] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white"
                        >
                          Profile and settings
                        </a>
                        <a
                          href="dashboard.html"
                          onClick={() => setAccountOpen(false)}
                          className="rounded-[1.1rem] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white"
                        >
                          Dashboard overview
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            void signOut();
                          }}
                          className="inline-flex items-center gap-2 rounded-[1.1rem] px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <a
                    href="login.html"
                    className={`hidden rounded-full border px-4 py-2.5 text-sm font-semibold transition md:inline-flex ${
                      page === "login"
                        ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500 dark:text-white"
                        : "border-slate-200/80 bg-white/82 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:text-slate-950 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:text-white"
                    }`}
                  >
                    Login
                  </a>
                  <a
                    href="signup.html"
                    className={`inline-flex rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_14px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 ${
                      page === "signup"
                        ? "bg-blue-600 text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] dark:bg-blue-500 dark:text-white"
                        : "bg-blue-600 text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400"
                    }`}
                  >
                    Sign up
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-slate-950 lg:hidden dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:text-white"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mobileOpen ? (
            <div className="mt-3 overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.10)] lg:hidden dark:border-slate-700/60 dark:bg-slate-950/92">
              <nav aria-label="Mobile primary" className="grid gap-2">
                {mobileLinks.map((link) => {
                  const active = link.page === page;
                  return (
                    <a
                      key={`mobile-${link.href}`}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-[1.2rem] px-4 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                          : "border border-slate-200/80 text-slate-700 hover:border-blue-200 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700/60 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:bg-slate-800/80 dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}

                {user ? (
                  <div className="mt-2 rounded-[1.4rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-700/60 dark:bg-slate-900/72">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-blue-500 dark:text-white">
                        {buildAvatarLabel(accountLabel)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{accountLabel}</p>
                        {userEmail ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userEmail}</p> : null}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <a
                        href={dashboardLink}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-[1.1rem] border border-slate-200/80 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700/60 dark:text-slate-200"
                      >
                        Dashboard
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          void signOut();
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-blue-600 px-4 py-3 text-sm font-semibold text-white dark:bg-blue-500 dark:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <a
                      href="login.html"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-[1.1rem] border border-slate-200/80 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700/60 dark:text-slate-200"
                    >
                      Login
                    </a>
                    <a
                      href="signup.html"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-[1.1rem] bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-blue-500 dark:text-white"
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

      <footer className="border-t border-slate-200/70 bg-white/78 dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-900/72">
              <img src={logoUrl} alt="text2scratch logo" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white">text2scratch</p>
              <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Write Scratch projects in text, check the syntax, and export real `.sb3` files.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <a href="converter.html" className="transition hover:text-slate-950 dark:hover:text-white">Workspace</a>
            <a href="community.html" className="transition hover:text-slate-950 dark:hover:text-white">Community</a>
            <a href="dashboard.html" className="transition hover:text-slate-950 dark:hover:text-white">Dashboard</a>
            <a href="privacy.html" className="transition hover:text-slate-950 dark:hover:text-white">Privacy</a>
            <a href="terms.html" className="transition hover:text-slate-950 dark:hover:text-white">Terms</a>
            <a href="license.html" className="transition hover:text-slate-950 dark:hover:text-white">License</a>
            <a href="dev/" className="inline-flex items-center gap-1 transition hover:text-slate-950 dark:hover:text-white">
              <PanelTop className="h-4 w-4" />
              /dev
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
