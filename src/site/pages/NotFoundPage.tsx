import { ArrowLeft, SearchX } from "lucide-react";
import { AppShell } from "../components/AppShell";

export function NotFoundPage() {
  return (
    <AppShell page="notfound">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-5 py-20">
        <div className="w-full rounded-[2.5rem] border border-black/10 bg-white/90 p-10 text-center shadow-[0_28px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
            <SearchX className="h-8 w-8" />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">404</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">That page does not exist.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Use the home page to understand the product, or jump straight into docs, reference, or the workspace if you already know where you want to go.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="index.html" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </a>
            <a href="reference.html" className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
              Open reference
            </a>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
