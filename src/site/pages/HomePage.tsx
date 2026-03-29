import type { ReactNode } from "react";
import { 
  ArrowRight, 
  Code2, 
  Cpu, 
  Globe, 
  Terminal, 
  Zap,
  ShieldCheck,
  Layout,
  Play,
  MousePointer2,
  Layers
} from "lucide-react";
import { getReferenceEntries } from "../lib/blocks";
import { AppShell } from "../components/AppShell";

const commandCount = getReferenceEntries().length;

export function HomePage() {
  return (
    <AppShell page="home">
      <div className="bg-[#f0f0f0] dark:bg-[#0d1117] animate-in fade-in duration-700">
        
        {/* Hero Section: Scratch Playful but GitHub Professional */}
        <section className="relative overflow-hidden border-b border-black/5 bg-[#4d97ff] py-20 text-white dark:bg-[#161b22] dark:border-slate-800">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 24px' }}></div>
          
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1.5 text-[0.7rem] font-black uppercase tracking-widest backdrop-blur-md">
                <Zap size={14} className="text-yellow-300" />
                Next Generation Authoring
              </div>
            </div>
            
            <h1 className="mb-6 text-5xl font-black tracking-tighter sm:text-7xl">
              Write Scratch.<br />Fast.
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg font-bold opacity-90 leading-relaxed uppercase tracking-tight">
              The professional plain-text authoring protocol for Scratch creators. Code native projects without the drag-and-drop friction.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a href="converter.html" className="rounded-md bg-white px-8 py-3 text-[0.9rem] font-black uppercase text-[#4d97ff] shadow-xl hover:bg-slate-50 transition-transform active:scale-95">
                Initialize Workspace
              </a>
              <a href="signup.html" className="rounded-md bg-black/20 px-8 py-3 text-[0.9rem] font-black uppercase text-white backdrop-blur-md hover:bg-black/30 transition-colors">
                Join Network
              </a>
            </div>
          </div>
        </section>

        {/* Feature Grid: High Density / GitHub Style */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard 
                icon={<Terminal size={24} />} 
                title="Protocol_IDE" 
                description="High-performance Monaco-powered editor with real-time syntax validation and error reporting."
                color="text-blue-600"
              />
              <FeatureCard 
                icon={<Cpu size={24} />} 
                title="SB3_Compiler" 
                description="Native compilation engine that maps structured text to production-ready Scratch 3.0 project files."
                color="text-emerald-600"
              />
              <FeatureCard 
                icon={<Globe size={24} />} 
                title="Cloud_Registry" 
                description="Secure node persistence for synchronizing project states across the global authoring network."
                color="text-indigo-600"
              />
            </div>
          </div>
        </section>

        {/* Info Section: Scratch Functional */}
        <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">System Specifications</h2>
                  <p className="text-[0.95rem] font-medium leading-relaxed text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    The text2scratch protocol is designed for maximum authoring throughput and precise logical control.
                  </p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <SpecItem icon={<ShieldCheck className="text-[#2da44e]" />} label="Safe_Protocol" value="COPPA Verified" />
                  <SpecItem icon={<Zap className="text-amber-500" />} label="Latency" value={`<${commandCount}ms Compile`} />
                  <SpecItem icon={<Code2 className="text-blue-500" />} label="Syntax" value="Structured_Text" />
                  <SpecItem icon={<Layout className="text-indigo-500" />} label="Output" value="Native_SB3" />
                </div>
              </div>

              <div className="w-full lg:w-72">
                <div className="rounded-xl border border-slate-200 bg-[#f6f8fa] p-6 shadow-inner dark:border-slate-800 dark:bg-[#0d1117]">
                  <div className="mb-6 text-center">
                    <div className="text-4xl font-black text-[#4d97ff]">{commandCount}+</div>
                    <div className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Nodes in Registry</div>
                  </div>
                  <a href="reference.html" className="flex items-center justify-center gap-2 rounded bg-white py-2 text-[0.7rem] font-black uppercase text-slate-700 shadow-sm hover:bg-slate-50 transition-colors border border-slate-200">
                    Explore API <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 text-center">
          <div className="mx-auto max-w-xl px-4">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#4d97ff] text-white shadow-lg shadow-[#4d97ff]/20">
              <Play size={32} fill="currentColor" />
            </div>
            <h2 className="mb-4 text-4xl font-black uppercase tracking-tighter">Ready to Author?</h2>
            <p className="mb-10 font-bold uppercase text-slate-400 tracking-widest">Connect to the project engine and begin your session.</p>
            <a href="converter.html" className="inline-flex items-center gap-3 rounded-md bg-[#2da44e] px-10 py-4 text-[1rem] font-black uppercase text-white shadow-xl hover:opacity-90 transition-transform active:scale-95">
              Initialize Workspace <ArrowRight size={20} />
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22] hover:border-[#4d97ff] transition-colors group">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-[#0d1117] ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="mb-2 text-[0.8rem] font-black uppercase tracking-widest">{title}</h3>
      <p className="text-[0.85rem] font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">{label}</div>
        <div className="text-[0.85rem] font-black uppercase tracking-tight">{value}</div>
      </div>
    </div>
  );
}
