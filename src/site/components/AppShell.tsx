import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, Loader2, Menu, MoonStar, SunMedium, Trash2, X } from "lucide-react";
import { mobileNavLinks, primaryNavLinks, type AppPageKey } from "../config/pages";
import { buildAvatarLabel } from "../lib/supabase";
import { useAuth, useTheme, useNotifications } from "../providers/AppProviders";

interface AppShellProps {
  page: AppPageKey;
  children: ReactNode;
}

const AUTH_BLOCKING_PAGES = new Set<AppPageKey>(["converter", "dashboard"]);
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
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const { mode, resolvedMode, setMode } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notifsMenuRef = useRef<HTMLDivElement | null>(null);
  const fullBrandName = "text2scratch";
  
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const interval = setInterval(() => {
      fetch(window.location.origin + window.location.pathname, { method: "HEAD", cache: "no-store" })
        .then((resp) => {
          const etag = resp.headers.get("etag");
          const lastMod = resp.headers.get("last-modified");
          const currentEtag = readSessionValue("text2scratch.deploy_etag");
          const currentLastMod = readSessionValue("text2scratch.deploy_lastmod");
          
          if (currentEtag && etag && currentEtag !== etag) window.location.reload();
          else if (currentLastMod && lastMod && currentLastMod !== lastMod) window.location.reload();
          
          if (etag) writeSessionValue("text2scratch.deploy_etag", etag);
          if (lastMod) writeSessionValue("text2scratch.deploy_lastmod", lastMod);
        })
        .catch(() => {});
    }, 1000 * 60 * 5); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (readSessionValue("text2scratch.intro_played")) {
      setTypewriterText(fullBrandName);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setTypewriterText(fullBrandName.slice(0, i));
      i++;
      if (i > fullBrandName.length) {
        clearInterval(interval);
        writeSessionValue("text2scratch.intro_played", "true");
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 200);
    return () => clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountOpen(false);
      }
      if (notifsMenuRef.current && !notifsMenuRef.current.contains(target)) {
        setNotifsOpen(false);
      }
    }
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const isDark = resolvedMode === "dark";
  const isWorkspace = page === "converter";
  const accountLabel = profile?.username?.trim()
    || String(user?.user_metadata?.username || "").trim()
    || user?.email?.split("@")[0]
    || "Profile";

  if (isPageLoading || (authLoading && AUTH_BLOCKING_PAGES.has(page))) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f9f9f9] dark:bg-[#0d1117]">
        <div className="mb-6 h-16 w-16 animate-bounce">
          <img src={logoUrl} alt="Loading..." className="h-full w-full rounded-xl bg-white p-1 shadow-lg dark:bg-slate-800" />
        </div>
        <div className="flex items-center gap-3 text-sm font-black tracking-widest uppercase text-[#4d97ff]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Synchronizing Registry...
        </div>
      </div>
    );
  }

  return (
    <div className={`site-shell min-h-screen bg-[#f0f0f0] text-slate-900 dark:bg-[#0d1117] dark:text-slate-200 selection:bg-blue-500/30`}>
      {/* Scratch-style functional top bar */}
      <header className="sticky top-0 z-50 h-12 border-b border-black/10 bg-[#4d97ff] text-white dark:bg-[#161b22] dark:border-slate-800 shadow-sm">
        <div className="mx-auto flex h-full items-center gap-4 px-2">
          <a href="index.html" className="flex items-center gap-2 hover:opacity-90 min-w-[130px]">
            <img src={logoUrl} alt="" className="h-6 w-6 rounded bg-white p-0.5" />
            <span className="text-[0.9rem] font-black tracking-tighter">
              {typewriterText}<span className="animate-pulse">|</span>
            </span>
          </a>

          <div className="h-5 w-px bg-white/20"></div>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {primaryNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
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
            {/* Notifications */}
            <div ref={notifsMenuRef} className="relative">
              <button
                onClick={() => {
                  setNotifsOpen(!notifsOpen);
                  if (!notifsOpen) markAllRead();
                }}
                type="button"
                aria-expanded={notifsOpen}
                aria-label="Open notifications"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/10 relative ${notifsOpen ? "bg-black/10" : ""}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#4d97ff] dark:ring-[#161b22]" />
                )}
              </button>

              {notifsOpen && (
                <div className="dropdown-content absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
                  <div className="flex items-center justify-between p-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                    <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Notifications</span>
                    <button type="button" onClick={clearAll} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No signals</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[0.7rem] font-black text-[#4d97ff] dark:text-blue-400 uppercase tracking-tight">{n.title}</span>
                            <span className="text-[0.55rem] font-bold text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[0.7rem] font-medium text-slate-600 dark:text-slate-400 leading-tight">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMode(isDark ? "light" : "dark")}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/10 transition-colors"
            >
              {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
            </button>

            {user ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-expanded={accountOpen}
                  aria-label="Open account menu"
                  className="flex items-center gap-2 rounded bg-black/10 px-2 py-1 hover:bg-black/20 transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-blue-600 text-[0.6rem] font-black uppercase">
                    {buildAvatarLabel(accountLabel)}
                  </span>
                  <span className="max-w-[80px] truncate text-[0.75rem] font-bold uppercase">{accountLabel}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded border border-slate-200 bg-white py-1 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    <a href="dashboard.html" className="block px-4 py-1.5 text-[0.75rem] font-bold hover:bg-[#4d97ff] hover:text-white transition-colors">DASHBOARD</a>
                    <a href="dashboard.html#profile" className="block px-4 py-1.5 text-[0.75rem] font-bold hover:bg-[#4d97ff] hover:text-white transition-colors">SETTINGS</a>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                    <button
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-[0.75rem] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      SIGN OUT
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a href="login.html" className="text-[0.75rem] font-black uppercase hover:underline">Sign In</a>
                <a href="signup.html" className="rounded bg-white px-3 py-1 text-[0.75rem] font-black uppercase text-[#4d97ff] shadow-sm hover:bg-slate-50 transition-transform active:scale-95">Join</a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Open mobile navigation"
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/10 lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="ml-auto h-full w-64 bg-white p-4 dark:bg-[#0d1117] shadow-2xl animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Navigation</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close mobile navigation"><X size={20} /></button>
            </div>
            <nav className="grid gap-1">
              {mobileNavLinks.map(link => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded px-3 py-2 text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className={isWorkspace ? "h-[calc(100vh-3rem)] overflow-hidden" : "pt-4"}>
        {children}
      </main>

      {!isWorkspace && (
        <footer className="mt-12 border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-[#0d1117]">
          <div className="mx-auto max-w-5xl px-4 text-center sm:text-left">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="flex items-center gap-2">
                <img src={logoUrl} alt="" className="h-6 w-6 rounded border border-slate-100 p-0.5" />
                <span className="text-sm font-black tracking-tighter">text2scratch</span>
              </div>
              <div className="flex gap-6 text-[0.7rem] font-black uppercase tracking-widest text-slate-500">
                <a href="privacy.html" className="hover:text-[#4d97ff]">Privacy</a>
                <a href="terms.html" className="hover:text-[#4d97ff]">Terms</a>
                <a href="docs.html" className="hover:text-[#4d97ff]">Docs</a>
                <a href="https://github.com/Zhiyuanbu/Text2scratch" className="hover:text-[#4d97ff]">GitHub</a>
              </div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">© {new Date().getFullYear()} text2scratch</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
