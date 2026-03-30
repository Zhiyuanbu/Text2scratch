import type { ReactNode } from "react";
import { Globe, RefreshCw, Rocket, Sparkles, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { getReferenceEntries } from "../lib/blocks";
import { AppShell } from "../components/AppShell";
import { supabaseClient, CLOUD_TABLE } from "../lib/supabase";

export function HomePage() {
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const commandCount = getReferenceEntries().length;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count } = await supabaseClient
          .from(CLOUD_TABLE)
          .select("*", { count: "exact", head: true });
        if (count !== null) setProjectCount(count);
      } catch { /* skip */ }
    };
    void fetchStats();
  }, []);

  return (
    <AppShell page="home">
      <div className="relative overflow-hidden bg-[#f6f8fa] dark:bg-[#0d1117]">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4d97ff] rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-24 text-center lg:py-40">
          <div className="animate-slide-up space-y-10">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-widest text-blue-600 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400">
              <Sparkles size={14} /> Text to Scratch, without the drag-and-drop
            </div>
            
            <h1 className="mx-auto max-w-5xl text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl leading-[0.9]">
              Write Scratch <br/>
              <span className="bg-gradient-to-r from-[#4d97ff] via-indigo-500 to-purple-600 bg-clip-text text-transparent">like source code</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg font-bold text-slate-500 dark:text-slate-400 sm:text-xl tracking-tight">
              Build Scratch projects from readable text, validate them in the browser, and export real `.sb3` files with a live stage preview.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row">
              <a href="converter.html" className="group flex h-16 items-center gap-3 rounded-2xl bg-[#4d97ff] px-10 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 hover:bg-blue-600 active:scale-95">
                Initialize Workspace <Rocket size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="docs.html" className="flex h-16 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-10 text-sm font-black uppercase tracking-widest transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                Documentation
              </a>
            </div>

            {/* Live Stats */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-3 gap-12 max-w-4xl mx-auto border-t border-black/5 dark:border-white/5">
              <StatItem label="Supported Commands" value={`${commandCount}`} />
              <StatItem label="Cloud Projects" value={projectCount !== null ? `${projectCount}` : "Syncing..."} />
              <StatItem label="Local Exports" value="SB3 + T2SH" className="hidden md:flex" />
            </div>
          </div>
        </section>

        {/* Technical Grid */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-24 border-t border-black/5 dark:border-white/5">
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard 
              icon={<Terminal size={32} className="text-blue-500" />} 
              title="Readable Syntax" 
              description="Author Scratch projects in plain text without losing the structure of blocks, scripts, and targets." 
            />
            <FeatureCard 
              icon={<RefreshCw size={32} className="text-emerald-500" />} 
              title="Fast Feedback" 
              description="See validation feedback in the workspace while you edit, import, preview, and export." 
            />
            <FeatureCard 
              icon={<Globe size={32} className="text-purple-500" />} 
              title="Shareable Projects" 
              description="Save projects to the cloud, create share links, and publish them to the community directory." 
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatItem({ label, value, className = "" }: { label: string, value: string, className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="text-3xl font-black tracking-tighter">{value}</span>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm transition-all hover:border-blue-400 hover:shadow-2xl dark:border-slate-800 dark:bg-[#161b22] animate-slide-up">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 transition-all group-hover:scale-110 group-hover:bg-blue-50 dark:bg-slate-900 dark:group-hover:bg-blue-900/20">
          {icon}
        </div>
        <h3 className="mb-4 text-xl font-black tracking-tight uppercase">{title}</h3>
        <p className="text-[0.9rem] font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}
