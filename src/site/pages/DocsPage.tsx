import { ArrowRight, Book, CircleAlert, Cpu, Info, Layers3, Terminal, WandSparkles } from "lucide-react";
import { AppShell } from "../components/AppShell";

export function DocsPage() {
  return (
    <AppShell page="docs">
      <div className="animate-in fade-in duration-500 bg-[#f6f8fa] dark:bg-[#0d1117]">
        <section className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#4d97ff] dark:text-blue-400">
                <Book size={20} />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest">Protocol Documentation</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">System Specification</h1>
              <p className="max-w-2xl text-[0.95rem] text-slate-500 dark:text-slate-400">
                Learn the project structure, core syntax rules, and the validation flow behind the text2scratch workspace.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-16">
              <section className="space-y-6">
                <h2 className="flex items-center gap-3 border-b border-slate-200 pb-3 text-2xl font-black dark:border-slate-800">
                  <Terminal size={24} className="text-blue-600" /> Syntax Architecture
                </h2>
                <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 dark:prose-invert dark:text-slate-400">
                  <p>The text2scratch protocol is a structured, indent-sensitive language that maps plain text to Scratch project logic.</p>
                  <ul className="space-y-4">
                    <li>
                      <strong>Tokens and arguments:</strong> Commands and arguments are space-separated. Wrap values with spaces in double quotes, such as <code>say "Hello world!"</code>.
                    </li>
                    <li>
                      <strong>Indentation:</strong> Use a standard two-space indent for lines nested inside control blocks or sprite definitions.
                    </li>
                    <li>
                      <strong>Comments:</strong> Start a line with <code>#</code> to add notes that the compiler will ignore.
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="flex items-center gap-3 border-b border-slate-200 pb-3 text-2xl font-black dark:border-slate-800">
                  <Layers3 size={24} className="text-purple-600" /> Project Structure
                </h2>
                <div className="space-y-4">
                  <DocExampleCard
                    title="1. Global Registry"
                    description="Declare variables, lists, and broadcasts at the top of the file so the compiler can build project-wide state."
                    code={`make_var score 0\nmake_broadcast game_over`}
                  />
                  <DocExampleCard
                    title="2. Stage Context"
                    description="Use stage_code to define scripts that belong to the backdrop target."
                    code={`stage_code =\n  when_flag_clicked\n  switch_backdrop_to backdrop1\nend`}
                  />
                  <DocExampleCard
                    title="3. Sprite Targets"
                    description="Define each sprite with a sprite assignment and a named code block."
                    code={`sprite = "Player"\nplayer_code =\n  when_flag_clicked\n  go_to_xy 0 0\nend`}
                  />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="flex items-center gap-3 border-b border-slate-200 pb-3 text-2xl font-black dark:border-slate-800">
                  <Cpu size={24} className="text-orange-500" /> Control Logic
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DocPanel
                    title="Conditionals"
                    accent="text-blue-500"
                    description="Use if / else / end blocks to branch on boolean expressions."
                    code={`if var(score) > 10\n  say "You win!"\nelse\n  say "Keep going"\nend`}
                  />
                  <DocPanel
                    title="Loops"
                    accent="text-green-500"
                    description="Repeat, forever, and repeat-until blocks map directly to Scratch control flow."
                    code={`repeat 10\n  move 10\nend\n\nforever\n  next_costume\nend`}
                  />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="flex items-center gap-3 border-b border-slate-200 pb-3 text-2xl font-black dark:border-slate-800">
                  <WandSparkles size={24} className="text-amber-500" /> Expressions and Math
                </h2>
                <div className="prose prose-slate max-w-none text-sm text-slate-600 dark:prose-invert dark:text-slate-400">
                  <p>Reporter and boolean expressions can be used as inputs to other commands. Variable reads and arithmetic stay inline in plain text.</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 text-left">Type</th>
                        <th className="py-2 text-left">Syntax</th>
                        <th className="py-2 text-left">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="py-3 font-bold">Variable</td>
                        <td className="py-3"><code>var(name)</code></td>
                        <td className="py-3"><code>say var(score)</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold">Arithmetic</td>
                        <td className="py-3"><code>add(a, b)</code></td>
                        <td className="py-3"><code>set_var total add(10, 5)</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold">Random</td>
                        <td className="py-3"><code>pick_random(min, max)</code></td>
                        <td className="py-3"><code>move pick_random(1, 10)</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold">Comparison</td>
                        <td className="py-3"><code>a &gt; b</code></td>
                        <td className="py-3"><code>if var(x) &gt; 100</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <h3 className="mb-4 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">
                  <Info size={12} /> Pro Tips
                </h3>
                <ul className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    Legacy aliases such as `turnright` and `goto` still work, but the documented syntax is safer for new projects.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    The workspace validator catches missing `end` blocks and unsupported syntax before export.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    Keep indentation consistent at two spaces so nested blocks stay readable and easier to debug.
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <h3 className="mb-4 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">
                  <CircleAlert size={12} className="text-amber-500" /> Validation
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  Missing `end` tags are the most common cause of compilation failure. Close every block scope before exporting.
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

function DocExampleCard({
  title,
  description,
  code
}: {
  title: string;
  description: string;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#161b22]">
      <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">{title}</h3>
      <p className="mb-3 text-xs font-medium leading-relaxed text-slate-500">{description}</p>
      <pre className="overflow-x-auto rounded border border-slate-100 bg-slate-50 p-3 font-mono text-[0.75rem] dark:border-slate-800 dark:bg-slate-900">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DocPanel({
  title,
  description,
  code,
  accent
}: {
  title: string;
  description: string;
  code: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22]">
      <h4 className={`mb-2 text-xs font-black uppercase tracking-widest ${accent}`}>{title}</h4>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">{description}</p>
      <pre className="overflow-x-auto rounded border border-slate-100 bg-slate-50 p-3 font-mono text-[0.7rem] dark:border-slate-800 dark:bg-slate-900">
        <code>{code}</code>
      </pre>
    </div>
  );
}
