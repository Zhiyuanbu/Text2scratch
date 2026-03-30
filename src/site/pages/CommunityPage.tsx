import { Globe, RefreshCw, Search, Share2, Trash2, UserRound } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CLOUD_TABLE, buildShareUrl, formatDateTime, formatSupabaseError, supabaseClient } from "../lib/supabase";
import { useAuth, useToast } from "../providers/AppProviders";

interface CommunityProject {
  id: string;
  title: string | null;
  share_slug: string | null;
  owner_username: string | null;
  updated_at: string | null;
}

type SortMode = "recent" | "title" | "creator";

export function CommunityPage() {
  const { isAdmin } = useAuth();
  const { pushToast } = useToast();
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
      if (!normalizedQuery) return true;
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
        .select("id,title,share_slug,owner_username,updated_at")
        .eq("is_public", true)
        .not("share_slug", "is", null)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      startTransition(() => { setProjects(Array.isArray(data) ? data : []); });
    } catch (error) {
      setErrorMessage(formatSupabaseError(error));
      startTransition(() => { setProjects([]); });
    } finally { setIsLoading(false); }
  }

  const handlePurge = async (id: string) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabaseClient.from(CLOUD_TABLE).delete().eq("id", id);
      if (error) throw error;
      pushToast({ title: "Node Purged", variant: "success" });
      void loadProjects();
    } catch (error) {
      pushToast({ title: "Purge Failed", description: String(error), variant: "error" });
    }
  };

  return (
    <AppShell page="community">
      <div className="bg-[#f6f8fa] dark:bg-[#0d1117] animate-in fade-in duration-500">
        
        {/* Compact Header */}
        <section className="border-b border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#4d97ff] dark:text-blue-400">
                <Globe size={20} />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest">Network Registry</span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter">Shared Workspace Projects</h1>
              <p className="max-w-2xl text-[0.85rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                Discover production-ready authoring nodes from the community. Study structure, analyze logic, and fork examples into your workspace.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Controls Bar */}
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#161b22] mb-8">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by title or identifier..."
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 transition-all"
                />
              </div>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
              >
                <option value="recent">Sort: Recent</option>
                <option value="title">Sort: Title</option>
                <option value="creator">Sort: Creator</option>
              </select>
              <button
                onClick={() => void loadProjects()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-md bg-[#2da44e] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#2c974b] transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                Sync
              </button>
            </div>
          </section>

          {errorMessage && (
            <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Community projects could not be loaded. {errorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadProjects()}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-black uppercase text-white transition-colors hover:bg-amber-700"
                >
                  Retry
                </button>
              </div>
            </section>
          )}

          {/* Project Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-widest text-slate-400 px-1">
              <span>Verified Public Nodes</span>
              <span>{filteredProjects.length} nodes online</span>
            </div>

            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-800">
                No nodes matching filter found in registry.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((p) => (
                  <ProjectCard 
                    key={p.id} 
                    project={p} 
                    isAdmin={isAdmin} 
                    onPurge={() => handlePurge(p.id)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ProjectCard({ project, isAdmin, onPurge }: { project: CommunityProject, isAdmin: boolean, onPurge: () => void }) {
  const shareUrl = buildShareUrl(project.share_slug || "");
  // Generate a consistent but "random" color based on project ID
  const colors = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-green-500", "bg-pink-500"];
  const colorIndex = project.id.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow-md transition-all dark:border-slate-800 dark:bg-[#161b22]">
      <div className={`h-24 w-full ${bgColor} relative overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        <Globe size={40} className="text-white/40" />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/20 px-1.5 py-0.5 text-[0.55rem] font-black text-white backdrop-blur-md">
          <RefreshCw size={8} /> {formatDateTime(project.updated_at || "").split(",")[0]}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-4">
          <h3 className="text-sm font-black tracking-tight mb-1 truncate" title={project.title || ""}>{project.title || "Untitled_Node"}</h3>
          <div className="flex items-center gap-2 text-[0.65rem] font-bold text-slate-400 uppercase tracking-tighter">
            <UserRound size={10} className="text-blue-500" />
            <span>{project.owner_username || "anonymous"}</span>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={onPurge} className="text-rose-600 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <a href={shareUrl} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-[0.65rem] font-black uppercase hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 transition-colors">
              <Share2 size={12} /> Open
            </a>
            <a href={shareUrl} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#4d97ff] text-white py-2 text-[0.65rem] font-black uppercase hover:bg-blue-500 shadow-sm transition-colors">
              Workspace
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return <div className="h-32 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-[#161b22] animate-pulse" />;
}

function compareProjects(left: CommunityProject, right: CommunityProject, sortMode: SortMode) {
  if (sortMode === "title") return String(left.title || "").localeCompare(String(right.title || ""));
  if (sortMode === "creator") return String(left.owner_username || "").localeCompare(String(right.owner_username || ""));
  return Number(new Date(right.updated_at || 0)) - Number(new Date(left.updated_at || 0));
}
