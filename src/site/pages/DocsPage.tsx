import type { ReactNode } from "react";
import { ArrowRight, CircleAlert, Code2, Layers3, WandSparkles, Cpu, Book, Zap, Info } from "lucide-react";
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

export function DocsPage() {
  return (
    <AppShell page="docs">
      <div className="bg-[#f6f8fa] dark:bg-[#0d1117] animate-in fade-in duration-500">
        
        {/* Header Section */}
        <section className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#4d97ff] dark:text-blue-400">
                <Book size={20} />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest">Protocol Documentation</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">System Specification</h1>
              <p className="max-w-2xl text-[0.95rem] text-slate-500 dark:text-slate-400">
                Official guide for the text2scratch authoring protocol. Learn how to structure projects, define sprites, and execute commands using plain-text syntax.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            
            {/* Main Docs Content */}
            <div className="space-y-12">
              
              {/* Section: Project Anatomy */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                  <Layers3 size={18} className="text-blue-600" /> Project Anatomy
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DocCard 
                    title="Shared Registry" 
                    description="Variables, lists, and broadcasts must be declared at the top of the file before initialization." 
                  />
                  <DocCard 
                    title="Stage Context" 
                    description="Logic specific to the backdrop and global stage environment belongs in the `stage_code` block." 
                  />
                  <DocCard 
                    title="Sprite Definitions" 
                    description="Sprites are initialized via `sprite = 'Name'` and followed by their respective script blocks." 
                  />
                  <DocCard 
                    title="Block Closure" 
                    description="Every control structure (if, repeat, forever) must be terminated with an `end` command." 
                  />
                </div>
              </section>

              {/* Section: Quick Start */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                  <Zap size={18} className="text-amber-500" /> Quick Start
                </h2>
                <div className="rounded-lg border border-slate-200 bg-[#0d1117] overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-800">
                    <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">boilerplate.t2s</span>
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-rose-500/50"></div>
                      <div className="h-2 w-2 rounded-full bg-amber-500/50"></div>
                      <div className="h-2 w-2 rounded-full bg-emerald-500/50"></div>
                    </div>
                  </div>
                  <pre className="p-4 text-[0.85rem] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    <code>{quickStartExample}</code>
                  </pre>
                </div>
              </section>

              {/* Section: Core Primitives */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                  <Cpu size={18} className="text-emerald-600" /> Core Primitives
                </h2>
                <div className="space-y-3">
                  {quickStartEntries.map(entry => (
                    <div key={entry.name} className="p-4 rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22] hover:border-blue-400 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-xs font-bold bg-slate-100 px-2 py-1 rounded dark:bg-slate-800 dark:text-blue-400">{entry.syntax}</code>
                        <span className="text-[0.65rem] font-bold uppercase text-slate-400">{entry.kind}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{entry.description}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Sidebar / Quick Info */}
            <aside className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Info size={12} /> Pro Tips
                </h3>
                <ul className="text-xs space-y-4 text-slate-600 dark:text-slate-400 font-medium">
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    Use aliases like `move` instead of `move_steps` for faster typing.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    The validator in the workspace catch errors before you export.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    Nested expressions always start with the `@` symbol.
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <CircleAlert size={12} className="text-amber-500" /> Validation
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Missing `end` tags are the most common cause of compilation failure. Always ensure your blocks are properly closed.
                </p>
                <a href="reference.html" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
                  Full API Reference <ArrowRight size={12} />
                </a>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DocCard({ title, description }: { title: string, description: string }) {
  return (
    <div className="p-4 rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22] shadow-sm">
      <h4 className="text-sm font-bold mb-2">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">{description}</p>
    </div>
  );
}
