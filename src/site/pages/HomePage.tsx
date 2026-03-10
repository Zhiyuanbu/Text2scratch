import type { ReactNode } from "react";
import { ArrowRight, FileCode2, Layers3, ScanSearch, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getReferenceEntries } from "../lib/blocks";
import { AppShell } from "../components/AppShell";
import heroEditorIllustrationUrl from "../assets/hero-editor-illustration.svg";

const commandCount = getReferenceEntries().length;

const quickExample = `make_var score 0
make_broadcast start_round

stage_code =
  when_flag_clicked
  broadcast start_round
end

sprite = "Cat"
cat_code =
  when_broadcast_received start_round
  repeat 5
    move 12
    change_var score 1
  end
end`;

const workflowSteps = [
  {
    title: "Write the project",
    description: "Use one command per line, keep blocks nested clearly, and close stacks with `end`."
  },
  {
    title: "Check the script",
    description: "Catch unknown commands, broken nesting, and stage or sprite mistakes before export."
  },
  {
    title: "Export or save",
    description: "Download a real `.sb3` file or keep a `.t2sh` backup for fast restore later."
  }
];

const entryPoints = [
  {
    href: "converter.html",
    title: "Workspace",
    description: "Open the editor first if you already know what you want to build.",
    icon: <FileCode2 className="h-5 w-5" />
  },
  {
    href: "docs.html",
    title: "Docs",
    description: "Start here if you want the syntax explained step by step.",
    icon: <Layers3 className="h-5 w-5" />
  },
  {
    href: "reference.html",
    title: "Reference",
    description: "Search every command when you need exact syntax quickly.",
    icon: <ScanSearch className="h-5 w-5" />
  },
  {
    href: "community.html",
    title: "Community",
    description: "Open shared projects and study how other people structure them.",
    icon: <Users className="h-5 w-5" />
  }
];

export function HomePage() {
  return (
    <AppShell page="home">
      <section className="surface-mask border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,_rgba(99,102,241,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,248,252,0.92)_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_82%_10%,_rgba(99,102,241,0.1),transparent_24%),linear-gradient(180deg,rgba(11,16,32,0.96)_0%,rgba(15,23,42,0.9)_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                Plain-text Scratch editor
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                {commandCount}+ commands ready to search
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
                Write Scratch projects as text, then export the real file.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                text2scratch keeps the editor fast: write commands, check the structure, and export `.sb3` projects without rebuilding the same block stacks by hand.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="converter.html"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:bg-slate-800 hover:shadow-[0_24px_54px_rgba(15,23,42,0.24)] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Open workspace
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="reference.html"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:border-black/20 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Browse reference
              </a>
              <a
                href="docs.html"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:border-black/20 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Read docs
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Metric title="Editing model" value="Plain text" caption="Readable scripts instead of scattered blocks." />
              <Metric title="Export" value="Real `.sb3`" caption="Scratch-ready output, not a mock preview." />
              <Metric title="Use case" value="Classes and projects" caption="Good for lessons, experiments, and quick iteration." />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
              <img
                src={heroEditorIllustrationUrl}
                alt="Illustration of the text2scratch editor flow with syntax, validation, and export panels."
                className="block w-full"
              />
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span>starter-project.t2s</span>
              </div>
              <pre className="overflow-x-auto px-5 py-6 text-sm leading-7 text-slate-100">
                <code>{quickExample}</code>
              </pre>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Checks before export"
                description="See syntax and structure problems before they become broken Scratch scripts."
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Shared examples"
                description="Use the community page when you want a real project to read and learn from."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Start where you need to</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Pick the route that matches what you are doing.</h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {entryPoints.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              className="group rounded-[1.9rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
                {entry.icon}
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{entry.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{entry.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition group-hover:gap-3 dark:text-white">
                Open page
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/60 py-16 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto w-full max-w-7xl px-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">A short loop: write, check, export.</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon={<Layers3 className="h-5 w-5" />}
            title="Keep the editor clear"
            description="The workspace stays focused on writing and validating code. Help pages stay one click away instead of crowding the editor."
          />
          <FeatureCard
            icon={<FileCode2 className="h-5 w-5" />}
            title="Use the same syntax everywhere"
            description="Docs, reference, and the validator all work from the same command catalog."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16">
        <div className="flex flex-col gap-6 rounded-[2.5rem] border border-black/10 bg-slate-950 px-8 py-10 text-white shadow-[0_32px_80px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white dark:text-slate-950 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 dark:text-slate-500">Ready to build?</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Open the workspace when you want to edit, or use the docs and reference when you need to look something up first.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="converter.html" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-1 hover:bg-slate-200 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
              Open workspace
            </a>
            <a href="community.html" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-1 hover:bg-white/10 dark:border-slate-300 dark:text-slate-950 dark:hover:bg-slate-950/10">
              View community
            </a>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{caption}</p>
    </article>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {icon}
      </span>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}
