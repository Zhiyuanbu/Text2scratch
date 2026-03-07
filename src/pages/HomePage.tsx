import type { ReactNode } from "react";
import { ArrowRight, Bot, FileCode2, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { getReferenceEntries } from "../lib/blocks";
import { AppShell } from "../components/AppShell";

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
    title: "Author the project as text",
    description: "Use one command per line, keep nesting explicit with `end`, and structure Stage and sprite code predictably."
  },
  {
    title: "Validate before export",
    description: "Catch syntax mistakes, target mismatches, and structural issues before they turn into broken Scratch scripts."
  },
  {
    title: "Export a real `.sb3`",
    description: "Generate an actual Scratch project archive or save a `.t2sh` session for faster restore and iteration."
  }
];

export function HomePage() {
  return (
    <AppShell page="home">
      <section className="hero-glow surface-mask border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-24">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                High-clarity Scratch authoring
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                {commandCount}+ commands indexed
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
                Build Scratch projects with a developer-grade workflow instead of dragging blocks by hand.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                text2scratch turns plain text into valid Scratch projects, keeps syntax reference close at hand, and gives technical users a faster loop for editing, reviewing, and sharing interactive work.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="converter.html"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Open Workspace
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="docs.html"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
              >
                Read the docs
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Metric title="Readable syntax" value="Plain text" caption="One command per line with explicit control flow." />
              <Metric title="Export target" value="Real `.sb3`" caption="Not a mock archive or preview-only output." />
              <Metric title="Built for" value="Teachers, makers, AI" caption="Faster iteration for technical and educational users." />
            </div>
          </div>

          <div className="grid gap-5">
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
                icon={<FileCode2 className="h-5 w-5" />}
                title="Exact output"
                description="The syntax catalog, docs, and reference all map back to the same command source of truth."
              />
              <FeatureCard
                icon={<Bot className="h-5 w-5" />}
                title="AI-friendly"
                description="The `/dev` route is tuned for deterministic parsing and prompt-time code generation."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Why teams choose it</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">A cleaner editing model for large Scratch projects.</h2>
          <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
            The product is built for workflows where dragging dozens of blocks becomes the slowest part of iteration. The syntax stays legible, the docs stay exact, and the dashboard keeps identity and settings out of the way.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon={<Layers3 className="h-5 w-5" />}
            title="Structure first"
            description="Separate Stage logic, sprite scripts, and project setup without hunting through floating blocks."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Safer editing"
            description="Validation surfaces broken nesting, unknown commands, and target errors before export."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Premium docs"
            description="The guided docs explain how the system works, while the reference page stays optimized for lookup."
          />
          <FeatureCard
            icon={<Bot className="h-5 w-5" />}
            title="Deterministic reference"
            description="Use the plain `/dev` route when you need AI systems or advanced users to produce exact syntax."
          />
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/60 py-16 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto w-full max-w-7xl px-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Workflow</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">From blank text file to working Scratch project in three steps.</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5"
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
        <div className="flex flex-col gap-6 rounded-[2.5rem] border border-black/10 bg-slate-950 px-8 py-10 text-white shadow-[0_32px_80px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-white dark:text-slate-950 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 dark:text-slate-500">Start where it makes sense</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Learn the syntax first, then move into the workspace when you are ready to ship.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="docs.html" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
              Guided docs
            </a>
            <a href="reference.html" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 dark:border-slate-300 dark:text-slate-950 dark:hover:bg-slate-950/10">
              Full reference
            </a>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
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
