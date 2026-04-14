import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Download,
  FolderOpen,
  Globe,
  Info,
  Loader2,
  Lock,
  Play,
  RefreshCw,
  Save,
  ScanSearch,
  Share2,
  Square,
  Upload
} from "lucide-react";
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { createErrorReport } from "../lib/errorReports";
import { sanitizeSingleLineInput } from "../lib/inputSafety";
import { loadExternalScript } from "../lib/loadExternalScript";
import { useAuth } from "../providers/AppProviders";

const JSZIP_SCRIPT_URLS = [
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
  "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"
];
const MONACO_LOADER_URLS = [
  "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js",
  "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.min.js"
];
const SCAFFOLDING_SCRIPT_URL = "./vendor/scaffolding-min.js";

function loadExternalScriptNoAmd(src: string) {
  const win = window as typeof window & { define?: { amd?: unknown } };
  const previousDefine = win.define;
  const previousAmd = previousDefine?.amd;
  if (previousDefine) {
    try { delete win.define; } catch { win.define = undefined; }
  }
  return loadExternalScript(src).finally(() => {
    if (previousDefine) {
      win.define = previousDefine;
      if (previousAmd) win.define.amd = previousAmd;
    }
  });
}

const categories = [
  { id: "motion", label: "Motion", color: "bg-[#4c97ff]", section: "Core: Motion" },
  { id: "looks", label: "Looks", color: "bg-[#9966ff]", section: "Core: Looks" },
  { id: "sound", label: "Sound", color: "bg-[#cf63cf]", section: "Core: Sound" },
  { id: "events", label: "Events", color: "bg-[#ffd500]", section: "Core: Events" },
  { id: "control", label: "Control", color: "bg-[#ffab19]", section: "Core: Control" },
  { id: "sensing", label: "Sensing", color: "bg-[#4cbfe6]", section: "Core: Sensing" },
  { id: "operators", label: "Operators", color: "bg-[#40bf4a]", section: "Core: Operators" },
  { id: "variables", label: "Variables", color: "bg-[#ff8c1a]", section: "Core: Variables" },
  { id: "myblocks", label: "My Blocks", color: "bg-[#ff6680]", section: "Core: My Blocks" },
  { id: "extensions", label: "Extensions", color: "bg-[#0fbd8c]", section: "Extension:" }
];

type WorkspaceStatusSeverity = "info" | "success" | "warning" | "error";

