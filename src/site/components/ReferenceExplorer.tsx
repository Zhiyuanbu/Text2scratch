import { type ReactNode, useDeferredValue, useState } from "react";
import { ChevronRight, Copy, Filter, MousePointer2, Search, Tag } from "lucide-react";
import { getReferenceCategories, getReferenceEntries, type ReferenceEntry } from "../lib/blocks";
import { buildScratchblocksCode } from "../lib/blockPresentation";
import { useToast } from "../providers/AppProviders";
import { ScratchBlockPreview } from "./ScratchBlockPreview";

const entries = getReferenceEntries();
const allCategories = getReferenceCategories(entries);

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

  const insertBlock = (syntax: string) => {
    const event = new CustomEvent("text2scratch.insert", { detail: { syntax } });
    window.dispatchEvent(event);
    pushToast({ title: "Block inserted", variant: "success" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
        <div className="grid gap-4 md:grid-cols-[1fr_repeat(3,180px)]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by command, syntax, or opcode..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 transition-all"
            />
          </div>

          <SelectField
            icon={<Tag size={12} />}
            value={kind}
            onChange={setKind}
            options={[
              ["all", "All Kinds"],
              ["stack", "Stack"],
              ["hat", "Hat"],
              ["reporter", "Reporter"],
              ["boolean", "Boolean"],
              ["meta", "Meta"],
              ["define", "Define"]
            ]}
          />

          <SelectField
            icon={<Filter size={12} />}
            value={category}
            onChange={setCategory}
            options={[
              ["all", "All Categories"],
              ...allCategories.map((item) => [item, item === "core" ? "Core" : item])
            ]}
          />

          <SelectField
            icon={<MousePointer2 size={12} />}
            value={target}
            onChange={setTarget}
            options={[
              ["all", "All Targets"],
              ["both", "Stage + Sprite"],
              ["sprite", "Sprite Only"]
            ]}
          />
        </div>
      </section>

      <section className="space-y-10">
        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#161b22]">
            No matching blocks found in the current registry filter.
          </div>
        ) : (
          sections.map(([section, sectionEntries]) => (
            <div key={section} className="space-y-5">
              <div className="flex items-center gap-4">
                <h3 className="whitespace-nowrap text-[0.65rem] font-black uppercase tracking-[0.25em] text-slate-400">{section}</h3>
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {sectionEntries.map((entry) => (
                  <article
                    key={`${section}-${entry.name}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-[#161b22]"
                  >
                    <div className="flex-1 p-4">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => insertBlock(entry.syntax)}
                          className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:border-blue-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900/60"
                          aria-label={`Insert ${entry.syntax}`}
                        >
                          <ScratchBlockPreview
                            code={buildScratchblocksCode(entry.name, {
                              kind: entry.kind,
                              syntax: entry.syntax,
                              opcode: entry.opcode,
                              extension: entry.extension === "core" ? "" : entry.extension
                            })}
                            className="min-h-[2.25rem] min-w-0"
                            scale={0.82}
                          />
                        </button>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[0.55rem] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800">
                          {formatKind(entry.kind)}
                        </span>
                      </div>
                      <code className="mb-3 block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-[0.72rem] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        {entry.syntax}
                      </code>
                      <p className="mb-4 text-[0.8rem] font-medium leading-relaxed text-slate-600 dark:text-slate-400">{entry.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => insertBlock(entry.syntax)}
                          className="flex items-center gap-1.5 text-[0.65rem] font-black uppercase text-blue-600 transition-colors hover:text-blue-700"
                        >
                          <MousePointer2 size={12} /> Use
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyText(entry.example, "Example copied", pushToast)}
                          className="flex items-center gap-1.5 text-[0.65rem] font-black uppercase text-slate-500 transition-colors hover:text-blue-600"
                        >
                          <Copy size={12} /> Example
                        </button>
                      </div>
                      <div className="flex gap-2 text-[0.55rem] font-black uppercase text-slate-300">
                        <span>{formatExtension(entry.extension)}</span>
                        <span>&bull;</span>
                        <span>{formatTarget(entry.target)}</span>
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs font-bold outline-none transition-all cursor-pointer focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      <ChevronRight size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
    </div>
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

function formatKind(value: string) {
  return value === "define" ? "custom" : value;
}

function formatExtension(value: string) {
  return value === "core" ? "core" : value.replace(/_/g, " ");
}

function formatTarget(value: string) {
  return value === "both" ? "stage + sprite" : "sprite only";
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
