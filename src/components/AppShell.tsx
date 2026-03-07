import { useState, type ReactNode } from "react";
import { Menu, MoonStar, PanelTop, SunMedium, X } from "lucide-react";
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

const links: Array<{ href: string; label: string; page?: PageKey }> = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "docs.html", label: "Docs", page: "docs" },
  { href: "reference.html", label: "Reference", page: "reference" },
  { href: "converter.html", label: "Workspace", page: "converter" },
  { href: "community.html", label: "Community", page: "community" },
  { href: "dashboard.html", label: "Dashboard", page: "dashboard" }
];

export function AppShell({ page, children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { mode, resolvedMode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#020817_100%)] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4">
          <a href="index.html" className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950 dark:text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-slate-950 text-sm font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white dark:text-slate-950">
              t2s
            </span>
            <span className="hidden sm:block">
              <span className="block text-base font-semibold">text2scratch</span>
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Plain-text Scratch authoring</span>
            </span>
          </a>

          <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
            {links.map((link) => {
              const active = link.page === page;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-black/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "dark" || resolvedMode === "dark" ? "light" : "dark")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
            >
              {resolvedMode === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              <span className="hidden sm:inline">{resolvedMode === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            {user ? (
              <>
                <a
                  href="dashboard.html"
                  className="hidden rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-black/20 hover:text-slate-950 md:inline-flex dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                >
                  {user.email?.split("@")[0] || "Dashboard"}
                </a>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a
                  href="login.html"
                  className={`hidden rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold transition md:inline-flex ${
                    page === "login"
                      ? "bg-black text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-700 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                  }`}
                >
                  Login
                </a>
                <a
                  href="signup.html"
                  className={`inline-flex rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_14px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 ${
                    page === "signup"
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  }`}
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>

        <div className={`border-t border-black/5 px-5 pb-4 pt-3 lg:hidden dark:border-white/10 ${mobileOpen ? "block" : "hidden"}`}>
          <nav aria-label="Mobile primary" className="flex flex-col gap-2">
            {links.map((link) => {
              const active = link.page === page;
              return (
                <a
                  key={`mobile-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "border border-black/10 text-slate-700 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            {!user ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href="login.html"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                >
                  Login
                </a>
                <a
                  href="signup.html"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                >
                  Sign Up
                </a>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-black/5 bg-white/85 dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white">text2scratch</p>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              A cleaner way to author Scratch projects with plain text, exact syntax guidance, and a developer-grade workflow.
            </p>
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
