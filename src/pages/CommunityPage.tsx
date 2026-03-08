import { RefreshCw, Search, Share2, Sparkles, Users } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CLOUD_TABLE, buildShareUrl, formatDateTime, formatSupabaseError, supabaseClient } from "../lib/supabase";
import communityNetworkIllustrationUrl from "../assets/community-network-illustration.svg";

interface CommunityProject {
  title: string | null;
  share_slug: string | null;
  owner_username: string | null;
  updated_at: string | null;
}

type SortMode = "recent" | "title" | "creator";

export function CommunityPage() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    void loadProjects();
  }, []);

  const filteredProjects = projects
    .filter((project) => {
      const normalizedQuery = deferredQuery.trim().toLowerCase();
      if (!normalizedQuery) {
        return true;
      }

      return String(project.title || "").toLowerCase().includes(normalizedQuery)
        || String(project.owner_username || "").toLowerCase().includes(normalizedQuery);
    })
    .sort((left, right) => compareProjects(left, right, sortMode));

  async function loadProjects() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabaseClient
        .from(CLOUD_TABLE)
        .select("title,share_slug,owner_username,updated_at")
        .eq("is_public", true)
        .not("share_slug", "is", null)
        .order("updated_at", { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      startTransition(() => {
        setProjects(Array.isArray(data) ? data : []);
      });
    } catch (error) {
      setErrorMessage(formatSupabaseError(error));
      startTransition(() => {
        setProjects([]);
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell page="community">
      <section id="community" className="hero-glow border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Users className="h-3.5 w-3.5" />
              Community projects
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Browse shared projects, inspect real syntax, and open examples straight into the workspace.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Community links open read-only in the converter so you can study structure, fork a working script, or compare authoring styles without editing the original by accident.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <div className="overflow-hidden rounded-[1.6rem] border border-black/10 bg-slate-50 dark:border-white/10 dark:bg-white/5">
              <img
                src={communityNetworkIllustrationUrl}
                alt="Illustration showing shared text2scratch projects connected through a community library."
                className="block w-full"
              />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">How to use it</p>
            <div className="mt-5 grid gap-4">
              <InfoItem title="Search by title or creator" description="Use the filters when you want examples from a specific author or project style." />
              <InfoItem title="Open read-only first" description="Shared links protect the source project until you explicitly fork it inside the workspace." />
              <InfoItem title="Keep docs nearby" description="The reference and docs pages stay useful when you want exact command details from a project you are studying." />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16">
        <div className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Search projects
            <span className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="title or creator username"
                className="w-full rounded-2xl border border-black/10 bg-slate-50 px-11 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
              />
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Sort
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
            >
              <option value="recent">Most recent</option>
              <option value="title">Title A-Z</option>
              <option value="creator">Creator A-Z</option>
            </select>
          </label>

          <div className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Actions</span>
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 dark:border-white/10 dark:bg-white/5">
            <Sparkles className="h-4 w-4" />
            Showing {filteredProjects.length} public project{filteredProjects.length === 1 ? "" : "s"}
          </span>
          {errorMessage ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              Could not refresh right now: {errorMessage}
            </span>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-8 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 md:col-span-2 xl:col-span-3">
              No community projects match the current filters.
            </div>
          ) : (
            filteredProjects.map((project) => <ProjectCard key={`${project.share_slug}-${project.updated_at}`} project={project} />)
          )}
        </div>
      </section>
    </AppShell>
  );
}

function ProjectCard({ project }: { project: CommunityProject }) {
  const title = String(project.title || "Untitled").trim() || "Untitled";
  const creator = String(project.owner_username || "unknown").trim() || "unknown";
  const shareSlug = String(project.share_slug || "").trim();
  const shareUrl = shareSlug ? buildShareUrl(shareSlug) : "converter.html";

  return (
    <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">By {creator}</p>
        </div>
        <span className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-300">
          Shared
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10 dark:text-slate-300">{creator}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10 dark:text-slate-300">
          Updated {formatDateTime(project.updated_at || undefined)}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={shareUrl}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Share2 className="h-4 w-4" />
          Open read-only
        </a>
        <a
          href={shareUrl}
          className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
        >
          Open in workspace
        </a>
      </div>
    </article>
  );
}

function InfoItem({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <h2 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}

function SkeletonCard() {
  return <div className="h-56 animate-pulse rounded-[2rem] border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5" />;
}

function compareProjects(left: CommunityProject, right: CommunityProject, sortMode: SortMode) {
  if (sortMode === "title") {
    return String(left.title || "").localeCompare(String(right.title || ""));
  }

  if (sortMode === "creator") {
    return String(left.owner_username || "").localeCompare(String(right.owner_username || ""));
  }

  return Number(new Date(right.updated_at || 0)) - Number(new Date(left.updated_at || 0));
}
