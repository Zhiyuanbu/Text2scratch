import type { ReactNode } from "react";
import { ArrowRight, Globe, MessageSquare, RefreshCw, Rocket, ShieldCheck, Sparkles, Terminal, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { countForumPosts, listForumThreads } from "../lib/forum";
import { getReferenceEntries } from "../lib/blocks";

const HOME_STATS_CACHE_KEY = "text2scratch.home.publicProjectCount";
const HOME_STATS_CACHE_TTL_MS = 15 * 60 * 1000;

export function HomePage() {
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [forumCount, setForumCount] = useState(0);
  const [lastSyncLabel, setLastSyncLabel] = useState("Local snapshot");
  const commandCount = getReferenceEntries().length;

  useEffect(() => {
    const cachedCount = readCachedProjectCount();
    const hasCachedCount = cachedCount !== null;
    if (cachedCount !== null) {
      setProjectCount(cachedCount);
      setLastSyncLabel("Cached public registry");
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    const fetchStats = async () => {
      try {
        try {
          const forumThreads = await listForumThreads();
          if (!cancelled) {
            setForumCount(countForumPosts(forumThreads));
          }
        } catch {
          // Keep the forum count at zero when the backend is unavailable.
        }

        const { supabaseClient, CLOUD_TABLE, isSupabaseConfigured } = await import("../lib/supabase");
        if (!isSupabaseConfigured || cancelled) {
          return;
        }
        const { count, error } = await supabaseClient
          .from(CLOUD_TABLE)
          .select("*", { count: "exact", head: true })
          .eq("is_public", true)
          .abortSignal(controller.signal);
        if (error) {
          throw error;
        }
        if (!cancelled && count !== null) {
          setProjectCount(count);
          setLastSyncLabel("Live public registry");
          writeCachedProjectCount(count);
        }
      } catch {
        if (!cancelled && !hasCachedCount) {
          setLastSyncLabel("Local snapshot");
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };
    void fetchStats();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <AppShell page="home">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {/* Background: layered grid + accent glow */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Faint color washes */}
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#4d97ff]/10 blur-[140px]" />
          <div className="absolute -right-24 top-24 h-[380px] w-[380px] rounded-full bg-[#ffab19]/8 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-[#2da44e]/8 blur-[100px]" />
        </div>

        <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-14 lg:pb-28 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left: copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 px-4 py-2 text-[0.67rem] font-black uppercase tracking-widest text-blue-700 shadow-sm backdrop-blur dark:border-blue-800/40 dark:bg-blue-900/15 dark:text-blue-300">
                <Sparkles size={12} />
                Source-first Scratch authoring
              </div>

              <div className="space-y-5">
                <h1 className="max-w-2xl text-[3.2rem] font-black leading-[1.05] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
                  Build Scratch with text.{" "}
                  <span style={{ background: "linear-gradient(135deg, #3d87ff 10%, #60c0ff 90%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Ship like software.
                  </span>
                </h1>
                <p className="max-w-xl text-[1.05rem] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                  text2scratch turns readable scripts into real .sb3 projects — with cloud sync, share links, and live community boards for collaboration.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="converter.html"
                  className="group inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl active:scale-97"
                  style={{ background: "linear-gradient(135deg, #2d7ce8 0%, #4d97ff 100%)", boxShadow: "0 4px 24px rgba(77,151,255,0.35)" }}
                >
                  Open Workspace
                  <Rocket size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="community.html"
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-slate-700 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/60"
                >
                  Visit Community
                  <ArrowRight size={16} />
                </a>
              </div>

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Commands indexed" value={`${commandCount}`} detail="Complete syntax registry" accent="#4d97ff" />
                <StatCard label="Public projects" value={projectCount !== null ? `${projectCount}` : "Syncing…"} detail={lastSyncLabel} accent="#2da44e" />
                <StatCard label="Forum posts" value={`${forumCount}`} detail="Collab, dev, Higher Forum" accent="#ffab19" />
              </div>
            </div>

            {/* Right: workflow card */}
            <div
              className="rounded-[1.75rem] border border-slate-200/70 p-6 backdrop-blur-sm dark:border-slate-800/60"
              style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 4px rgba(0,0,0,0.05), 0 8px 40px rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                <div>
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-slate-400">Live workflow</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight dark:text-white">From script to community</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4d97ff]/10 text-[#4d97ff]">
                  <Terminal size={22} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <WorkflowRow step="01" title="Author in plain text" description="Use the converter, command registry, and diagnostics instead of dragging blocks." color="#4d97ff" />
                <WorkflowRow step="02" title="Save, sync, and share" description="Keep personal cloud projects, create share links, and recover from failures with cached project lists." color="#2da44e" />
                <WorkflowRow step="03" title="Post and discuss" description="Publish public projects, open forum threads, and coordinate in Collaboration, Developer, and Higher boards." color="#ffab19" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-400">Platform highlights</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight dark:text-white">Everything in one place</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<Terminal size={28} className="text-[#4d97ff]" />}
            title="Readable Syntax"
            description="Author Scratch logic in source form while keeping blocks, broadcasts, variables, and targets explicit."
            accentColor="#4d97ff"
          />
          <FeatureCard
            icon={<RefreshCw size={28} className="text-emerald-500" />}
            title="Stronger Diagnostics"
            description="Boot failures, auth issues, and Supabase errors now surface clearer hints instead of generic dead ends."
            accentColor="#2da44e"
          />
          <FeatureCard
            icon={<Users size={28} className="text-orange-500" />}
            title="Forums Included"
            description="Persistent discussion boards for collaboration, development, and Higher Forum planning come built in."
            accentColor="#ffab19"
          />
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="border-y border-black/5 dark:border-white/5" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-5 md:grid-cols-3">
            <QuickLinkCard
              icon={<Globe size={20} className="text-[#4d97ff]" />}
              title="Public Registry"
              description="Browse public projects, open share links, and review publishing output before sharing."
              href="community.html"
              cta="Open registry"
              accentColor="#4d97ff"
            />
            <QuickLinkCard
              icon={<MessageSquare size={20} className="text-emerald-500" />}
              title="Community Boards"
              description="Post threads, recruit collaborators, and keep discussions in the right forum board."
              href="community.html"
              cta="Open forums"
              accentColor="#2da44e"
            />
            <QuickLinkCard
              icon={<ShieldCheck size={20} className="text-amber-500" />}
              title="Account Control"
              description="Profile updates, security actions, parent-managed flows, and admin recovery tools."
              href="dashboard.html"
              cta="Open dashboard"
              accentColor="#f59e0b"
            />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

// ── Helpers ──────────────────────────────────────────────

function readCachedProjectCount() {
  try {
    const rawValue = window.localStorage.getItem(HOME_STATS_CACHE_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as { value?: number; savedAt?: number } | null;
    if (!parsed || !Number.isFinite(parsed.value) || !Number.isFinite(parsed.savedAt)) return null;
    if (Date.now() - Number(parsed.savedAt) > HOME_STATS_CACHE_TTL_MS) return null;
    return Number(parsed.value);
  } catch {
    return null;
  }
}

function writeCachedProjectCount(value: number) {
  try {
    window.localStorage.setItem(HOME_STATS_CACHE_KEY, JSON.stringify({ value, savedAt: Date.now() }));
  } catch {
    // Ignore storage failures.
  }
}

// ── Sub-components ────────────────────────────────────────

function StatCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur dark:border-slate-800/60 dark:bg-[#101827]/80"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
    >
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ background: accent }} />
      <p className="pl-2 text-[0.66rem] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 pl-2 text-3xl font-black tracking-tight dark:text-white">{value}</p>
      <p className="mt-1 pl-2 text-[0.72rem] font-medium text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function WorkflowRow({ step, title, description, color }: { step: string; title: string; description: string; color: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/50 dark:bg-[#0d1423]/60">
      <div
        className="shrink-0 rounded-xl px-3 py-2 text-[0.66rem] font-black uppercase tracking-widest text-white"
        style={{ background: color }}
      >
        {step}
      </div>
      <div>
        <h3 className="text-[0.9rem] font-black tracking-tight dark:text-white">{title}</h3>
        <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, accentColor }: { icon: ReactNode; title: string; description: string; accentColor: string }) {
  return (
    <div
      className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 dark:border-slate-800/60 dark:bg-[#101827]/80"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.05)" }}
    >
      {/* Top accent line */}
      <div className="absolute left-7 right-7 top-0 h-px opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:left-4 group-hover:right-4" style={{ background: accentColor }} />
      <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl" style={{ background: `${accentColor}15` }}>
        {icon}
      </div>
      <h3 className="text-lg font-black tracking-tight dark:text-white">{title}</h3>
      <p className="mt-3 text-[0.85rem] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function QuickLinkCard({ icon, title, description, href, cta, accentColor }: {
  icon: ReactNode; title: string; description: string; href: string; cta: string; accentColor: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 dark:border-slate-800/60 dark:bg-[#101827]/80"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)" }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${accentColor}15` }}>
        {icon}
      </div>
      <h3 className="mt-5 text-[1.05rem] font-black tracking-tight dark:text-white">{title}</h3>
      <p className="mt-2 text-[0.83rem] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-[0.75rem] font-black uppercase tracking-widest transition-colors" style={{ color: accentColor }}>
        {cta}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  );
}
