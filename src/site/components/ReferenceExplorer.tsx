import { useDeferredValue, useState } from "react";
import { Copy, Search, Sparkles } from "lucide-react";
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
    if (kind !== "all" && entry.kind !== kind) {
      return false;
    }
    if (category !== "all" && entry.extension !== category) {
      return false;
    }
    if (target !== "all" && entry.target !== target) {
      return false;
    }
    if (deferredQuery && !entry.searchText.includes(deferredQuery)) {
      return false;
    }
    return true;
  });

  const sections = groupBySection(filtered);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Searchable syntax catalog</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Exact commands, minimal friction.</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Search by command name, opcode, or concept. Filter by kind, extension, and target compatibility, then copy a working example directly into the workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-slate-950 p-4 text-sm text-white dark:border-white/10 dark:bg-white dark:text-slate-950">
            <p className="font-medium">{filtered.length} commands visible</p>
            <p className="mt-2 text-white/70 dark:text-slate-600">Powered directly by the current command catalog instead of a separate hand-maintained page.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.6fr))]">
          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="broadcast, variables, looks, clone, reporter"
                className="w-full rounded-2xl border border-black/10 bg-slate-50 px-12 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
              />
            </span>
          </label>

          <SelectField label="Kind" value={kind} onChange={setKind} options={[
            ["all", "All kinds"],
            ["stack", "Stack"],
            ["hat", "Hat"],
            ["reporter", "Reporter"],
            ["boolean", "Boolean"],
            ["meta", "Meta"],
            ["define", "Define"]
          ]} />

          <SelectField label="Category" value={category} onChange={setCategory} options={[
            ["all", "All categories"],
            ...categories.map((item) => [item, item === "core" ? "Core" : item])
          ]} />

          <SelectField label="Target" value={target} onChange={setTarget} options={[
            ["all", "All targets"],
            ["both", "Stage + Sprite"],
            ["sprite", "Sprite only"]
          ]} />
        </div>
      </section>

      <section className="grid gap-6">
        {sections.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-8 text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
            No commands match your current filters.
          </div>
        ) : (
          sections.map(([section, sectionEntries]) => (
            <div key={section} className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{section}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{sectionEntries.length} matching commands</h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Search-first workflow
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {sectionEntries.map((entry) => (
                  <article key={`${section}-${entry.name}`} className="grid gap-4 rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid gap-2">
                        <code className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                          {entry.syntax}
                        </code>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{entry.description}</p>
                      </div>
                      <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:text-slate-300">
                        {entry.kind}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-300">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10">Category: {entry.extension}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10">Target: {entry.target}</span>
                      {entry.opcode ? <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10">Opcode: {entry.opcode}</span> : null}
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Example</p>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{entry.example}</pre>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void copyText(entry.syntax, "Syntax copied", pushToast)}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                        Copy syntax
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyText(entry.example, "Example copied", pushToast)}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        <Copy className="h-4 w-4" />
                        Copy example
                      </button>
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
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
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
    pushToast({
      title,
      description: "The command is ready to paste into the workspace.",
      variant: "success"
    });
  } catch {
    pushToast({
      title: "Copy failed",
      description: "Clipboard access is not available in this browser.",
      variant: "error"
    });
  }
}
