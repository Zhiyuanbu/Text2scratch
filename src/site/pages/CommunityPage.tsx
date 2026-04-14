import {
  ChevronDown,
  ChevronUp,
  Code2,
  Globe,
  MessageSquare,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Share2,
  Shield,
  Trash2,
  UserRound,
  Users
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { createErrorReport } from "../lib/errorReports";
import {
  addForumReply,
  countForumPosts,
  createForumThread,
  filterForumThreads,
  readForumThreads,
  writeForumThreads,
  type ForumBoard,
  type ForumThread
} from "../lib/forum";
import { sanitizeSingleLineInput } from "../lib/inputSafety";
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
type CommunityTab = "projects" | ForumBoard;

const boardConfig: Record<ForumBoard, {
  title: string;
  description: string;
  emptyMessage: string;
  icon: ReactNode;
  accentClassName: string;
}> = {
  collab: {
    title: "Collaboration Forum",
    description: "Post project needs, recruit contributors, and match builders with artists, composers, or testers.",
    emptyMessage: "No collaboration threads match this filter yet.",
    icon: <Users size={14} />,
    accentClassName: "text-blue-500"
  },
  dev: {
    title: "Developer Forum",
    description: "Discuss syntax, debugging, architecture, import/export behavior, and engine design.",
    emptyMessage: "No developer discussions match this filter yet.",
    icon: <Code2 size={14} />,
    accentClassName: "text-emerald-500"
  },
  higher: {
    title: "Higher Forum",
    description: "Use the advanced board for moderation, infrastructure, publishing policy, and production rollout discussions.",
    emptyMessage: "No Higher Forum threads match this filter yet.",
    icon: <Shield size={14} />,
    accentClassName: "text-amber-500"
  }
};

export function CommunityPage() {
  const { isAdmin, user, profile } = useAuth();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<CommunityTab>("projects");
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [forumThreads, setForumThreads] = useState<ForumThread[]>(() => readForumThreads());
  const [expandedThreadId, setExpandedThreadId] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadTags, setThreadTags] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const deferredQuery = useDeferredValue(query);
  const forumPostCount = countForumPosts(forumThreads);
  const activeBoard = activeTab === "projects" ? null : activeTab;
  const activeBoardConfig = activeBoard ? boardConfig[activeBoard] : null;
  const currentAuthor = profile?.username?.trim()
    || String(user?.user_metadata?.username || "").trim()
    || user?.email?.split("@")[0]
    || "anonymous";

  useEffect(() => {
    writeForumThreads(forumThreads);
  }, [forumThreads]);

  useEffect(() => {
    if (activeTab === "projects") {
      void loadProjects();
    } else {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!activeBoard) {
      return;
    }

    const boardThreads = filterForumThreads(forumThreads, activeBoard, deferredQuery);
    if (boardThreads.some((thread) => thread.id === expandedThreadId)) {
      return;
    }

    setExpandedThreadId(boardThreads[0]?.id || "");
  }, [activeBoard, deferredQuery, expandedThreadId, forumThreads]);

  const filteredProjects = projects
    .filter((project) => {
      const normalizedQuery = deferredQuery.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return String(project.title || "").toLowerCase().includes(normalizedQuery)
        || String(project.owner_username || "").toLowerCase().includes(normalizedQuery);
    })
    .sort((left, right) => compareProjects(left, right, sortMode));

  const filteredThreads = activeBoard ? filterForumThreads(forumThreads, activeBoard, deferredQuery) : [];

  async function loadProjects() {
    setIsLoading(true);
    setErrorMessage("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const { data, error } = await supabaseClient
        .from(CLOUD_TABLE)
        .select("id,title,share_slug,owner_username,updated_at")
        .eq("is_public", true)
        .not("share_slug", "is", null)
        .order("updated_at", { ascending: false })
        .limit(200)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      if (error) throw error;
      startTransition(() => { setProjects(Array.isArray(data) ? data : []); });
    } catch (error) {
      clearTimeout(timeoutId);
      const report = createErrorReport(
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out (10s). Community registry sync failed."
          : formatSupabaseError(error),
        { area: "community projects" }
      );
      setErrorMessage([report.summary, report.suggestions[0]].filter(Boolean).join(" "));
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
      const report = createErrorReport(formatSupabaseError(error), { area: "community purge" });
      pushToast({ title: "Purge Failed", description: report.summary, variant: "error" });
    }
  };

  const handleCreateThread = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeBoard) {
      return;
    }
    if (!user) {
      pushToast({ title: "Sign in required", description: "Log in before creating a forum thread.", variant: "warning" });
      return;
    }

    const nextTitle = sanitizeSingleLineInput(threadTitle, 120);
    const nextBody = threadBody.replace(/\s+/g, " ").trim().slice(0, 1500);
    const nextTags = threadTags
      .split(",")
      .map((entry) => sanitizeSingleLineInput(entry, 24))
      .filter(Boolean);

    if (!nextTitle) {
      pushToast({ title: "Missing title", description: "Add a short thread title before posting.", variant: "warning" });
      return;
    }
    if (!nextBody) {
      pushToast({ title: "Missing message", description: "Add some context so other users know what you need.", variant: "warning" });
      return;
    }

    const nextThreads = createForumThread(forumThreads, {
      board: activeBoard,
      title: nextTitle,
      body: nextBody,
      author: currentAuthor,
      tags: nextTags,
      pinned: activeBoard === "higher" && isAdmin
    });
    setForumThreads(nextThreads);
    setExpandedThreadId(nextThreads[0]?.id || "");
    setThreadTitle("");
    setThreadBody("");
    setThreadTags("");
    setIsComposerOpen(false);
    pushToast({ title: "Thread posted", description: `Your post is now live in the ${activeBoardConfig?.title}.`, variant: "success" });
  };

  const handleReplySubmit = (threadId: string) => {
    if (!user) {
      pushToast({ title: "Sign in required", description: "Log in before replying to forum threads.", variant: "warning" });
      return;
    }

    const nextBody = String(replyDrafts[threadId] || "").replace(/\s+/g, " ").trim().slice(0, 1200);
    if (!nextBody) {
      pushToast({ title: "Reply is empty", description: "Write a short reply before sending it.", variant: "warning" });
      return;
    }

    setForumThreads((current) => addForumReply(current, {
      threadId,
      author: currentAuthor,
      body: nextBody
    }));
    setReplyDrafts((current) => ({ ...current, [threadId]: "" }));
    setExpandedThreadId(threadId);
    pushToast({ title: "Reply posted", variant: "success" });
  };

  const toggleThread = (threadId: string) => {
    setExpandedThreadId((current) => current === threadId ? "" : threadId);
  };

  return (
    <AppShell page="community">
      <div className="bg-[#f6f8fa] dark:bg-[#0d1117] animate-in fade-in duration-500 min-h-full">
        <section className="border-b border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-[#4d97ff] dark:text-blue-400">
                  <Globe size={20} />
                  <span className="text-[0.7rem] font-bold uppercase tracking-widest">Network Registry</span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tighter sm:text-3xl">Community Hub</h1>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-500 dark:text-slate-400">
                  Browse public projects, post to the collaboration and developer forums, and use the Higher Forum for advanced production discussions.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HubStat label="Public nodes" value={String(projects.length)} />
                <HubStat label="Forum posts" value={String(forumPostCount)} />
                <HubStat label="Boards live" value="3" />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800">
              <TabButton active={activeTab === "projects"} onClick={() => setActiveTab("projects")} icon={<Globe size={14} />}>Public Nodes</TabButton>
              <TabButton active={activeTab === "collab"} onClick={() => setActiveTab("collab")} icon={<Users size={14} />}>Collaboration Forum</TabButton>
              <TabButton active={activeTab === "dev"} onClick={() => setActiveTab("dev")} icon={<Code2 size={14} />}>Developer Forum</TabButton>
              <TabButton active={activeTab === "higher"} onClick={() => setActiveTab("higher")} icon={<Shield size={14} />}>Higher Forum</TabButton>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className={`grid gap-3 ${activeTab === "projects" ? "md:grid-cols-[1fr_180px_120px]" : "md:grid-cols-[1fr_220px_auto]"}`}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label={activeTab === "projects" ? "Filter community projects" : "Filter community forum threads"}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={activeTab === "projects" ? "Filter by title or identifier..." : "Search titles, replies, authors, or tags..."}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 transition-all"
                />
              </div>

              {activeTab === "projects" ? (
                <>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    aria-label="Sort community projects"
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                  >
                    <option value="recent">Sort: Recent</option>
                    <option value="title">Sort: Title</option>
                    <option value="creator">Sort: Creator</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadProjects()}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#2da44e] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#2c974b] transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                    Sync
                  </button>
                </>
              ) : (
                <>
                  <div className={`flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-widest dark:border-slate-700 dark:bg-slate-900 ${activeBoardConfig?.accentClassName || "text-slate-500"}`}>
                    {activeBoardConfig?.icon}
                    <span>{activeBoardConfig?.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen((current) => !current)}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#4d97ff] px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-blue-600 transition-all"
                  >
                    <Plus size={14} />
                    {isComposerOpen ? "Close" : "New Thread"}
                  </button>
                </>
              )}
            </div>
          </section>

          {activeTab === "projects" && (
            <>
              {errorMessage && (
                <section role="status" aria-live="polite" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-100">
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
                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isAdmin={isAdmin}
                        onPurge={() => handlePurge(project.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeBoard && activeBoardConfig && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className={`flex items-center gap-2 text-sm font-black ${activeBoardConfig.accentClassName}`}>
                      {activeBoardConfig.icon}
                      {activeBoardConfig.title}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {activeBoardConfig.description}
                    </p>
                  </div>
                  {!user && (
                    <a href="login.html" className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                      Sign in to post
                    </a>
                  )}
                </div>

                {isComposerOpen && (
                  <form onSubmit={handleCreateThread} className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
                    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                      <input
                        value={threadTitle}
                        onChange={(event) => setThreadTitle(sanitizeSingleLineInput(event.target.value, 120))}
                        placeholder="Thread title"
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <input
                        value={threadTags}
                        onChange={(event) => setThreadTags(sanitizeSingleLineInput(event.target.value, 120))}
                        placeholder="Tags, comma separated"
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <textarea
                      value={threadBody}
                      onChange={(event) => setThreadBody(event.target.value.slice(0, 1500))}
                      placeholder="What are you building, asking, or proposing?"
                      rows={4}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Posting as <span className="font-bold">{currentAuthor}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsComposerOpen(false)}
                          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-[#4d97ff] px-3 py-2 text-xs font-black uppercase text-white hover:bg-blue-600"
                        >
                          Post thread
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </section>

              <div className="space-y-3">
                {filteredThreads.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-800">
                    {activeBoardConfig.emptyMessage}
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <ForumThreadCard
                      key={thread.id}
                      thread={thread}
                      expanded={expandedThreadId === thread.id}
                      replyDraft={replyDrafts[thread.id] || ""}
                      onToggle={() => toggleThread(thread.id)}
                      onReplyDraftChange={(value) => setReplyDrafts((current) => ({ ...current, [thread.id]: value.slice(0, 1200) }))}
                      onReplySubmit={() => handleReplySubmit(thread.id)}
                      canReply={Boolean(user)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function TabButton({ children, active, onClick, icon }: { children: ReactNode, active: boolean, onClick: () => void, icon: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
        active
          ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-400 dark:text-blue-400"
          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function HubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black tracking-tight">{value}</p>
    </div>
  );
}

function ForumThreadCard({
  thread,
  expanded,
  replyDraft,
  onToggle,
  onReplyDraftChange,
  onReplySubmit,
  canReply
}: {
  thread: ForumThread;
  expanded: boolean;
  replyDraft: string;
  onToggle: () => void;
  onReplyDraftChange: (value: string) => void;
  onReplySubmit: () => void;
  canReply: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {thread.pinned && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                Pinned
              </span>
            )}
            <h3 className="text-base font-black tracking-tight">{thread.title}</h3>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1"><UserRound size={11} /> {thread.author}</span>
            <span className="flex items-center gap-1"><MessageSquare size={11} /> {thread.replies.length} replies</span>
            <span>{formatDateTime(thread.updatedAt)}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {thread.body}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-[#0d1117] dark:text-slate-300">
            {thread.body}
          </div>

          <div className="mt-4 space-y-3">
            {thread.replies.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No replies yet. Start the discussion.
              </div>
            ) : (
              thread.replies.map((reply) => (
                <div key={reply.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold">{reply.author}</p>
                    <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">{formatDateTime(reply.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{reply.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Reply size={12} />
              Reply
            </div>
            <textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              placeholder={canReply ? "Write a reply..." : "Sign in to reply to this thread."}
              rows={3}
              disabled={!canReply}
              className="mt-3 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onReplySubmit}
                disabled={!canReply}
                className="rounded-md bg-[#4d97ff] px-3 py-2 text-xs font-black uppercase text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Post reply
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ProjectCard({ project, isAdmin, onPurge }: { project: CommunityProject, isAdmin: boolean, onPurge: () => void }) {
  const shareUrl = buildShareUrl(project.share_slug || "");
  const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-cyan-500", "bg-rose-500"];
  const colorIndex = project.id.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow-md transition-all dark:border-slate-800 dark:bg-[#161b22]">
      <div className={`h-24 w-full ${bgColor} relative overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
        <Globe size={40} className="text-white/40" />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/20 px-1.5 py-0.5 text-[0.65rem] font-black text-white backdrop-blur-md">
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
              <button type="button" onClick={onPurge} aria-label={`Delete ${project.title || "project"}`} className="text-rose-600 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <a
              href={shareUrl}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-[0.65rem] font-black uppercase hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 transition-colors"
            >
              <Share2 size={12} /> Open
            </a>
            <a
              href={shareUrl}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#4d97ff] text-white py-2 text-[0.65rem] font-black uppercase hover:bg-blue-500 shadow-sm transition-colors"
            >
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
