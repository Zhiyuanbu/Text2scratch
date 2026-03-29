import {
  Cloud,
  Code2,
  Download,
  FolderOpen,
  LibraryBig,
  Lock,
  ScanSearch,
  Share2,
  Upload,
  Play,
  Square,
  FileJson,
  Save,
  ChevronRight,
  Info,
  Layers,
  MousePointer2,
  IterationCcw,
  Flag,
  Zap,
  Globe
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
  { id: "motion", label: "Motion", color: "bg-[#4c97ff]" },
  { id: "looks", label: "Looks", color: "bg-[#9966ff]" },
  { id: "sound", label: "Sound", color: "bg-[#cf63cf]" },
  { id: "events", label: "Events", color: "bg-[#ffd500]" },
  { id: "control", label: "Control", color: "bg-[#ffab19]" },
  { id: "sensing", label: "Sensing", color: "bg-[#4cbfe6]" },
  { id: "operators", label: "Operators", color: "bg-[#40bf4a]" },
  { id: "variables", label: "Variables", color: "bg-[#ff8c1a]" },
  { id: "myblocks", label: "My Blocks", color: "bg-[#ff6680]" }
];

export function ConverterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const bootWorkspace = async () => {
      try {
        await loadExternalScript(JSZIP_SCRIPT_URL);
        try { await loadExternalScriptNoAmd(SCAFFOLDING_SCRIPT_URL); } catch {}
        await loadExternalScript(MONACO_LOADER_URL);
        if (cancelled) return;
        await import("../../legacy/workspace/app.js");
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Boot failed.");
      }
    };
    void bootWorkspace();
    return () => { cancelled = true; };
  }, [user]);

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
          </div>
          <div className="flex items-center gap-3">
            <span id="cloudAuthState" className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">System_Idle</span>
          </div>
        </div>

        {/* Main Interface Layout */}
        <div className="flex flex-1 overflow-hidden p-0.5 gap-0.5">
          
          {/* Column 1: Categories Bar (Extreme Slim) */}
          <div className="flex w-14 flex-col items-center gap-2 border-r border-black/5 bg-white py-3 dark:border-slate-800 dark:bg-[#161b22]">
            {categories.map(cat => (
              <button key={cat.id} className="flex flex-col items-center gap-1 group">
                <div className={`h-6 w-6 rounded-full ${cat.color} group-hover:scale-110 transition-transform shadow-sm`}></div>
                <span className="text-[0.55rem] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Column 2: Blocks Palette / Command List */}
          <div className="flex w-56 flex-col border-r border-black/5 bg-white dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex h-8 items-center justify-between border-b border-slate-50 px-3 dark:border-slate-800">
              <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">Registry</span>
              <a href="reference.html" target="_blank" className="text-blue-600 hover:opacity-80 transition-opacity"><ScanSearch size={12} /></a>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              <ul id="commandList" className="space-y-0.5" />
            </div>
          </div>

          {/* Column 3: Code Editor (Center) */}
          <div className="flex flex-1 flex-col border-r border-black/5 bg-white dark:border-slate-800 dark:bg-[#0d1117]">
            <div className="flex h-8 items-center gap-2 border-b border-slate-50 px-3 dark:border-slate-800">
              <Code2 size={12} className="text-blue-600" />
              <span className="text-[0.65rem] font-black uppercase tracking-widest">Protocol_Source</span>
            </div>
            <div className="relative flex-1">
              <div id="editorHost" className="h-full w-full" />
              <textarea id="scriptInput" className="sr-only" spellCheck="false" />
            </div>
            {/* Compiler Diagnostic Output */}
            <div className="h-20 border-t border-slate-50 bg-[#f9f9f9] p-2 dark:border-slate-800 dark:bg-[#161b22]">
              <div className="mb-1 flex items-center gap-1 text-[0.55rem] font-black uppercase tracking-widest text-slate-400">
                <Info size={10} /> Runtime_Diagnostics
              </div>
              <pre id="status" className="overflow-y-auto font-mono text-[0.65rem] leading-tight text-slate-500 dark:text-slate-400" />
            </div>
          </div>

          {/* Column 4: Preview & Network Control (Right) */}
          <div className="flex w-[440px] flex-col gap-0.5 overflow-hidden">
            
            {/* Stage Preview */}
            <div className="flex flex-col border border-black/5 bg-white p-1.5 dark:border-slate-800 dark:bg-[#161b22]">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Play size={12} className="text-[#2da44e]" />
                  <span className="text-[0.65rem] font-black uppercase tracking-widest">Core_Preview</span>
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
                  Ready_To_Initialize
                </div>
              </div>
              <div className="mt-1 flex justify-between px-1 text-[0.55rem] font-bold uppercase tracking-tighter text-slate-400">
                <span id="previewStatus">Node_Idle</span>
                <span className="text-blue-600">Turbowarp_Engine</span>
              </div>
            </div>

            {/* Network & Node Control */}
            <div className="flex-1 flex flex-col border border-black/5 bg-white p-3 dark:border-slate-800 dark:bg-[#161b22]">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-50 pb-2 dark:border-slate-800">
                <Globe size={12} className="text-indigo-500" />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Node_Persistence</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-slate-500">Registry_Archive</label>
                  <select id="cloudProjectsSelect" className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[0.7rem] font-bold dark:border-slate-700 dark:bg-slate-800 outline-none focus:border-blue-400">
                    <option value="">Querying database...</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-black uppercase tracking-widest text-slate-500">Distribution_Endpoint</label>
                  <div className="flex gap-1">
                    <input id="shareLinkOutput" readOnly className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[0.65rem] font-mono dark:border-slate-700 dark:bg-slate-800" placeholder="NULL" />
                    <button id="copyShareLinkBtn" className="rounded bg-[#4d97ff] px-3 text-[0.6rem] font-black uppercase text-white shadow-sm hover:opacity-90">Copy</button>
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
