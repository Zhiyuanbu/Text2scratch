import type { ReactNode } from "react";
import { ArrowRight, CircleAlert, Code2, Layers3, WandSparkles } from "lucide-react";
import { aliases, getReferenceEntries } from "../lib/blocks";
import { AppShell } from "../components/AppShell";

const entries = getReferenceEntries();
const quickStartEntries = [
  entries.find((entry) => entry.name === "make_var"),
  entries.find((entry) => entry.name === "when_flag_clicked"),
  entries.find((entry) => entry.name === "broadcast"),
  entries.find((entry) => entry.name === "repeat")
].filter((entry): entry is (typeof entries)[number] => Boolean(entry));

const quickStartExample = `make_var score 0
make_broadcast start_round

stage_code =
  when_flag_clicked
  broadcast start_round
end

sprite = "Cat"
cat_code =
  when_broadcast_received start_round
  repeat 5
    move 10
    change_var score 1
  end
end`;

const commonMistakes = [
  "Forgetting to close nested blocks with `end`.",
  "Using reporter or boolean expressions as standalone commands on their own lines.",
  "Placing sprite-only commands inside `stage_code =` blocks.",
  "Guessing argument values instead of using the documented menu values or examples."
];

export function DocsPage() {
  return (
    <AppShell page="docs">
      <section className="hero-glow border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Code2 className="h-3.5 w-3.5" />
              Guided documentation
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">Learn the syntax in the order people actually need it.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Start with project structure, then move into commands. This guide is optimized for first-time users who want to get productive quickly without reverse-engineering the reference catalog.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="reference.html" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                Open full reference
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="converter.html" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white">
                Open workspace
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quick orientation</p>
            <div className="mt-5 grid gap-4">
              <MiniPanel
                icon={<Layers3 className="h-5 w-5" />}
                title="Project structure"
                description="Define data first, then Stage code, then sprite sections. The structure is part of the syntax."
              />
              <MiniPanel
                icon={<WandSparkles className="h-5 w-5" />}
                title="Fast lookup"
                description={`Alias support is available for ${Object.keys(aliases).length} shorthand forms, but the reference always shows canonical syntax first.`}
              />
              <MiniPanel
                icon={<CircleAlert className="h-5 w-5" />}
                title="Common failure mode"
                description="Most broken files come from missing `end` lines or putting value expressions where stack commands belong."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick start</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Build your first project with a minimal, valid file.</h2>
          <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
            If you only remember one pattern, remember this: declare project-level data, start a top-level section with <code>stage_code =</code> or <code>&lt;sprite&gt;_code =</code>, then close every nested block with <code>end</code>.
          </p>
          <ul className="grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <li>Use `make_var`, `make_list`, and `make_broadcast` before any script needs them.</li>
            <li>Put Stage-only scripts inside `stage_code =`.</li>
            <li>
              Create each sprite with <code>sprite = "Name"</code> and follow it with a matching <code>&lt;name&gt;_code =</code> section.
            </li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-slate-950 shadow-[0_28px_70px_rgba(15,23,42,0.22)] dark:border-white/10">
          <div className="border-b border-white/10 px-5 py-4 text-sm text-white/60">quick-start.t2s</div>
          <pre className="overflow-x-auto px-5 py-6 text-sm leading-7 text-slate-100">
            <code>{quickStartExample}</code>
          </pre>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/60 py-16 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto w-full max-w-7xl px-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Core concepts</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">These are the commands most first projects touch immediately.</h2>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {quickStartEntries.map((entry) => (
              <article
                key={entry.name}
                className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <code className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                    {entry.syntax}
                  </code>
                  <span className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-300">
                    {entry.kind}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{entry.description}</p>
                <div className="mt-5 rounded-2xl border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Example</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{entry.example}</pre>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Common mistakes</p>
          <div className="mt-6 grid gap-4">
            {commonMistakes.map((mistake) => (
              <article key={mistake} className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {mistake}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white dark:text-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 dark:text-slate-500">Next step</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Use the docs for learning. Use the reference for precision.</h2>
          <p className="mt-4 text-sm leading-7 text-white/75 dark:text-slate-600">
            Once you understand the project shape, jump to the full reference page for exact syntax, command categories, and copy-ready examples.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="reference.html" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
              Browse reference
            </a>
            <a href="dev/" className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 dark:border-slate-300 dark:text-slate-950 dark:hover:bg-slate-950/10">
              Open /dev
            </a>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function MiniPanel({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}
