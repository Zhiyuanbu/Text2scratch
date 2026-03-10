import type { ReactNode } from "react";
import { ArrowUpRight, LibraryBig, ScanSearch, TerminalSquare } from "lucide-react";
import { getReferenceEntries } from "../lib/blocks";
import { AppShell } from "../components/AppShell";
import { ReferenceExplorer } from "../components/ReferenceExplorer";

const entries = getReferenceEntries();

export function ReferencePage() {
  return (
    <AppShell page="reference">
      <section className="hero-glow border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <LibraryBig className="h-3.5 w-3.5" />
              Full command reference
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">Search the complete syntax catalog without digging through long docs.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This page is optimized for lookup. Search by name, opcode, category, or concept, then copy exact syntax or working examples directly into the workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard title="Catalog size" value={`${entries.length} commands`} description="Generated from the live command catalog instead of a disconnected hand-written page." />
            <StatCard title="Search surface" value="Syntax + opcode" description="Find commands whether you think in Scratch concepts or implementation details." />
            <StatCard title="Copy workflow" value="One click" description="Copy the command form or a working example without rewriting it by hand." />
            <StatCard title="Plain view" value="/dev route" description="Open the stripped-down text catalog when you want the smallest possible reference view." />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <ReferenceExplorer />
        </div>

        <aside className="grid gap-4">
          <InfoCard
            icon={<ScanSearch className="h-5 w-5" />}
            title="How to use this page"
            description="Search first, then narrow by kind, category, or target. The result cards are meant to be scanned quickly, not read like a tutorial."
          />
          <InfoCard
            icon={<TerminalSquare className="h-5 w-5" />}
            title="Need the plain list?"
            description="The `/dev` route exposes the same catalog in a flatter text view for quick scanning."
            href="dev/"
            cta="Open /dev"
          />
          <InfoCard
            icon={<ArrowUpRight className="h-5 w-5" />}
            title="Learning the syntax?"
            description="If you are still forming a mental model of project structure, start in the docs and return here for exact command lookup."
            href="docs.html"
            cta="Read docs"
          />
        </aside>
      </section>
    </AppShell>
  );
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}

function InfoCard({
  icon,
  title,
  description,
  href,
  cta
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      {href && cta ? (
        <a href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-slate-700 dark:text-white dark:hover:text-slate-300">
          {cta}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : null}
    </article>
  );
}
