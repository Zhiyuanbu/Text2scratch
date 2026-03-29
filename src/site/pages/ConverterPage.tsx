import {
  Cloud,
  Code2,
  Download,
  FolderOpen,
  LibraryBig,
  Lock,
  ScanSearch,
  Share2,
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
    try {
      delete win.define;
    } catch {
      win.define = undefined;
    }
  }

  return loadExternalScript(src).finally(() => {
    if (previousDefine) {
      win.define = previousDefine;
      if (previousAmd) {
        win.define.amd = previousAmd;
      }
    }
  });
}

const workspaceRules = [
  {
    title: "Declare shared data first",
    description: "Set up variables, lists, and broadcasts before the scripts that use them."
  },
  {
    title: "Keep Stage code separate",
    description: "Use `stage_code =` only for Stage logic, and sprite blocks under each sprite name."
  },
  {
    title: "Nest expressions inside commands",
    description: "Anything that starts with `@` belongs inside another command, not on its own line."
  },
  {
    title: "Open the reference when needed",
    description: "Use the command browser for fast scanning and the full reference for exact syntax."
  }
];

export function ConverterPage() {
  const { user, isLoading } = useAuth();
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const bootWorkspace = async () => {
      try {
        await loadExternalScript(JSZIP_SCRIPT_URL);
        try {
          await loadExternalScriptNoAmd(SCAFFOLDING_SCRIPT_URL);
        } catch {
          // Preview is optional, so ignore scaffolding load failures.
        }
        await loadExternalScript(MONACO_LOADER_URL);

        if (cancelled) {
          return;
        }

        await import("../../legacy/workspace/app.js");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Workspace boot failed.");
        }
      }
    };

    void bootWorkspace();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) {
    return (
      <AppShell page="converter">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell page="converter">
        <section className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center px-6 py-20">
          <div className="group relative w-full overflow-hidden rounded-[3rem] border border-slate-200/60 bg-white/80 p-12 text-center shadow-[0_40px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-slate-800/40 dark:bg-slate-950/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_50%)]"></div>
            <span className="relative z-10 mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-950 text-white shadow-2xl dark:bg-white dark:text-slate-950">
              <Lock className="h-10 w-10" />
            </span>
            <h1 className="relative z-10 mt-10 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Workspace is protected.</h1>
            <p className="relative z-10 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              To create, save, and export Scratch projects using plain-text, you need to be part of the text2scratch platform. Sign in to unlock your personal workspace.
            </p>
            <div className="relative z-10 mt-12 flex flex-wrap justify-center gap-4">
              <a href="login.html" className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-10 py-4 text-[1rem] font-bold text-white shadow-[0_15px_35px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_20px_45px_rgba(37,99,235,0.3)]">
                Sign in to account
              </a>
              <a href="signup.html" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-10 py-4 text-[1rem] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Create new account
              </a>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell page="converter">
      <section className="border-b border-black/5 bg-white/80 dark:border-white/10 dark:bg-slate-950/70 selection:bg-blue-600/10 selection:text-blue-700 dark:selection:bg-blue-500/20 dark:selection:text-blue-300">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-12 lg:flex-row lg:items-end lg:justify-between lg:py-16">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white/80 px-4.5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Code2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Professional Workspace
            </span>
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
              Code with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Zero Friction</span>.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Your personal authoring environment is ready. Write commands, validate logic, and export native project files.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="docs.html"
              className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <LibraryBig className="h-4.5 w-4.5" />
              Docs
            </a>
            <a
              href="reference.html"
              className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ScanSearch className="h-4.5 w-4.5" />
              Reference
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12">
        {loadError ? (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-rose-800 shadow-sm backdrop-blur dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <p className="font-semibold">Runtime error: {loadError}</p>
          </div>
        ) : null}

        <div id="sharedProjectNotice" className="shared-project-notice mb-8" hidden />

        <div className="grid gap-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="grid min-w-0 gap-8">
              <article className="group relative min-w-0 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_35px_80px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Live Preview</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">Project Stage</h2>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      id="previewRunBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-5 py-2.5 text-[0.9rem] font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      Run preview
                    </button>
                    <button
                      id="previewStopBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[0.9rem] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Stop
                    </button>
                  </div>
                </div>

                <div className="relative z-10 mt-8">
                  <div className="stage-viewport overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-[0_30px_70px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
                    <div id="previewHost" className="stage-host" role="img" aria-label="Scratch stage preview" />
                    <div id="previewOverlay" className="stage-overlay flex items-center justify-center text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Ready to execute
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <span id="previewStatus" className="preview-status text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">Preview idle</span>
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400">
                      TurboWarp Core
                    </span>
                  </div>
                </div>
              </article>

              <article className="group relative min-w-0 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_35px_80px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Diagnostics</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">Compiler Output</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    Real-time Analysis
                  </span>
                </div>
                <pre id="status" className="workspace-status mt-6 max-h-[200px] overflow-y-auto rounded-2xl bg-slate-50 p-6 text-sm font-medium leading-relaxed text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">Booting engine...</pre>
              </article>

              <article className="group relative min-w-0 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_35px_80px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">API Browser</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">Quick Reference</h2>
                  </div>
                  <a href="reference.html" className="text-sm font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
                    Full Catalog
                  </a>
                </div>
                <ul id="commandList" className="command-list mt-8 grid gap-2.5 text-sm" aria-live="polite" />
              </article>
            </div>

            <div className="grid min-w-0 gap-8">
              <article className="group relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400">Source Editor</p>
                    <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white uppercase tracking-tight">Main script</h2>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 xl:grid-cols-3">
                  <CompactActionCard
                    title="Export"
                    description="Download natives."
                    action={(
                      <>
                        <button
                          id="downloadBtn"
                          type="button"
                          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-5 py-3.5 text-[0.9rem] font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                          <Download className="h-4.5 w-4.5" />
                          Execute Export
                        </button>
                        <select
                          id="downloadFormat"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          defaultValue="sb3"
                        >
                          <option value="sb3">Native Project (.sb3)</option>
                          <option value="t2sh">Core Backup (.t2sh)</option>
                        </select>
                      </>
                    )}
                  />

                  <CompactActionCard
                    title="Import"
                    description="Load binaries."
                    action={(
                      <>
                        <button
                          id="uploadBtn"
                          type="button"
                          className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[0.9rem] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Upload className="h-4.5 w-4.5" />
                          Initialize Import
                        </button>
                        <select
                          id="uploadFormat"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          defaultValue="auto"
                        >
                          <option value="auto">Auto Protocol</option>
                          <option value="sb3">Native Project (.sb3)</option>
                          <option value="t2sh">Core Backup (.t2sh)</option>
                        </select>
                        <input id="importInput" className="sr-only" type="file" />
                      </>
                    )}
                  />

                  <CompactActionCard
                    title="Template"
                    description="Standard boilerplate."
                    action={(
                      <button
                        id="sampleBtn"
                        type="button"
                        className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[0.9rem] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <FolderOpen className="h-4.5 w-4.5" />
                        Load Template
                      </button>
                    )}
                  />
                </div>

                <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-800 bg-[#0b1222] shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-wrap items-center gap-4 border-b border-white/10 bg-white/5 px-6 py-4">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                      <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <label htmlFor="projectNameInput" className="ml-2 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-white/40">
                      PROJECT_IDENTIFIER
                    </label>
                    <input
                      id="projectNameInput"
                      className="project-name-input min-w-[220px] flex-1 border-0 bg-transparent px-3 py-1 text-sm font-bold text-white outline-none selection:bg-blue-500/30"
                      type="text"
                      defaultValue="master_production_v1"
                      maxLength={80}
                    />
                    <span className="text-xs font-bold text-white/20 uppercase">.t2sh</span>
                  </div>
                  <div id="editorHost" className="code-editor min-h-[600px]" />
                  <label className="sr-only" htmlFor="scriptInput">Script</label>
                  <textarea
                    id="scriptInput"
                    className="script-fallback w-full resize-y border-0 bg-[#0d1728] px-6 py-6 text-sm font-medium leading-relaxed text-slate-100 outline-none selection:bg-blue-500/30"
                    spellCheck="false"
                    defaultValue=""
                  />
                </div>
              </article>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
                <article className="group relative min-w-0 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_35px_80px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg dark:bg-blue-500">
                      <Cloud className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Persistence</p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Cloud Synced</h2>
                    </div>
                  </div>

                  <p id="cloudAuthState" className="relative z-10 mt-6 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 inline-block">Connecting...</p>

                  <div className="relative z-10 mt-8 grid gap-3.5">
                    <button
                      id="saveCloudBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-3 rounded-xl bg-slate-950 px-6 py-4 text-[0.95rem] font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      <Cloud className="h-5 w-5" />
                      Synchronize to Cloud
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        id="shareProjectBtn"
                        type="button"
                        className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[0.9rem] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <Share2 className="h-4.5 w-4.5" />
                        Publish
                      </button>
                      <button
                        id="signOutBtn"
                        type="button"
                        className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[0.9rem] font-bold text-rose-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400"
                      >
                        Log out
                      </button>
                    </div>
                  </div>

                  <label className="relative z-10 mt-8 grid gap-3 text-[0.9rem] font-bold text-slate-700 dark:text-slate-200">
                    Project Archive
                    <select
                      id="cloudProjectsSelect"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      defaultValue=""
                    >
                      <option value="">Querying database...</option>
                    </select>
                  </label>

                  <label className="relative z-10 mt-8 grid gap-3 text-[0.9rem] font-bold text-slate-700 dark:text-slate-200">
                    Distribution Link
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        id="shareLinkOutput"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 selection:bg-blue-500/30"
                        type="text"
                        readOnly
                        placeholder="Project is currently private"
                      />
                      <button
                        id="copyShareLinkBtn"
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-[0.9rem] font-bold text-white transition-all duration-300 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        Copy
                      </button>
                    </div>
                  </label>
                </article>

                <article className="group relative min-w-0 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_35px_80px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <p className="relative z-10 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Guidelines</p>
                  <div className="relative z-10 mt-8 grid gap-4">
                    {workspaceRules.map((rule) => (
                      <article key={rule.title} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                        <h3 className="text-[0.9rem] font-bold text-slate-950 dark:text-white">{rule.title}</h3>
                        <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600 dark:text-slate-400">{rule.description}</p>
                      </article>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function CompactActionCard({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4">{title}</p>
      <div className="grid gap-3.5">{action}</div>
      <p className="mt-4 text-[0.8rem] font-semibold text-slate-500 dark:text-slate-400">{description}</p>
    </article>
  );
}
