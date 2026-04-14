import type { ReactNode } from "react";
import { ArrowRight, Globe, MessageSquare, RefreshCw, Rocket, ShieldCheck, Sparkles, Terminal, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { countForumPosts, readForumThreads } from "../lib/forum";
import { getReferenceEntries } from "../lib/blocks";

const HOME_STATS_CACHE_KEY = "text2scratch.home.publicProjectCount";
const HOME_STATS_CACHE_TTL_MS = 15 * 60 * 1000;

export function HomePage() {
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [forumCount, setForumCount] = useState(() => countForumPosts(readForumThreads()));
  const [lastSyncLabel, setLastSyncLabel] = useState("Local snapshot");
  const commandCount = getReferenceEntries().length;

  useEffect(() => {
    setForumCount(countForumPosts(readForumThreads()));

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
      <div className="relative overflow-hidden bg-[#f7f6f1] dark:bg-[#0d1117]">
        <div className="absolute inset-0 pointer-events-none opacity-70">
          <div className="absolute left-[-8%] top-[-12%] h-[24rem] w-[24rem] rounded-full bg-[#4d97ff]/18 blur-[120px]"></div>
          <div className="absolute right-[-10%] top-[18%] h-[20rem] w-[20rem] rounded-full bg-[#ffab19]/18 blur-[110px]"></div>
          <div className="absolute bottom-[-16%] left-[15%] h-[18rem] w-[18rem] rounded-full bg-[#2da44e]/18 blur-[100px]"></div>
        </div>

        <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-[0.68rem] font-black uppercase tracking-widest text-blue-700 shadow-sm backdrop-blur dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-200">
                <Sparkles size={14} /> Source-first Scratch authoring
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
                  Build Scratch projects with text, then ship them like software.
                </h1>
                <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  text2scratch turns readable scripts into real Scratch projects, keeps a cloud archive, publishes share links, and now includes live community forum boards for collaboration and advanced planning.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="converter.html" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#4d97ff] px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:bg-blue-600">
                  Open Workspace
                  <Rocket size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </a>
                <a href="community.html" className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-widest text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  Visit Community
                  <ArrowRight size={18} />
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Commands indexed" value={`${commandCount}`} detail="Complete syntax registry" />
                <StatCard label="Public projects" value={projectCount !== null ? `${projectCount}` : "Syncing..."} detail={lastSyncLabel} />
                <StatCard label="Forum posts" value={`${forumCount}`} detail="Collab, dev, and Higher Forum" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur dark:border-slate-800 dark:bg-[#161b22]/90 dark:shadow-black/20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">Live workflow</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">From script to community</h2>
                </div>
                <div className="rounded-2xl bg-[#4d97ff]/10 p-3 text-[#4d97ff]">
                  <Terminal size={24} />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <WorkflowRow
                  step="01"
                  title="Author in plain text"
                  description="Use the converter, command registry, and diagnostics panel instead of dragging blocks around."
                />
                <WorkflowRow
                  step="02"
                  title="Save, sync, and share"
                  description="Keep personal cloud projects, create share links, and recover from transient load failures with cached project lists."
                />
                <WorkflowRow
                  step="03"
                  title="Post and discuss"
                  description="Publish public projects, open forum threads, and coordinate work in the Collaboration, Developer, and Higher boards."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Terminal size={30} className="text-blue-500" />}
              title="Readable Syntax"
              description="Author Scratch logic in source form while keeping blocks, broadcasts, variables, and targets explicit."
            />
            <FeatureCard
              icon={<RefreshCw size={30} className="text-emerald-500" />}
              title="Stronger Diagnostics"
              description="Workspace boot failures, auth issues, and Supabase errors now surface clearer hints instead of generic dead ends."
            />
            <FeatureCard
              icon={<Users size={30} className="text-orange-500" />}
              title="Forums Included"
              description="The community surface now supports persistent discussion boards for collaboration, development, and Higher Forum planning."
            />
          </div>
        </section>

        <section className="relative z-10 border-y border-black/5 bg-white/70 py-20 dark:border-white/5 dark:bg-[#11161d]">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
            <QuickLinkCard
              icon={<Globe size={22} className="text-blue-500" />}
              title="Public Registry"
              description="Browse public projects, open share links, and review publishing output before sending people into the workspace."
              href="community.html"
              cta="Open registry"
            />
            <QuickLinkCard
              icon={<MessageSquare size={22} className="text-emerald-500" />}
              title="Community Boards"
              description="Post threads, recruit collaborators, and keep technical or moderation discussions in the right forum board."
              href="community.html"
              cta="Open forums"
            />
            <QuickLinkCard
              icon={<ShieldCheck size={22} className="text-amber-500" />}
              title="Account Control"
              description="Use the dashboard for profile updates, security actions, parent-managed flows, and admin recovery work."
              href="dashboard.html"
              cta="Open dashboard"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function readCachedProjectCount() {
  try {
    const rawValue = window.localStorage.getItem(HOME_STATS_CACHE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as { value?: number; savedAt?: number } | null;
    if (!parsed || !Number.isFinite(parsed.value) || !Number.isFinite(parsed.savedAt)) {
      return null;
    }

    if (Date.now() - Number(parsed.savedAt) > HOME_STATS_CACHE_TTL_MS) {
      return null;
    }

    return Number(parsed.value);
  } catch {
    return null;
  }
}

function writeCachedProjectCount(value: number) {
  try {
    window.localStorage.setItem(HOME_STATS_CACHE_KEY, JSON.stringify({
      value,
      savedAt: Date.now()
    }));
  } catch {
    // Ignore storage failures and keep the current UI state.
  }
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-[#161b22]/85">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function WorkflowRow({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-slate-900 px-3 py-2 text-[0.68rem] font-black uppercase tracking-widest text-white dark:bg-white dark:text-slate-900">
          {step}
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-[#161b22]">
      <div className="absolute right-0 top-0 p-6 opacity-5 transition-transform duration-500 group-hover:scale-125">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900">
          {icon}
        </div>
        <h3 className="text-xl font-black tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function QuickLinkCard({
  icon,
  title,
  description,
  href,
  cta
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <a href={href} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#161b22] dark:hover:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#4d97ff]">
        {cta}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  );
}
