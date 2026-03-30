import { Info, LibraryBig } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ReferenceExplorer } from "../components/ReferenceExplorer";

export function ReferencePage() {
  return (
    <AppShell page="reference">
      <div className="animate-in fade-in duration-500 bg-[#f6f8fa] dark:bg-[#0d1117]">
        <section className="border-b border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#4d97ff] dark:text-blue-400">
                <LibraryBig size={20} />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest">Protocol Registry</span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter">Command Reference</h1>
              <p className="max-w-2xl text-[0.85rem] leading-relaxed text-slate-500 dark:text-slate-400">
                Browse the full text2scratch command catalog, preview each block in Scratch style, and insert exact syntax back into the workspace.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
            <main className="min-w-0">
              <ReferenceExplorer />
            </main>

            <aside className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <h3 className="mb-3 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">
                  <Info size={12} /> Usage Guide
                </h3>
                <div className="space-y-4">
                  <p className="text-[0.75rem] leading-relaxed text-slate-500">
                    Search by command name, exact syntax, or Scratch opcode. Use the filters to narrow the list by block shape, target, or category.
                  </p>
                  <div className="space-y-2">
                    <p className="text-[0.65rem] font-black uppercase text-slate-400">Target Types</p>
                    <ul className="space-y-1 text-[0.7rem] font-medium text-slate-600 dark:text-slate-400">
                      <li>&bull; <span className="font-bold">Both:</span> Works on the stage and on sprites.</li>
                      <li>&bull; <span className="font-bold">Sprite:</span> Restricted to sprite targets only.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
                <p className="text-[0.7rem] italic leading-relaxed text-slate-500">
                  The registry is the fastest way to confirm exact syntax before you import, preview, or export a project.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
