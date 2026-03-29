import { LibraryBig, Info } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ReferenceExplorer } from "../components/ReferenceExplorer";

export function ReferencePage() {
  return (
    <AppShell page="reference">
      <div className="bg-[#f6f8fa] dark:bg-[#0d1117] animate-in fade-in duration-500">
        
        {/* Compact Functional Header */}
        <section className="border-b border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#4d97ff] dark:text-blue-400">
                <LibraryBig size={20} />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest">Protocol Registry</span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter">Command Reference</h1>
              <p className="max-w-2xl text-[0.85rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                Official index of all authoring nodes supported by the text2scratch compiler. Use this catalog to verify syntax and opcode mapping.
              </p>
            </div>
          </div>
        </section>

        {/* Main Interface Area */}
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
            
            <main className="min-w-0">
              <ReferenceExplorer />
            </main>

            <aside className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Info size={12} /> Usage Guide
                </h3>
                <div className="space-y-4">
                  <p className="text-[0.75rem] text-slate-500 leading-relaxed">
                    Search by protocol name or Scratch opcode. All syntax shown is verified against the compiler schema.
                  </p>
                  <div className="space-y-2">
                    <p className="text-[0.65rem] font-black text-slate-400 uppercase">Target Types</p>
                    <ul className="text-[0.7rem] space-y-1 text-slate-600 dark:text-slate-400 font-medium">
                      <li>• <span className="font-bold">Both:</span> Works in Stage & Sprites</li>
                      <li>• <span className="font-bold">Sprite:</span> Logic restricted to sprites</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
                <p className="text-[0.7rem] text-slate-500 font-medium italic leading-relaxed">
                  "The protocol defines the structure; the compiler generates the reality."
                </p>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
