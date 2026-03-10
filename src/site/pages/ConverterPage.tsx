import {
  Cloud,
  Code2,
  Download,
  FolderOpen,
  LibraryBig,
  ScanSearch,
  Share2,
  Upload
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { loadExternalScript } from "../lib/loadExternalScript";

const JSZIP_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
const MONACO_LOADER_URL = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js";
const SCAFFOLDING_SCRIPT_URL = "https://unpkg.com/@turbowarp/scaffolding@0.2.0/dist/scaffolding-min.js";

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
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const bootWorkspace = async () => {
      try {
        await Promise.all([
          loadExternalScript(JSZIP_SCRIPT_URL),
          loadExternalScript(MONACO_LOADER_URL),
          loadExternalScript(SCAFFOLDING_SCRIPT_URL).catch(() => undefined)
        ]);

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
  }, []);

  return (
    <AppShell page="converter">
      <section className="border-b border-black/5 bg-white/80 dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Code2 className="h-3.5 w-3.5" />
              Workspace
            </span>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              Focus on the editor. Everything else stays out of the way.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
              Write commands, validate the structure, then import, export, save, or share from the side without crowding the main editing flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="docs.html"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
            >
              <LibraryBig className="h-4 w-4" />
              Docs
            </a>
            <a
              href="reference.html"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
            >
              <ScanSearch className="h-4 w-4" />
              Reference
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8">
        {loadError ? (
          <div className="mb-6 rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            The workspace shell loaded, but the editor runtime failed to start: {loadError}
          </div>
        ) : null}

        <div id="sharedProjectNotice" className="shared-project-notice mb-6" hidden />

        <div className="grid gap-6">
          <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Editor</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Scratch source</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                One command per line. Use `stage_code =` for Stage scripts, `name_code =` for sprite scripts, and close nested blocks with `end`.
              </p>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              <CompactActionCard
                title="Export"
                description="Download `.sb3` or `.t2sh`."
                action={(
                  <>
                    <button
                      id="downloadBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      <Download className="h-4 w-4" />
                      Export file
                    </button>
                    <select
                      id="downloadFormat"
                      className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                      defaultValue="sb3"
                      aria-label="Export format"
                    >
                      <option value="sb3">Scratch Project (.sb3)</option>
                      <option value="t2sh">Session Backup (.t2sh)</option>
                    </select>
                  </>
                )}
              />

              <CompactActionCard
                title="Import"
                description="Load an `.sb3` or `.t2sh` file."
                action={(
                  <>
                    <button
                      id="uploadBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                    >
                      <Upload className="h-4 w-4" />
                      Import file
                    </button>
                    <select
                      id="uploadFormat"
                      className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                      defaultValue="auto"
                      aria-label="Import format"
                    >
                      <option value="auto">Auto detect</option>
                      <option value="sb3">Scratch Project (.sb3)</option>
                      <option value="t2sh">Session Backup (.t2sh)</option>
                    </select>
                    <input id="importInput" className="sr-only" type="file" aria-label="Import file" />
                  </>
                )}
              />

              <CompactActionCard
                title="Example"
                description="Start from a working sample."
                action={(
                  <button
                    id="sampleBtn"
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Load example
                  </button>
                )}
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-black/10 bg-[linear-gradient(180deg,#0f172a_0%,#101a30_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#0b1222_0%,#10192f_100%)]">
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-white/30" />
                <span className="h-3 w-3 rounded-full bg-white/20" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <label htmlFor="projectNameInput" className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Project
                </label>
                <input
                  id="projectNameInput"
                  className="project-name-input min-w-[220px] flex-1 border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  type="text"
                  defaultValue="multi_sprite_project"
                  maxLength={80}
                  aria-label="Project name"
                />
                <span className="text-sm text-white/45">.t2s</span>
              </div>
              <div id="editorHost" className="code-editor min-h-[560px]" role="region" aria-label="text2scratch code editor" />
              <label className="sr-only" htmlFor="scriptInput">Script</label>
              <textarea
                id="scriptInput"
                className="script-fallback w-full resize-y border-0 bg-[#0d1728] px-4 py-4 text-sm leading-7 text-slate-100 outline-none dark:bg-[#0d1728]"
                spellCheck="false"
                defaultValue=""
              />
            </div>
          </article>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid min-w-0 gap-6">
              <article className="min-w-0 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Preview</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Stage</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      id="previewRunBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      Run preview
                    </button>
                    <button
                      id="previewStopBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                    >
                      Stop
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="stage-viewport border border-black/10 shadow-[0_18px_40px_rgba(15,23,42,0.16)] dark:border-white/10">
                    <div id="previewHost" className="stage-host" role="img" aria-label="Scratch stage preview" />
                    <div id="previewOverlay" className="stage-overlay">
                      Run preview to render the Scratch stage.
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span id="previewStatus" className="preview-status status-info">Preview idle</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      TurboWarp stage
                    </span>
                  </div>
                </div>
              </article>

              <article className="min-w-0 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Diagnostics</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Compiler output</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    Live while you edit
                  </span>
                </div>
                <pre id="status" className="workspace-status status-info mt-5">Booting workspace...</pre>
              </article>

              <article className="min-w-0 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Command browser</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Quick command list</h2>
                  </div>
                  <a href="reference.html" className="text-sm font-semibold text-slate-950 transition hover:text-slate-700 dark:text-white dark:hover:text-slate-300">
                    Open full reference
                  </a>
                </div>
                <ul id="commandList" className="command-list mt-5 grid gap-2 text-sm" aria-live="polite" />
              </article>
            </div>

            <aside className="grid min-w-0 gap-4 self-start">
              <article className="min-w-0 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <Cloud className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Cloud</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Save and share</h2>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Sign in from the dashboard if you want to keep project snapshots online or publish a share link.
                </p>
                <p id="cloudAuthState" className="auth-inline-status status-info mt-4">Not signed in.</p>

                <div className="mt-5 grid gap-3">
                  <button
                    id="saveCloudBtn"
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    <Cloud className="h-4 w-4" />
                    Save to cloud
                  </button>
                  <button
                    id="shareProjectBtn"
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    Create share link
                  </button>
                  <button
                    id="signOutBtn"
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    Sign out
                  </button>
                </div>

                <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  My projects
                  <select
                    id="cloudProjectsSelect"
                    className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                    defaultValue=""
                  >
                    <option value="">Sign in to load projects</option>
                  </select>
                </label>

                <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Share link
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      id="shareLinkOutput"
                      className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                      type="text"
                      readOnly
                      placeholder="No share link yet"
                    />
                    <button
                      id="copyShareLinkBtn"
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                </label>
              </article>

              <article className="min-w-0 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick rules</p>
                <div className="mt-5 grid gap-4">
                  {workspaceRules.map((rule) => (
                    <article key={rule.title} className="rounded-[1.4rem] border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{rule.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{rule.description}</p>
                    </article>
                  ))}
                </div>
              </article>
            </aside>
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
    <article className="rounded-[1.6rem] border border-black/10 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-4 grid gap-3">{action}</div>
    </article>
  );
}
