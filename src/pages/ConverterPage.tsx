import {
  Cloud,
  Code2,
  Download,
  FileCode2,
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

export function ConverterPage() {
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const bootWorkspace = async () => {
      try {
        await Promise.all([
          loadExternalScript(JSZIP_SCRIPT_URL),
          loadExternalScript(MONACO_LOADER_URL)
        ]);

        if (cancelled) {
          return;
        }

        await import("../../app.js");
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
      <section className="hero-glow border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Code2 className="h-3.5 w-3.5" />
              Workspace
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Author Scratch projects as text, validate structure, then export with confidence.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This is the active workspace. Keep docs or reference open while you build if you want exact syntax, target rules, or copy-ready examples nearby.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="docs.html"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <LibraryBig className="h-4 w-4" />
                Quick start
              </a>
              <a
                href="reference.html"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
              >
                <ScanSearch className="h-4 w-4" />
                Full reference
              </a>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Recommended flow</p>
            <ul className="mt-5 grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>Write setup commands first: variables, lists, and broadcasts.</li>
              <li>Use `stage_code =` for Stage logic and `name_code =` for sprite code.</li>
              <li>Check diagnostics before export so structural problems do not reach Scratch.</li>
              <li>Use `.t2sh` for fast backup and restore while iterating.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16">
        {loadError ? (
          <div className="mb-6 rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            The workspace shell loaded, but the editor runtime failed to start: {loadError}
          </div>
        ) : null}

        <div id="sharedProjectNotice" className="shared-project-notice mb-6" hidden />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Editor</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Scratch source</h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  One command per line. Indent nested blocks and close each structure with `end`.
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#081120] shadow-[0_24px_60px_rgba(15,23,42,0.2)] dark:border-white/10">
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
                <div id="editorHost" className="code-editor min-h-[520px]" role="region" aria-label="text2scratch code editor" />
                <label className="sr-only" htmlFor="scriptInput">Script</label>
                <textarea
                  id="scriptInput"
                  className="script-fallback w-full resize-y border-0 bg-[#081120] px-4 py-4 text-sm leading-7 text-slate-100 outline-none"
                  spellCheck="false"
                  defaultValue=""
                />
              </div>
            </article>

            <section className="grid gap-4 lg:grid-cols-3">
              <ActionCard
                eyebrow="Export"
                title="Generate project files"
                description="Use `.sb3` for Scratch and `.t2sh` for fast restore."
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
                    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      Export format
                      <select
                        id="downloadFormat"
                        className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                        defaultValue="sb3"
                      >
                        <option value="sb3">Scratch Project (.sb3)</option>
                        <option value="t2sh">Session Backup (.t2sh)</option>
                      </select>
                    </label>
                  </>
                )}
              />

              <ActionCard
                eyebrow="Import"
                title="Bring in existing work"
                description="Import a Scratch project or a saved text2scratch session."
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
                    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      Import format
                      <select
                        id="uploadFormat"
                        className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                        defaultValue="auto"
                      >
                        <option value="auto">Auto detect</option>
                        <option value="sb3">Scratch Project (.sb3)</option>
                        <option value="t2sh">Session Backup (.t2sh)</option>
                      </select>
                    </label>
                  </>
                )}
              />

              <ActionCard
                eyebrow="Example"
                title="Load a working sample"
                description="Start from a multi-sprite example if you want a safe structure to edit."
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

              <input id="importInput" className="sr-only" type="file" aria-label="Import file" />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Diagnostics</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Compiler output</h2>
                  </div>
                </div>
                <pre id="status" className="workspace-status status-info mt-5">Booting workspace...</pre>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Need syntax help? Use the guided <a href="docs.html" className="font-semibold text-slate-950 dark:text-white">docs</a> or the full{" "}
                  <a href="reference.html" className="font-semibold text-slate-950 dark:text-white">reference catalog</a>.
                </p>
              </article>

              <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Command browser</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Quick command list</h2>
                </div>
                <ul id="commandList" className="command-list mt-5 grid gap-2 text-sm" aria-live="polite" />
              </article>
            </section>
          </div>

          <aside className="grid gap-4 self-start">
            <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Structure rules</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Before you export</h2>
              <ul className="mt-5 grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <li>Every nested block must close with `end`.</li>
                <li>Keep stage-only logic under `stage_code =`.</li>
                <li>Declare each sprite before its matching `name_code =` block.</li>
                <li>Expressions starting with `@` belong inside other commands.</li>
              </ul>
            </article>

            <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <Cloud className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Cloud</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Save and share projects</h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Sign in from the dashboard to save project snapshots and publish share links.
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

            <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Useful links</p>
              <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <a href="docs.html" className="rounded-2xl border border-black/10 px-4 py-3 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white">Quick start guide</a>
                <a href="reference.html" className="rounded-2xl border border-black/10 px-4 py-3 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white">Full searchable reference</a>
                <a href="community.html#community" className="rounded-2xl border border-black/10 px-4 py-3 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white">Public project examples</a>
                <a href="dashboard.html#appearance" className="rounded-2xl border border-black/10 px-4 py-3 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white">Appearance settings</a>
                <a href="dev/" className="rounded-2xl border border-black/10 px-4 py-3 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white">Plain technical reference</a>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function ActionCard({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-5 grid gap-4">{action}</div>
    </article>
  );
}
