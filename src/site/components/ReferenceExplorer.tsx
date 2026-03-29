import { useDeferredValue, useState } from "react";
import { Copy, Search, Sparkles, Terminal, Filter, Code2, Tag } from "lucide-react";
import { getReferenceCategories, getReferenceEntries, type ReferenceEntry } from "../lib/blocks";
import { useToast } from "../providers/AppProviders";

const entries = getReferenceEntries();
const categories = getReferenceCategories(entries);

export function ReferenceExplorer() {
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const [target, setTarget] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = entries.filter((entry) => {
    if (kind !== "all" && entry.kind !== kind) return false;
    if (category !== "all" && entry.extension !== category) return false;
    if (target !== "all" && entry.target !== target) return false;
    if (deferredQuery && !entry.searchText.includes(deferredQuery)) return false;
    return true;
  });

  const sections = groupBySection(filtered);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search Header */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
        <div className="grid gap-4 md:grid-cols-[1fr_repeat(3,160px)]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search protocol commands..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 transition-all"
            />
          </div>

          <SelectField icon={<Tag size={12} />} value={kind} onChange={setKind} options={[
            ["all", "All Kinds"],
            ["stack", "Stack"],
            ["hat", "Hat"],
            ["reporter", "Reporter"],
            ["boolean", "Boolean"],
            ["meta", "Meta"],
            ["define", "Define"]
          ]} />

          <SelectField icon={<Filter size={12} />} value={category} onChange={setCategory} options={[
            ["all", "All Categories"],
            ...categories.map((item) => [item, item.charAt(0).toUpperCase() + item.slice(1)])
          ]} />

          <SelectField icon={<Terminal size={12} />} value={target} onChange={setTarget} options={[
            ["all", "All Targets"],
            ["both", "Stage + Sprite"],
            ["sprite", "Sprite Only"]
          ]} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
          <span>Catalog Index</span>
          <span className="text-blue-600">{filtered.length} nodes matched</span>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-8">
        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#161b22]">
            No commands matching criteria found in protocol registry.
          </div>
        ) : (
          sections.map(([section, sectionEntries]) => (
            <div key={section} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{section}</h3>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {sectionEntries.map((entry) => (
                  <article key={`${section}-${entry.name}`} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 transition-all dark:border-slate-800 dark:bg-[#161b22]">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="space-y-1">
                        <code className="text-xs font-bold text-blue-600 dark:text-blue-400">{entry.syntax}</code>
                        <p className="text-[0.8rem] text-slate-600 dark:text-slate-400 leading-snug">{entry.description}</p>
                      </div>
                      <span className="shrink-0 text-[0.6rem] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{entry.kind}</span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => void copyText(entry.syntax, "Syntax copied", pushToast)}
                          className="flex items-center gap-1.5 text-[0.7rem] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          <Copy size={12} /> Syntax
                        </button>
                        <button
                          onClick={() => void copyText(entry.example, "Example copied", pushToast)}
                          className="flex items-center gap-1.5 text-[0.7rem] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          <Copy size={12} /> Example
                        </button>
                      </div>
                      <div className="flex gap-2 text-[0.6rem] font-bold uppercase text-slate-300">
                        <span>{entry.extension}</span>
                        <span>•</span>
                        <span>{entry.target}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function SelectField({
  icon,
  value,
  onChange,
  options
}: {
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 transition-all cursor-pointer"
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
    </div>
  );
}

function ChevronRight({ size, className, rotate = 0 }: { size: number, className?: string, rotate?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

function groupBySection(items: ReferenceEntry[]) {
  const groups = new Map<string, ReferenceEntry[]>();
  items.forEach((entry) => {
    const existing = groups.get(entry.section) || [];
    existing.push(entry);
    groups.set(entry.section, existing);
  });
  return [...groups.entries()];
}

async function copyText(
  value: string,
  title: string,
  pushToast: (toast: { title: string; description?: string; variant?: "success" | "error" | "info" | "warning" }) => void
) {
  try {
    await navigator.clipboard.writeText(value);
    pushToast({ title, variant: "success" });
  } catch {
    pushToast({ title: "Copy failed", variant: "error" });
  }
}
