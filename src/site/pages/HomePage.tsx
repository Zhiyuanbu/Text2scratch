import type { ReactNode } from "react";
import { 
  ArrowRight, 
  Code2, 
  Cpu, 
  FileCode2, 
  Globe, 
  Layers3, 
  Lock, 
  ScanSearch, 
  ShieldCheck, 
  Sparkles, 
  Terminal, 
  Users, 
  Zap
} from "lucide-react";
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

const entryPoints = [
  {
    href: "converter.html",
    title: "Project Engine",
    description: "Initialize your authoring workspace and start writing native logic.",
    icon: <Cpu className="h-6 w-6" />,
    accent: "blue"
  },
  {
    href: "docs.html",
    title: "Documentation",
    description: "Detailed protocol specifications and step-by-step implementation guides.",
    icon: <FileCode2 className="h-6 w-6" />,
    accent: "indigo"
  },
  {
    href: "reference.html",
    title: "API Catalog",
    description: "Explore the complete set of commands and structural definitions.",
    icon: <Terminal className="h-6 w-6" />,
    accent: "sky"
  },
  {
    href: "community.html",
    title: "Shared Assets",
    description: "Analyze production-ready projects and learn from the network.",
    icon: <Globe className="h-6 w-6" />,
    accent: "emerald"
  }
];

export function HomePage() {
  return (
    <AppShell page="home">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-48">
        {/* Advanced Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-1000"></div>
          
          {/* Animated Grid / Dots (GitHub style) */}
          <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.07]" 
               style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-blue-200 bg-blue-50/50 px-5 py-2 text-[0.75rem] font-bold uppercase tracking-[0.2em] text-blue-600 backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
                The Future of Scratch Authoring
              </span>
            </div>

            <h1 className="mx-auto max-w-5xl text-6xl font-black tracking-tighter text-slate-950 sm:text-8xl lg:text-9xl dark:text-white">
              Write Scratch as <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">Professional Code.</span>
            </h1>

            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600 dark:text-slate-400">
              text2scratch bridges the gap between drag-and-drop and real engineering. Deploy native Scratch projects using a high-performance plain-text protocol.
            </p>

            <div className="flex flex-wrap justify-center gap-5 pt-4">
              <a
                href="converter.html"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-slate-950 px-10 py-5 text-[1.1rem] font-bold text-white shadow-[0_30px_60px_rgba(15,23,42,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <span>Initialize Workspace</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="docs.html"
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-5 text-[1.1rem] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              >
                Read Specs
              </a>
            </div>
          </div>

          {/* Interactive Illustration / Code Preview */}
          <div className="mt-24 grid gap-8 lg:grid-cols-[1fr_480px] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <div className="group relative overflow-hidden rounded-[3rem] border border-slate-200 bg-white/80 p-4 shadow-[0_40px_100px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 duration-500"></div>
              <img
                src={heroEditorIllustrationUrl}
                alt="Editor Interface"
                className="relative z-10 w-full rounded-[2rem] transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>

            <div className="group relative overflow-hidden rounded-[3rem] border border-slate-800 bg-[#0b1222] shadow-[0_50px_120px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-8 py-6">
                <div className="flex gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-rose-500/80 shadow-lg shadow-rose-500/20" />
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/20" />
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/20" />
                </div>
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/30">production.t2s</span>
              </div>
              <pre className="overflow-x-auto p-8 text-[1rem] font-medium leading-relaxed text-slate-100 selection:bg-blue-500/30">
                <code>{quickExample}</code>
              </pre>
              
              {/* Terminal Cursor Effect */}
              <div className="absolute bottom-8 right-8 h-6 w-2 bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {entryPoints.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              className="group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-600/20 hover:shadow-[0_30px_60px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-slate-900/40"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 duration-300"></div>
              <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-blue-600 shadow-sm transition-transform duration-500 group-hover:scale-110 dark:bg-white/5 dark:text-blue-400">
                {entry.icon}
              </span>
              <h3 className="relative z-10 mt-8 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{entry.title}</h3>
              <p className="relative z-10 mt-4 text-[1rem] leading-relaxed text-slate-500 dark:text-slate-400">{entry.description}</p>
              <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                Execute
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Stats / Architecture Section */}
      <section className="relative border-y border-slate-100 bg-slate-50/50 py-32 dark:border-white/5 dark:bg-white/2">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">Under the hood</p>
              <h2 className="text-5xl font-black tracking-tighter text-slate-950 dark:text-white sm:text-6xl">Built for Scale and Speed.</h2>
              <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                Our compiler handles the complex Scratch object model so you don't have to. Write lean code and let us generate the heavy metadata.
              </p>
              
              <div className="grid gap-6 pt-4">
                <FeatureItem icon={<Zap />} title="Instant Compilation" description="Zero-latency conversion from text to .sb3 schema." />
                <FeatureItem icon={<ShieldCheck />} title="Structural Integrity" description="Strict validation prevents broken Scratch projects." />
                <FeatureItem icon={<Lock />} title="Protected Auth" description="Only authorized creators can deploy to the cloud." />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full"></div>
              <div className="relative rounded-[3rem] border border-slate-200 bg-white p-10 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Performance Metrics</span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase">Optimal</span>
                  </div>
                  <div className="space-y-6">
                    <StatBar label="Compilation Speed" value="98%" />
                    <StatBar label="File Optimization" value="92%" />
                    <StatBar label="Syntax Accuracy" value="100%" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mx-auto w-full max-w-7xl px-6 py-32 pb-48">
        <div className="group relative overflow-hidden rounded-[4rem] bg-slate-950 px-10 py-24 text-white shadow-[0_60px_150px_rgba(15,23,42,0.5)] dark:bg-white dark:text-slate-950 lg:px-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.2),transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          
          <div className="relative z-10 grid gap-16 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-8">
              <h2 className="text-5xl font-black tracking-tighter sm:text-7xl">Ready to evolve?</h2>
              <p className="max-w-2xl text-2xl font-medium leading-relaxed opacity-70">
                Join thousands of creators building sophisticated Scratch projects with the power of plain-text.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a href="signup.html" className="inline-flex items-center justify-center rounded-2xl bg-white px-12 py-6 text-[1.2rem] font-black text-slate-950 shadow-2xl transition-all hover:-translate-y-1 hover:bg-slate-100 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
                Join the Network
              </a>
              <a href="converter.html" className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-12 py-6 text-[1.2rem] font-black backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/10 dark:border-slate-950/20 dark:hover:bg-slate-950/5">
                Try Sandbox
              </a>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function FeatureItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
        {icon}
      </div>
      <div>
        <h4 className="text-[1.1rem] font-extrabold text-slate-950 dark:text-white">{title}</h4>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: value }}></div>
      </div>
    </div>
  );
}