export function ConverterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loadError, setLoadError] = useState("");
  const [bootAttempt, setBootAttempt] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [previewWidth, setPreviewWidth] = useState(440);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [isBootingWorkspace, setIsBootingWorkspace] = useState(false);
  const [workspaceTroubleshooting, setWorkspaceTroubleshooting] = useState<string[]>([]);
  const [workspaceStatus, setWorkspaceStatus] = useState<{
    message: string;
    severity: WorkspaceStatusSeverity;
  }>({
    message: "Sign in to load the workspace runtime.",
    severity: "info"
  });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        setSidebarWidth(Math.max(160, Math.min(400, e.clientX - 64)));
      }
      if (isResizingPreview) {
        setPreviewWidth(Math.max(300, Math.min(600, window.innerWidth - e.clientX)));
      }
    };
    const onMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingPreview(false);
    };
    if (isResizingSidebar || isResizingPreview) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizingSidebar, isResizingPreview]);

  const scrollToSection = (sectionName: string) => {
    const event = new CustomEvent("text2scratch.scroll_to", { detail: { section: sectionName } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleWorkspaceStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; severity?: WorkspaceStatusSeverity }>).detail;
      if (!detail?.message) return;
      setWorkspaceStatus({ message: detail.message, severity: detail.severity || "info" });
    };
    window.addEventListener("text2scratch.status", handleWorkspaceStatus as EventListener);
    return () => window.removeEventListener("text2scratch.status", handleWorkspaceStatus as EventListener);
  }, []);

  useEffect(() => {
    const handleWorkspaceReady = () => { setIsBootingWorkspace(false); };
    window.addEventListener("text2scratch.ready", handleWorkspaceReady as EventListener);
    return () => window.removeEventListener("text2scratch.ready", handleWorkspaceReady as EventListener);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsBootingWorkspace(false);
      setLoadError("");
      setWorkspaceTroubleshooting([]);
      setWorkspaceStatus({ message: "Sign in to load the workspace runtime.", severity: "info" });
      return;
    }

    let cancelled = false;
    const bootWorkspace = async () => {
      setIsBootingWorkspace(true);
      setLoadError("");
      setWorkspaceTroubleshooting([]);
      setWorkspaceStatus({ message: "Loading workspace runtime...", severity: "info" });

      try {
        await loadFirstAvailableScript(JSZIP_SCRIPT_URLS);
        try {
          await loadExternalScriptNoAmd(SCAFFOLDING_SCRIPT_URL);
        } catch {
          // Continue booting even when the optional preview scaffolding fails to preload.
        }
        await loadFirstAvailableScript(MONACO_LOADER_URLS);
        if (cancelled) return;
        await import("../../legacy/workspace/app.js");
      } catch (error) {
        if (!cancelled) {
          const report = createErrorReport(error, { area: "workspace runtime" });
          setLoadError(report.summary);
          setWorkspaceTroubleshooting(report.suggestions);
          setWorkspaceStatus({ message: report.summary, severity: "error" });
          setIsBootingWorkspace(false);
        }
      }
    };
    void bootWorkspace();
    return () => { cancelled = true; };
  }, [bootAttempt, user]);

  const adjustSidebarWidth = (delta: number) => {
    setSidebarWidth((current) => Math.max(160, Math.min(400, current + delta)));
  };

  const adjustPreviewWidth = (delta: number) => {
    setPreviewWidth((current) => Math.max(300, Math.min(600, current + delta)));
  };

  const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, target: "sidebar" | "preview") => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 16 : -16;
    if (target === "sidebar") { adjustSidebarWidth(delta); return; }
    adjustPreviewWidth(delta * -1);
  };

  if (authLoading) {
    return (
      <AppShell page="converter">
        <section className="flex h-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-sm space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#4d97ff]/10 text-[#4d97ff]">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Checking workspace access</h1>
            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">Loading your session before the editor starts.</p>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell page="converter">
        <section className="flex h-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-sm space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#4d97ff]/10 text-[#4d97ff]">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Workspace Locked</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Authorization required to access the authoring engine. Log in to your node to initialize the workspace.</p>
            <div className="flex flex-col gap-3 pt-4">
              <a href="login.html" className="rounded-xl bg-[#4d97ff] px-4 py-2.5 text-[0.75rem] font-black uppercase text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 transition-all active:scale-95">Initialize Session</a>
              <a href="signup.html" className="text-[0.75rem] font-black uppercase text-blue-600 hover:underline">Register New Node</a>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell page="converter">
      <div className="flex h-full flex-col overflow-hidden bg-[#eef1f7] dark:bg-[#07090f] animate-in fade-in duration-300">

        {/* ── Toolbar ── */}
        <div className="flex h-10 items-center justify-between border-b border-black/6 bg-white/95 px-3 shadow-sm dark:border-slate-800/70 dark:bg-[#0d1220]/95">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50/80 p-0.5 dark:border-slate-700/50 dark:bg-slate-800/50">
              <input
                id="projectNameInput"
                aria-label="Project name"
                maxLength={80}
                onChange={(event) => {
                  event.currentTarget.value = sanitizeSingleLineInput(event.currentTarget.value, 80);
                }}
                className="w-36 bg-transparent px-1.5 text-[0.7rem] font-black uppercase tracking-widest outline-none"
                defaultValue="UNTITLED_PROJECT"
              />
              <span className="text-[0.68rem] font-bold text-slate-400 pr-0.5">.T2S</span>
            </div>

            <div className="mx-1.5 h-4 w-px bg-slate-200/80 dark:bg-slate-700/50"></div>

            <ToolbarIconButton id="downloadBtn" icon={<Download size={13} />} title="Export" />
            <div className="flex h-6 items-center rounded-lg border border-slate-200/80 bg-slate-50/80 px-1.5 dark:border-slate-700/50 dark:bg-slate-800/50">
              <select id="downloadFormat" aria-label="Export format" className="bg-transparent text-[0.63rem] font-bold outline-none dark:text-slate-300">
                <option value="sb3">SB3</option>
                <option value="t2sh">T2SH</option>
              </select>
            </div>
            <ToolbarIconButton id="uploadBtn" icon={<Upload size={13} />} title="Import" />
            <ToolbarIconButton id="sampleBtn" icon={<FolderOpen size={13} />} title="Templates" />

            <div className="mx-1.5 h-4 w-px bg-slate-200/80 dark:bg-slate-700/50"></div>

            <ToolbarIconButton id="saveCloudBtn" icon={<Save size={13} />} title="Sync" />
            <ToolbarIconButton id="shareProjectBtn" icon={<Share2 size={13} />} title="Deploy" />

            <div className="mx-1.5 h-4 w-px bg-slate-200/80 dark:bg-slate-700/50"></div>

            <button
              type="button"
              id="publishCommunityBtn"
              title="Post to Community Forum"
              aria-label="Post project to community forum"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-[0.68rem] font-black uppercase text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
            >
              <Globe size={11} /> Post
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span id="cloudAuthState" className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">Checking session...</span>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="border-b border-black/5 bg-slate-50/70 px-3 py-1.5 dark:border-slate-800/70 dark:bg-[#0a0e1a]/80">
          <div className="space-y-1.5">
            <div
              role={workspaceStatus.severity === "error" ? "alert" : "status"}
              aria-live={workspaceStatus.severity === "error" ? "assertive" : "polite"}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[0.67rem] font-bold ${workspaceStatusStyles[workspaceStatus.severity]}`}
            >
              {isBootingWorkspace ? (
                <Loader2 size={13} className="shrink-0 animate-spin" />
              ) : workspaceStatus.severity === "error" ? (
                <AlertCircle size={13} className="shrink-0" />
              ) : workspaceStatus.severity === "success" ? (
                <CheckCircle2 size={13} className="shrink-0" />
              ) : (
                <Info size={13} className="shrink-0" />
              )}
              <span className="truncate">{loadError || workspaceStatus.message}</span>
            </div>
            {workspaceTroubleshooting.length > 0 && (
              <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-3 py-2 text-[0.7rem] leading-relaxed text-rose-900 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-100">
                {workspaceTroubleshooting.map((suggestion) => (
                  <p key={suggestion}>{suggestion}</p>
                ))}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBootAttempt((current) => current + 1)}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-widest text-white hover:bg-rose-700"
                  >
                    Retry boot
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-lg border border-rose-200/80 bg-white px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-widest text-rose-800 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-transparent dark:text-rose-100 dark:hover:bg-rose-900/20"
                  >
                    Reload page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main panels ── */}
        <div className="flex flex-1 overflow-hidden p-0.5 gap-0.5 select-none" style={{ userSelect: isResizingSidebar || isResizingPreview ? "none" : "auto" }}>

          {/* Column 1: Categories */}
          <div className="flex w-16 flex-col items-center gap-3 border-r border-black/5 bg-white/95 py-4 dark:border-slate-800/60 dark:bg-[#0d1220]/95 shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToSection(cat.section)}
                aria-label={`Scroll to ${cat.label} commands`}
                className="flex flex-col items-center gap-1 group transition-all hover:translate-x-0.5"
              >
                <div className={`h-7 w-7 rounded-full ${cat.color} shadow-sm group-hover:shadow-lg group-hover:scale-115 transition-all ring-2 ring-white dark:ring-slate-800`}></div>
                <span className="text-[0.6rem] font-black uppercase tracking-tight text-slate-400 group-hover:text-[#4d97ff] dark:group-hover:text-blue-400 transition-colors">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Column 2: Blocks Palette */}
          <div className="flex flex-col border-r border-black/5 bg-white/95 dark:border-slate-800/60 dark:bg-[#0d1220]/95 shrink-0" style={{ width: sidebarWidth }}>
            <div className="flex h-8 items-center justify-between border-b border-slate-100/80 px-3 dark:border-slate-800/60">
              <span className="text-[0.67rem] font-black uppercase tracking-[0.18em] text-slate-400">Registry</span>
              <a href="reference.html" target="_blank" rel="noreferrer" aria-label="Open reference in new tab" className="text-[#4d97ff] hover:opacity-70 transition-opacity">
                <ScanSearch size={12} />
              </a>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              <ul id="commandList" className="space-y-0.5" />
            </div>
          </div>

          {/* Resize Handle 1 */}
          <div
            onMouseDown={() => setIsResizingSidebar(true)}
            onKeyDown={(event) => handleResizeKeyDown(event, "sidebar")}
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize command list"
            aria-valuemin={160}
            aria-valuemax={400}
            aria-valuenow={sidebarWidth}
            className="w-1 cursor-col-resize shrink-0 rounded-full transition-colors hover:bg-[#4d97ff]/40 focus-visible:bg-[#4d97ff]/40"
          />

          {/* Column 3: Code Editor */}
          <div className="flex flex-1 flex-col border-r border-black/5 bg-white dark:border-slate-800/60 dark:bg-[#070a12]">
            <div className="flex h-8 items-center gap-2 border-b border-slate-100/80 px-3 dark:border-slate-800/60">
              <Code2 size={12} className="text-[#4d97ff]" />
              <span className="text-[0.67rem] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Source</span>
            </div>
            <div className="relative flex-1">
              <div id="editorHost" className="h-full w-full" />
              <textarea id="scriptInput" aria-label="Workspace source" className="sr-only" spellCheck="false" />
            </div>
            {/* Diagnostics */}
            <div className="h-20 border-t border-slate-100/80 bg-slate-50/70 p-2 dark:border-slate-800/60 dark:bg-[#0d1220]/80">
              <div className="mb-1 flex items-center gap-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-400">
                <Info size={10} /> Runtime diagnostics
              </div>
              <pre id="status" className="overflow-y-auto font-mono text-[0.65rem] leading-tight text-slate-500 dark:text-slate-400" aria-live="polite">Loading workspace runtime...</pre>
            </div>
          </div>

          {/* Resize Handle 2 */}
          <div
            onMouseDown={() => setIsResizingPreview(true)}
            onKeyDown={(event) => handleResizeKeyDown(event, "preview")}
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize preview panel"
            aria-valuemin={300}
            aria-valuemax={600}
            aria-valuenow={previewWidth}
            className="w-1 cursor-col-resize shrink-0 rounded-full transition-colors hover:bg-[#4d97ff]/40 focus-visible:bg-[#4d97ff]/40"
          />

          {/* Column 4: Preview + Cloud */}
          <div className="flex flex-col gap-0.5 overflow-hidden shrink-0" style={{ width: previewWidth }}>

            {/* Stage Preview */}
            <div className="flex flex-col border border-black/5 bg-white/95 p-1.5 dark:border-slate-800/60 dark:bg-[#0d1220]/95">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Play size={11} className="text-emerald-500" />
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Preview</span>
                </div>
                <div className="flex gap-1">
                  <button type="button" id="previewRunBtn" aria-label="Run preview" className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:opacity-90 active:scale-90 transition-all">
                    <Play size={11} fill="currentColor" />
                  </button>
                  <button type="button" id="previewStopBtn" aria-label="Stop preview" className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:opacity-90 active:scale-90 transition-all">
                    <Square size={9} fill="currentColor" />
                  </button>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200/80 bg-black shadow-inner dark:border-slate-700/40">
                <div id="previewHost" className="h-full w-full" />
                <div id="previewOverlay" className="absolute inset-0 flex items-center justify-center bg-black/65 font-black text-[0.68rem] uppercase tracking-[0.3em] text-white/45">
                  Preview not started
                </div>
              </div>
              <div className="mt-1 flex justify-between px-1 text-[0.68rem] font-bold uppercase tracking-tighter text-slate-400">
                <span id="previewStatus">idle</span>
                <span className="text-[#4d97ff]">TurboWarp engine</span>
              </div>
            </div>

            {/* Cloud Projects */}
            <div className="flex-1 flex flex-col border border-black/5 bg-white/95 p-3 dark:border-slate-800/60 dark:bg-[#0d1220]/95 overflow-y-auto">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100/80 pb-2 dark:border-slate-800/60 shrink-0">
                <Globe size={11} className="text-indigo-400" />
                <span className="text-[0.67rem] font-black uppercase tracking-[0.2em] text-slate-400">Cloud projects</span>
              </div>
              <div className="space-y-4 pb-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[0.63rem] font-black uppercase tracking-widest text-slate-500">Your saved projects</label>
                    <button
                      type="button"
                      id="refreshCloudProjectsBtn"
                      className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[0.6rem] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <RefreshCw size={9} />
                      Refresh
                    </button>
                  </div>
                  <select id="cloudProjectsSelect" aria-label="Saved cloud projects" className="w-full rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-1.5 text-[0.7rem] font-bold dark:border-slate-700/50 dark:bg-slate-800/60 outline-none focus:border-blue-400">
                    <option value="">Querying database...</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.63rem] font-black uppercase tracking-widest text-slate-500">Share link</label>
                  <div className="flex flex-col gap-1.5">
                    <input id="shareLinkOutput" aria-label="Share link" readOnly className="w-full rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-1.5 text-[0.65rem] font-mono dark:border-slate-700/50 dark:bg-slate-800/60" placeholder="NULL" />
                    <button type="button" id="copyShareLinkBtn" aria-label="Copy share link" className="w-full rounded-lg bg-[#4d97ff] py-1.5 text-[0.7rem] font-black uppercase text-white shadow-sm shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all">Copy Deployment Link</button>
                  </div>
                </div>
                <div id="sharedProjectNotice" role="status" aria-live="polite" className="rounded-lg border border-blue-100/80 bg-blue-50/60 p-2 text-[0.65rem] font-bold text-blue-600 dark:bg-blue-900/10 dark:border-blue-900/20" hidden />
              </div>
              {/* Hidden required elements for legacy script compatibility */}
              <input id="importInput" type="file" className="sr-only" />
              <select id="uploadFormat" className="sr-only"><option value="auto">auto</option></select>
              <button id="signOutBtn" className="sr-only" />
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

function ToolbarIconButton({ id, icon, title }: { id: string; icon: ReactNode; title: string }) {
  return (
    <button
      type="button"
      id={id}
      title={title}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors active:scale-90"
    >
      {icon}
    </button>
  );
}

const workspaceStatusStyles: Record<WorkspaceStatusSeverity, string> = {
  info: "bg-white/80 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/30",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/30",
  error: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/30"
};

async function loadFirstAvailableScript(sources: string[]) {
  let lastError: unknown = null;
  for (const source of sources) {
    try {
      await loadExternalScript(source);
      return source;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not load external script.");
}
