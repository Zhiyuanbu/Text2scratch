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
  Save,
  ScanSearch,
  Share2,
  Square,
  Upload
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { loadExternalScript } from "../lib/loadExternalScript";
import { useAuth } from "../providers/AppProviders";

const JSZIP_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
const MONACO_LOADER_URL = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js";
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
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [previewWidth, setPreviewWidth] = useState(440);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [isBootingWorkspace, setIsBootingWorkspace] = useState(false);
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
        setSidebarWidth(Math.max(160, Math.min(400, e.clientX - 64))); // 64 is cat bar width
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
      if (!detail?.message) {
        return;
      }

      setWorkspaceStatus({
        message: detail.message,
        severity: detail.severity || "info"
      });
    };

    window.addEventListener("text2scratch.status", handleWorkspaceStatus as EventListener);
    return () => window.removeEventListener("text2scratch.status", handleWorkspaceStatus as EventListener);
  }, []);

  useEffect(() => {
    const handleWorkspaceReady = () => {
      setIsBootingWorkspace(false);
    };

    window.addEventListener("text2scratch.ready", handleWorkspaceReady as EventListener);
    return () => window.removeEventListener("text2scratch.ready", handleWorkspaceReady as EventListener);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsBootingWorkspace(false);
      setLoadError("");
      setWorkspaceStatus({
        message: "Sign in to load the workspace runtime.",
        severity: "info"
      });
      return;
    }

    let cancelled = false;
    const bootWorkspace = async () => {
      setIsBootingWorkspace(true);
      setLoadError("");
      setWorkspaceStatus({
        message: "Loading workspace runtime...",
        severity: "info"
      });

      try {
        await loadExternalScript(JSZIP_SCRIPT_URL);
        try { await loadExternalScriptNoAmd(SCAFFOLDING_SCRIPT_URL); } catch {}
        await loadExternalScript(MONACO_LOADER_URL);
        if (cancelled) return;
        await import("../../legacy/workspace/app.js");
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Workspace boot failed.";
          setLoadError(message);
          setWorkspaceStatus({
            message,
            severity: "error"
          });
          setIsBootingWorkspace(false);
        }
      }
    };
    void bootWorkspace();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) {
    return (
      <AppShell page="converter">
        <section className="flex h-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-sm space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#4d97ff]/10 text-[#4d97ff]">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Checking workspace access</h1>
            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Loading your session before the editor starts.
            </p>
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
              <a href="login.html" className="rounded-md bg-[#4d97ff] px-4 py-2.5 text-[0.75rem] font-black uppercase text-white shadow-md hover:bg-blue-600 transition-transform active:scale-95">Initialize Session</a>
              <a href="signup.html" className="text-[0.75rem] font-black uppercase text-blue-600 hover:underline">Register New Node</a>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell page="converter">
      <div className="flex h-full flex-col overflow-hidden bg-[#f0f0f0] dark:bg-[#0d1117] animate-in fade-in duration-300">
        
        {/* Workspace Header (Scratch style toolbar) */}
        <div className="flex h-9 items-center justify-between border-b border-black/5 bg-white px-2 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 rounded bg-slate-50 p-0.5 dark:bg-slate-800">
              <input id="projectNameInput" className="w-32 bg-transparent px-1 text-[0.7rem] font-black uppercase outline-none" defaultValue="UNTITLED_PROJECT" />
              <span className="text-[0.6rem] font-bold text-slate-400">.T2S</span>
            </div>
            <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <ToolbarIconButton id="downloadBtn" icon={<Download size={14} />} title="Export" />
            <div className="flex h-6 items-center rounded border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-800">
              <select id="downloadFormat" className="bg-transparent text-[0.65rem] font-bold outline-none">
                <option value="sb3">SB3</option>
                <option value="t2sh">T2SH</option>
              </select>
            </div>
            <ToolbarIconButton id="uploadBtn" icon={<Upload size={14} />} title="Import" />
            <ToolbarIconButton id="sampleBtn" icon={<FolderOpen size={14} />} title="Templates" />
            <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <ToolbarIconButton id="saveCloudBtn" icon={<Save size={14} />} title="Sync" />
            <ToolbarIconButton id="shareProjectBtn" icon={<Share2 size={14} />} title="Deploy" />
            <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <button
              id="publishCommunityBtn"
              title="Post to Community Forum"
              className="flex items-center gap-1.5 rounded bg-emerald-500 px-2 py-1 text-[0.6rem] font-black uppercase text-white shadow-sm hover:bg-emerald-600 transition-all active:scale-95"
            >
              <Globe size={12} /> Post
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span id="cloudAuthState" className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Checking session...</span>
          </div>
        </div>

        <div className="border-b border-black/5 bg-slate-50/70 px-2 py-1.5 dark:border-slate-800 dark:bg-[#11161d]">
          <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-[0.68rem] font-bold ${workspaceStatusStyles[workspaceStatus.severity]}`}>
            {isBootingWorkspace ? (
              <Loader2 size={14} className="shrink-0 animate-spin" />
            ) : workspaceStatus.severity === "error" ? (
              <AlertCircle size={14} className="shrink-0" />
            ) : workspaceStatus.severity === "success" ? (
              <CheckCircle2 size={14} className="shrink-0" />
            ) : (
              <Info size={14} className="shrink-0" />
            )}
            <span className="truncate">{loadError || workspaceStatus.message}</span>
          </div>
        </div>

        {/* Main Interface Layout */}
        <div className="flex flex-1 overflow-hidden p-0.5 gap-0.5 select-none" style={{ userSelect: isResizingSidebar || isResizingPreview ? 'none' : 'auto' }}>
          
          {/* Column 1: Categories Bar */}
          <div className="flex w-16 flex-col items-center gap-3 border-r border-black/5 bg-white py-4 dark:border-slate-800 dark:bg-[#161b22] shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.section)}
                className="flex flex-col items-center gap-1 group transition-all hover:translate-x-0.5"
              >
                <div className={`h-8 w-8 rounded-full ${cat.color} shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border-2 border-white dark:border-slate-700`}></div>
                <span className="text-[0.5rem] font-black uppercase tracking-tight text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Column 2: Blocks Palette */}
          <div className="flex flex-col border-r border-black/5 bg-white dark:border-slate-800 dark:bg-[#161b22] shrink-0" style={{ width: sidebarWidth }}>
            <div className="flex h-8 items-center justify-between border-b border-slate-50 px-3 dark:border-slate-800">
              <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Registry</span>
              <a href="reference.html" target="_blank" className="text-blue-600 hover:opacity-80 transition-opacity"><ScanSearch size={12} /></a>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
              <ul id="commandList" className="space-y-0.5" />
            </div>
          </div>

          {/* Resize Handle 1 */}
          <div 
            onMouseDown={() => setIsResizingSidebar(true)}
            className="w-1 hover:bg-blue-500/30 cursor-col-resize transition-colors shrink-0"
          />

          {/* Column 3: Code Editor (Center) */}
          <div className="flex flex-1 flex-col border-r border-black/5 bg-white dark:border-slate-800 dark:bg-[#0d1117]">
            <div className="flex h-8 items-center gap-2 border-b border-slate-50 px-3 dark:border-slate-800">
              <Code2 size={12} className="text-blue-600" />
              <span className="text-[0.65rem] font-black uppercase tracking-widest">Source</span>
            </div>
            <div className="relative flex-1">
              <div id="editorHost" className="h-full w-full" />
              <textarea id="scriptInput" className="sr-only" spellCheck="false" />
            </div>
            {/* Compiler Diagnostic Output */}
            <div className="h-20 border-t border-slate-50 bg-[#f9f9f9] p-2 dark:border-slate-800 dark:bg-[#161b22]">
              <div className="mb-1 flex items-center gap-1 text-[0.55rem] font-black uppercase tracking-widest text-slate-400">
                <Info size={10} /> Runtime diagnostics
              </div>
              <pre id="status" className="overflow-y-auto font-mono text-[0.65rem] leading-tight text-slate-500 dark:text-slate-400" aria-live="polite">Loading workspace runtime...</pre>
            </div>
          </div>

          {/* Resize Handle 2 */}
          <div 
            onMouseDown={() => setIsResizingPreview(true)}
            className="w-1 hover:bg-blue-500/30 cursor-col-resize transition-colors shrink-0"
          />

          {/* Column 4: Preview & Network Control (Right) */}
          <div className="flex flex-col gap-0.5 overflow-hidden shrink-0" style={{ width: previewWidth }}>
            
            {/* Stage Preview */}
            <div className="flex flex-col border border-black/5 bg-white p-1.5 dark:border-slate-800 dark:bg-[#161b22]">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Play size={12} className="text-[#2da44e]" />
                  <span className="text-[0.65rem] font-black uppercase tracking-widest">Preview</span>
                </div>
                <div className="flex gap-1">
                  <button id="previewRunBtn" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2da44e] text-white shadow hover:opacity-90 active:scale-90 transition-all">
                    <Play size={12} fill="currentColor" />
                  </button>
                  <button id="previewStopBtn" className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:opacity-90 active:scale-90 transition-all">
                    <Square size={10} fill="currentColor" />
                  </button>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded border border-slate-200 bg-black shadow-inner">
                <div id="previewHost" className="h-full w-full" />
                <div id="previewOverlay" className="absolute inset-0 flex items-center justify-center bg-black/60 font-black text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
                  Preview not started
                </div>
              </div>
              <div className="mt-1 flex justify-between px-1 text-[0.55rem] font-bold uppercase tracking-tighter text-slate-400">
                <span id="previewStatus">idle</span>
                <span className="text-blue-600">TurboWarp engine</span>
              </div>
            </div>

            {/* Network & Node Control */}
            <div className="flex-1 flex flex-col border border-black/5 bg-white p-3 dark:border-slate-800 dark:bg-[#161b22] overflow-y-auto custom-scrollbar">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-50 pb-2 dark:border-slate-800 shrink-0">
                <Globe size={12} className="text-indigo-500" />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Cloud projects</span>
              </div>
              <div className="space-y-4 pb-2">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-slate-500">Your saved projects</label>
                  <select id="cloudProjectsSelect" className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[0.7rem] font-bold dark:border-slate-700 dark:bg-slate-800 outline-none focus:border-blue-400">
                    <option value="">Querying database...</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-slate-500">Share link</label>
                  <div className="flex flex-col gap-1.5">
                    <input id="shareLinkOutput" readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[0.65rem] font-mono dark:border-slate-700 dark:bg-slate-800" placeholder="NULL" />
                    <button id="copyShareLinkBtn" className="w-full rounded bg-[#4d97ff] py-1.5 text-[0.6rem] font-black uppercase text-white shadow-sm hover:opacity-90 active:scale-95 transition-all">Copy Deployment Link</button>
                  </div>
                </div>
                <div id="sharedProjectNotice" className="rounded border border-blue-100 bg-blue-50/50 p-2 text-[0.65rem] font-bold text-blue-600 dark:bg-blue-900/10 dark:border-blue-900/20" hidden />
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
      id={id}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors active:scale-90"
    >
      {icon}
    </button>
  );
}

const workspaceStatusStyles: Record<WorkspaceStatusSeverity, string> = {
  info: "bg-white text-slate-600 dark:bg-slate-900/70 dark:text-slate-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  error: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
};
