import { ArrowLeft, Home, SearchX } from "lucide-react";
import { AppShell } from "../components/AppShell";

export function NotFoundPage() {
  return (
    <AppShell page="notfound">
      <div className="flex h-full flex-col items-center justify-center bg-[#f6f8fa] p-6 text-center dark:bg-[#0d1117]">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[#161b22] dark:border dark:border-slate-800">
          <SearchX size={40} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h1 className="mb-2 text-3xl font-black tracking-tighter text-slate-900 dark:text-white">404: Node Not Found</h1>
        <p className="mb-8 max-w-sm text-[0.95rem] text-slate-500 dark:text-slate-400">
          The requested authoring node or project directory does not exist in the current production registry.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="index.html" className="inline-flex items-center gap-2 rounded-md bg-[#2da44e] px-5 py-2 text-sm font-bold text-white hover:bg-[#2c974b] shadow-sm transition-transform active:scale-95">
            <Home size={16} /> Return to Core
          </a>
          <a href="converter.html" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-200 transition-transform active:scale-95">
            <ArrowLeft size={16} /> Previous Node
          </a>
        </div>
        <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-400">Error_Registry_v1.0</p>
        </div>
      </div>
    </AppShell>
  );
}
