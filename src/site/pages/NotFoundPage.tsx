import { ArrowLeft, Home, SearchX, Terminal } from "lucide-react";
import { AppShell } from "../components/AppShell";

export function NotFoundPage() {
  return (
    <AppShell page="notfound">
      <section className="relative mx-auto flex min-h-[85vh] w-full max-w-7xl items-center px-6 py-20 overflow-hidden">
        {/* Decorative background effects */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
        
        <div className="relative z-10 grid w-full gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-500 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <Terminal className="h-4 w-4" />
                Error Protocol 404
              </span>
              <h1 className="text-7xl font-extrabold tracking-tighter text-slate-950 dark:text-white sm:text-8xl">
                Lost in the <span className="text-blue-600">Source.</span>
              </h1>
              <p className="max-w-xl text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                The identifier you requested does not exist in our production registry. It may have been deprecated, moved, or never initialized.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="index.html" className="group inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-8 py-4 text-[1rem] font-bold text-white shadow-2xl transition-all hover:-translate-y-1 hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                <Home className="h-5 w-5" />
                Return to Core
              </a>
              <a href="converter.html" className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-[1rem] font-bold text-slate-700 transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Open Workspace
              </a>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-white/5">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Suggested nodes</p>
              <div className="mt-4 flex gap-6 text-sm font-bold text-slate-500">
                <a href="docs.html" className="hover:text-blue-600 transition-colors">Documentation</a>
                <a href="reference.html" className="hover:text-blue-600 transition-colors">Reference</a>
                <a href="community.html" className="hover:text-blue-600 transition-colors">Community</a>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block animate-in fade-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent blur-3xl"></div>
            <div className="relative rounded-[3rem] border border-slate-200 bg-white/80 p-12 shadow-[0_50px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-8 dark:border-white/5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="ml-4 h-4 w-32 rounded-full bg-slate-100 dark:bg-white/5"></div>
              </div>
              <div className="mt-10 space-y-6">
                <div className="h-4 w-full rounded-full bg-slate-50 dark:bg-white/5"></div>
                <div className="h-4 w-3/4 rounded-full bg-slate-50 dark:bg-white/5"></div>
                <div className="h-20 w-full rounded-3xl bg-blue-600/5 border border-blue-600/10 flex items-center justify-center">
                   <SearchX className="h-10 w-10 text-blue-600/40" />
                </div>
                <div className="h-4 w-5/6 rounded-full bg-slate-50 dark:bg-white/5"></div>
                <div className="h-4 w-1/2 rounded-full bg-slate-50 dark:bg-white/5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
