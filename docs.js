const ui = {
  search: document.getElementById("searchInput"),
  kind: document.getElementById("kindFilter"),
  scope: document.getElementById("extensionFilter"),
  target: document.getElementById("targetFilter"),
  sort: document.getElementById("sortFilter"),
  reset: document.getElementById("resetFilters"),
  jumpToggle: document.getElementById("jumpMenuToggle"),
  jumpFrame: document.getElementById("jumpMenuFrame"),
  root: document.getElementById("docRoot"),
  stats: document.getElementById("stats"),
  extensionNav: document.getElementById("extensionNav")
};

const KIND_ORDER = ["hat", "stack", "c", "reporter", "boolean", "define", "call", "meta", "else", "end"];
const KIND_LABELS = {
  c: "stack"
};

const CORE_SECTION_ORDER = [
  "Core / Events",
  "Core / Motion",
  "Core / Looks",
  "Core / Sound",
  "Core / Control",
  "Core / Sensing",
  "Core / Operators",
  "Core / Variables & Lists",
  "Core / My Blocks",
  "Core / Meta"
];

const CORE_PREFIX_LABELS = {
  event: "Core / Events",
  motion: "Core / Motion",
  looks: "Core / Looks",
  sound: "Core / Sound",
  control: "Core / Control",
  sensing: "Core / Sensing",
  operator: "Core / Operators",
  data: "Core / Variables & Lists",
  procedures: "Core / My Blocks"
};

const TARGET_LABELS = {
  both: "Stage + Sprite",
  stage: "Stage only",
  sprite: "Sprite only"
};

const KIND_HELP = {
  hat: "Starts a script when an event happens.",
  stack: "Runs one action in order.",
  c: "Runs the nested lines inside this block.",
  reporter: "Outputs a value to place inside another block input.",
  boolean: "Outputs true or false for conditions.",
  define: "Creates a custom block definition.",
  call: "Calls a custom block you already defined.",
  meta: "Sets up project data like variables, lists, or broadcasts.",
  else: "Switches to the else branch of an if block.",
  end: "Closes the nearest open block group."
};

const STAGE_UNSUPPORTED_OPCODE_PREFIXES = ["motion_", "pen_"];
const STAGE_UNSUPPORTED_OPCODES = new Set([
  "event_whenthisspriteclicked",
  "looks_say",
  "looks_sayforsecs",
  "looks_think",
  "looks_thinkforsecs",
  "looks_switchcostumeto",
  "looks_nextcostume",
  "looks_changeeffectby",
  "looks_seteffectto",
  "looks_cleargraphiceffects",
  "looks_show",
  "looks_hide",
  "looks_gotofrontback",
  "looks_goforwardbackwardlayers",
  "looks_changesizeby",
  "looks_setsizeto",
  "looks_costumenumbername",
  "looks_size",
  "sensing_touchingobject",
  "sensing_touchingcolor",
  "sensing_coloristouchingcolor",
  "sensing_distanceto",
  "control_start_as_clone",
  "control_create_clone_of",
  "control_delete_this_clone"
]);

const PLACEHOLDER_EXAMPLES = {
  key_option: "space",
  steps: "10",
  degrees: "15",
  x: "0",
  y: "0",
  secs: "1",
  duration: "1",
  message: '"Hello"',
  value: "10",
  broadcast_option: "start_round",
  broadcast_input: "start_round",
  condition: "var(score) > 5",
  color: "#00a8ff",
  direction: "90",
  style: "left-right",
  costume: "costume1",
  backdrop: "backdrop1",
  to: "_mouse_",
  towards: "_mouse_",
  change: "10",
  num: "1",
  volume: "100",
  size: "100",
  stop_option: "all"
};

const COMMAND_EXAMPLES = {
  make_var: "make_var score 0",
  make_list: "make_list inventory",
  make_broadcast: "make_broadcast start_round",
  when_flag_clicked: "when_flag_clicked",
  else: "else",
  end: "end"
};

const MENU_OPCODE_HINTS = {
  event_broadcast_menu: "Any broadcast message name you created with make_broadcast.",
  motion_goto_menu: "Any sprite name, or special targets like _mouse_ and _random_.",
  motion_glideto_menu: "Any sprite name, or special targets like _mouse_ and _random_.",
  motion_pointtowards_menu: "Any sprite name, or special target _mouse_.",
  looks_costume: "Any costume name on the current sprite.",
  looks_backdrops: "Any backdrop name on the Stage.",
  sound_sounds_menu: "Any sound name available on this target.",
  control_create_clone_of_menu: "A sprite name, or _myself_.",
  sensing_touchingobjectmenu: "A sprite name, _mouse_, or _edge_.",
  sensing_distancetomenu: "A sprite name, or _mouse_.",
  sensing_keyoptions: "Keyboard keys such as space, arrow keys, letters, and numbers.",
  sensing_of_object_menu: "Stage or sprite names from the current project."
};

let blockEntries = [];

init();

async function init() {
  try {
    const response = await fetch("blocks.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load blocks.json (${response.status})`);
    }

    const catalog = await response.json();
    blockEntries = normalizeEntries(catalog);
    populateScopeFilter(blockEntries);
    attachHandlers();
    render();
  } catch (error) {
    ui.root.innerHTML = "";
    const fallback = document.createElement("p");
    fallback.className = "empty-state";
    fallback.textContent = `Failed to load docs: ${error.message}`;
    ui.root.appendChild(fallback);
  }
}

function normalizeEntries(catalog) {
  return Object.entries(catalog.commands)
    .filter(([, definition]) => !definition.hidden)
    .map(([name, definition]) => {
      const kind = definition.kind || "stack";
      const syntax = definition.syntax || name;
      const placeholders = extractPlaceholders(syntax);
      const plainDescription = buildDescription(definition.description, kind, syntax);
      const usageHint = buildUsageHint(kind, placeholders, syntax, definition);
      const argumentGuide = buildArgumentGuide(definition);
      const selectableValues = collectSelectableValues(definition);
      const example = buildExample(name, syntax, kind);
      const scope = definition.extension ? `ext:${definition.extension}` : "core";
      const target = getTargetAvailability(definition);

      return {
        name,
        kind,
        kindLabel: KIND_LABELS[kind] || kind,
        opcode: definition.opcode || "",
        syntax,
        plainDescription,
        usageHint,
        argumentGuide,
        selectableValues,
        example,
        scope,
        target,
        targetLabel: TARGET_LABELS[target],
        section: buildSectionLabel(name, definition),
        inputs: Array.isArray(definition.inputs) ? definition.inputs : [],
        fields: Array.isArray(definition.fields) ? definition.fields : [],
        searchText: [
          name,
          syntax,
          definition.opcode || "",
          plainDescription,
          usageHint,
          argumentGuide,
          selectableValues.map((item) => `${item.label} ${item.text}`).join(" "),
          example,
          scope,
          target,
          definition.extension || "",
          kind
        ].join(" ").toLowerCase()
      };
    });
}

function extractPlaceholders(syntax) {
  const placeholders = [];
  const pattern = /<([^>]+)>/g;
  let match = pattern.exec(syntax);

  while (match) {
    placeholders.push(match[1]);
    match = pattern.exec(syntax);
  }

  return placeholders;
}

function buildDescription(original, kind, syntax) {
  if (original && original.trim().length > 0) {
    return original.trim();
  }

  if (syntax.trim().startsWith("@")) {
    return "Expression form. It returns a value and should be embedded inside another command.";
  }

  return KIND_HELP[kind] || "Runs this command in the generated Scratch project.";
}

function buildUsageHint(kind, placeholders, syntax, definition) {
  const trimmed = syntax.trim();
  if (trimmed.startsWith("@")) {
    return "@ marks expression mode. Use this inside another command input, for example set_var score @var(best_score).";
  }

  if (kind === "reporter" || kind === "boolean") {
    return "Use this inside another command input. Do not place it as a standalone line.";
  }

  if (kind === "else" || kind === "end") {
    return "Use this for block flow control and nesting.";
  }

  const hasDropdown = hasSelectableInputs(definition);
  if (hasDropdown && placeholders.length === 0) {
    return "Type this command and choose values from the allowed dropdown options listed below.";
  }

  if (placeholders.length === 0) {
    return "Type this command exactly as shown.";
  }

  if (placeholders.length === 1) {
    return hasDropdown
      ? `Replace <${placeholders[0]}> and use allowed dropdown values where required (see Selectable Values).`
      : `Replace <${placeholders[0]}> with your value.`;
  }

  return hasDropdown
    ? "Replace each <...> placeholder from left to right. For dropdown inputs, use one of the listed allowed values."
    : "Replace each <...> placeholder from left to right.";
}

function buildExample(name, syntax, kind) {
  if (COMMAND_EXAMPLES[name]) {
    return COMMAND_EXAMPLES[name];
  }

  const replaced = syntax
    .replace(/<([^>]+)>/g, (_full, token) => sampleForPlaceholder(token))
    .replace(/\s+/g, " ")
    .trim();

  if (kind === "boolean") {
    return `if ${replaced}\n  say \"Condition met\"\nend`;
  }

  if (kind === "reporter") {
    return `set_var temp ${replaced}`;
  }

  return replaced;
}

function sampleForPlaceholder(token) {
  const key = (token || "").toLowerCase();
  if (PLACEHOLDER_EXAMPLES[key]) {
    return PLACEHOLDER_EXAMPLES[key];
  }

  if (key.includes("message")) {
    return '"Hello"';
  }

  if (key.includes("color")) {
    return "#00a8ff";
  }

  if (key.includes("key")) {
    return "space";
  }

  if (key.includes("x") || key.includes("y") || key.includes("num") || key.includes("value")) {
    return "10";
  }

  return "value";
}

function buildArgumentGuide(definition) {
  const fields = Array.isArray(definition?.fields) ? definition.fields : [];
  const inputs = Array.isArray(definition?.inputs) ? definition.inputs : [];
  const parts = [];

  fields.forEach((field) => {
    const name = formatSpecName(field?.name);
    if (Array.isArray(field?.options) && field.options.length > 0) {
      parts.push(`${name} = choose one listed option`);
      return;
    }
    if (field?.registry) {
      parts.push(`${name} = existing ${singularize(field.registry)} name`);
      return;
    }
    if (field?.default !== undefined) {
      parts.push(`${name} = text value (default: ${String(field.default)})`);
      return;
    }
    parts.push(`${name} = text value`);
  });

  inputs.forEach((input) => {
    const name = formatSpecName(input?.name);
    const typeLabel = describeInputType(input);

    if (input?.type === "menu") {
      parts.push(`${name} = dropdown value`);
      return;
    }

    parts.push(`${name} = ${typeLabel}`);
  });

  if (parts.length === 0) {
    return "No arguments required.";
  }

  return parts.join("; ");
}

function collectSelectableValues(definition) {
  const rows = [];
  const fields = Array.isArray(definition?.fields) ? definition.fields : [];
  const inputs = Array.isArray(definition?.inputs) ? definition.inputs : [];

  fields.forEach((field) => {
    const label = formatSpecName(field?.name);
    if (Array.isArray(field?.options) && field.options.length > 0) {
      rows.push({
        label,
        text: formatOptionList(field.options)
      });
      return;
    }

    if (field?.registry) {
      rows.push({
        label,
        text: `Any existing ${singularize(field.registry)} name from this project.`
      });
    }
  });

  inputs.forEach((input) => {
    if (input?.type !== "menu") {
      return;
    }

    const label = formatSpecName(input?.name);

    if (Array.isArray(input?.options) && input.options.length > 0) {
      rows.push({
        label,
        text: formatOptionList(input.options)
      });
      return;
    }

    if (input?.registry) {
      rows.push({
        label,
        text: `Any existing ${singularize(input.registry)} name from this project.`
      });
      return;
    }

    if (input?.menuOpcode && MENU_OPCODE_HINTS[input.menuOpcode]) {
      rows.push({
        label,
        text: MENU_OPCODE_HINTS[input.menuOpcode]
      });
      return;
    }

    if (input?.default !== undefined) {
      rows.push({
        label,
        text: `Scratch menu value (default: ${String(input.default)}).`
      });
    }
  });

  return rows;
}

function hasSelectableInputs(definition) {
  return collectSelectableValues(definition).length > 0;
}

function formatSpecName(value) {
  return String(value || "value")
    .toLowerCase()
    .replace(/_/g, " ");
}

function singularize(value) {
  const text = String(value || "").trim();
  if (text.endsWith("s")) {
    return text.slice(0, -1);
  }
  return text || "item";
}

function describeInputType(input) {
  const type = String(input?.type || "text").toLowerCase();
  if (type === "number" || type === "integer" || type === "angle") {
    return "number";
  }
  if (type === "boolean") {
    return "true/false condition or boolean expression";
  }
  if (type === "color") {
    return "color value like #RRGGBB";
  }
  if (type === "menu") {
    return "dropdown option";
  }
  return "text";
}

function formatOptionList(options) {
  return options.map((item) => `\`${String(item)}\``).join(", ");
}

function populateScopeFilter(entries) {
  const existing = [...ui.scope.querySelectorAll("option")].filter((option) => option.value !== "all");
  existing.forEach((option) => option.remove());

  const scopes = [...new Set(entries.map((entry) => entry.scope))].sort((a, b) => {
    if (a === "core") {
      return -1;
    }
    if (b === "core") {
      return 1;
    }
    return a.localeCompare(b);
  });

  scopes.forEach((scopeValue) => {
    const option = document.createElement("option");
    option.value = scopeValue;

    if (scopeValue === "core") {
      option.textContent = "Core Blocks";
    } else {
      option.textContent = `Extension: ${scopeValue.replace(/^ext:/, "")}`;
    }

    ui.scope.appendChild(option);
  });
}

function attachHandlers() {
  ui.search.addEventListener("input", render);
  ui.kind.addEventListener("change", render);
  ui.scope.addEventListener("change", render);
  ui.target.addEventListener("change", render);
  ui.sort.addEventListener("change", render);
  ui.reset.addEventListener("click", resetFilters);

  if (ui.jumpToggle && ui.jumpFrame) {
    setJumpMenuOpen(false);
    ui.jumpToggle.addEventListener("click", toggleJumpMenu);
    document.addEventListener("click", handleOutsideJumpMenuClick);
    document.addEventListener("keydown", handleJumpMenuEscape);
  }
}

function resetFilters() {
  ui.search.value = "";
  ui.kind.value = "all";
  ui.scope.value = "all";
  ui.target.value = "all";
  ui.sort.value = "extension";
  setJumpMenuOpen(false);
  render();
}

function toggleJumpMenu(event) {
  if (event) {
    event.preventDefault();
  }
  const isOpen = ui.jumpToggle.getAttribute("aria-expanded") === "true";
  setJumpMenuOpen(!isOpen);
}

function setJumpMenuOpen(open) {
  if (!ui.jumpToggle || !ui.jumpFrame) {
    return;
  }

  ui.jumpToggle.setAttribute("aria-expanded", open ? "true" : "false");
  ui.jumpFrame.hidden = !open;
}

function handleOutsideJumpMenuClick(event) {
  if (!ui.jumpToggle || !ui.jumpFrame || ui.jumpFrame.hidden) {
    return;
  }

  const target = event.target;
  if (ui.jumpToggle.contains(target) || ui.jumpFrame.contains(target)) {
    return;
  }

  setJumpMenuOpen(false);
}

function handleJumpMenuEscape(event) {
  if (event.key === "Escape") {
    setJumpMenuOpen(false);
  }
}

function render() {
  const query = ui.search.value.trim().toLowerCase();
  const kindFilter = ui.kind.value;
  const scopeFilter = ui.scope.value;
  const targetFilter = ui.target.value;
  const sortMode = ui.sort.value;

  const filtered = blockEntries
    .filter((entry) => matchesKind(entry, kindFilter))
    .filter((entry) => matchesScope(entry, scopeFilter))
    .filter((entry) => matchesTarget(entry, targetFilter))
    .filter((entry) => matchesQuery(entry, query))
    .sort((a, b) => compareEntries(a, b, sortMode));

  const grouped = groupBySection(filtered);
  renderStats(filtered);
  renderSectionNav(grouped);
  renderGroups(grouped);
}

function matchesKind(entry, kindFilter) {
  if (kindFilter === "all") {
    return true;
  }

  if (kindFilter === "define") {
    return entry.kind === "define" || entry.kind === "call";
  }

  return entry.kind === kindFilter;
}

function matchesScope(entry, scopeFilter) {
  if (scopeFilter === "all") {
    return true;
  }
  return entry.scope === scopeFilter;
}

function matchesTarget(entry, targetFilter) {
  if (targetFilter === "all") {
    return true;
  }

  if (targetFilter === "both") {
    return entry.target === "both";
  }

  return entry.target === targetFilter || entry.target === "both";
}

function matchesQuery(entry, query) {
  if (!query) {
    return true;
  }
  return entry.searchText.includes(query);
}

function compareEntries(a, b, sortMode) {
  if (sortMode === "name") {
    return a.name.localeCompare(b.name);
  }

  if (sortMode === "kind") {
    const aIndex = KIND_ORDER.indexOf(a.kind);
    const bIndex = KIND_ORDER.indexOf(b.kind);
    const kindDelta = (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
    if (kindDelta !== 0) {
      return kindDelta;
    }
    return a.name.localeCompare(b.name);
  }

  if (a.section !== b.section) {
    return compareSections(a.section, b.section);
  }

  return a.name.localeCompare(b.name);
}

function groupBySection(entries) {
  const groups = new Map();

  entries.forEach((entry) => {
    if (!groups.has(entry.section)) {
      groups.set(entry.section, []);
    }
    groups.get(entry.section).push(entry);
  });

  return [...groups.entries()].sort((a, b) => compareSections(a[0], b[0]));
}

function renderStats(entries) {
  ui.stats.innerHTML = "";

  const summary = document.createElement("span");
  summary.textContent = `Showing ${entries.length} command${entries.length === 1 ? "" : "s"}.`;
  ui.stats.appendChild(summary);

  const chips = document.createElement("div");
  chips.className = "stats-chips";

  const targets = new Map();
  entries.forEach((entry) => {
    targets.set(entry.targetLabel, (targets.get(entry.targetLabel) || 0) + 1);
  });

  [...targets.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([label, count]) => {
    const chip = document.createElement("span");
    chip.className = "stat-chip";
    chip.textContent = `${label}: ${count}`;
    chips.appendChild(chip);
  });

  ui.stats.appendChild(chips);
}

function renderSectionNav(groups) {
  ui.extensionNav.innerHTML = "";

  if (groups.length === 0) {
    const none = document.createElement("p");
    none.className = "support-text";
    none.textContent = "No matching sections.";
    ui.extensionNav.appendChild(none);
    return;
  }

  groups.forEach(([section, entries]) => {
    const sectionId = `ext-${slugify(section)}`;
    const jumpButton = document.createElement("button");
    jumpButton.type = "button";
    jumpButton.className = "extension-link";
    jumpButton.textContent = `${section} (${entries.length})`;
    jumpButton.setAttribute("aria-controls", sectionId);
    jumpButton.addEventListener("click", () => {
      jumpToSection(sectionId);
      markActiveJumpButton(jumpButton);
      setJumpMenuOpen(false);
    });
    ui.extensionNav.appendChild(jumpButton);
  });
}

function jumpToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function markActiveJumpButton(activeButton) {
  const allButtons = ui.extensionNav.querySelectorAll(".extension-link");
  allButtons.forEach((button) => button.removeAttribute("aria-current"));
  activeButton.setAttribute("aria-current", "true");
}

function renderGroups(groups) {
  ui.root.innerHTML = "";

  if (groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No commands match your current filters.";
    ui.root.appendChild(empty);
    return;
  }

  groups.forEach(([sectionName, entries]) => {
    const section = document.createElement("section");
    section.className = "doc-group";
    section.id = `ext-${slugify(sectionName)}`;

    const heading = document.createElement("h3");
    heading.textContent = `${sectionName} (${entries.length})`;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "doc-grid";

    entries.forEach((entry) => {
      grid.appendChild(renderCard(entry));
    });

    section.appendChild(grid);
    ui.root.appendChild(section);
  });
}

function renderCard(entry) {
  const article = document.createElement("article");
  article.className = "doc-card";

  const top = document.createElement("div");
  top.className = "doc-top";

  const syntax = document.createElement("code");
  syntax.className = "doc-syntax";
  syntax.textContent = entry.syntax;
  top.appendChild(syntax);

  const badge = document.createElement("span");
  badge.className = `kind-badge kind-${entry.kind}`;
  badge.textContent = KIND_LABELS[entry.kind] || entry.kind;
  top.appendChild(badge);

  article.appendChild(top);

  const plain = document.createElement("p");
  plain.className = "doc-plain";
  plain.textContent = entry.plainDescription;
  article.appendChild(plain);

  const howTo = document.createElement("p");
  howTo.className = "doc-howto";
  howTo.textContent = `How to use: ${entry.usageHint}`;
  article.appendChild(howTo);

  const args = document.createElement("p");
  args.className = "doc-args";
  args.textContent = `Arguments: ${entry.argumentGuide}`;
  article.appendChild(args);

  if (entry.selectableValues.length > 0) {
    const valuesDetails = document.createElement("details");
    valuesDetails.className = "doc-options";

    const valuesSummary = document.createElement("summary");
    valuesSummary.textContent = "Selectable values";
    valuesDetails.appendChild(valuesSummary);

    const valuesList = document.createElement("ul");
    valuesList.className = "meta-list";

    entry.selectableValues.forEach((item) => {
      const valueItem = document.createElement("li");
      valueItem.textContent = `${item.label}: ${item.text}`;
      valuesList.appendChild(valueItem);
    });

    valuesDetails.appendChild(valuesList);
    article.appendChild(valuesDetails);
  }

  const example = document.createElement("pre");
  example.className = "doc-example";
  example.textContent = `Example:\n${entry.example}`;
  article.appendChild(example);

  const meta = document.createElement("ul");
  meta.className = "meta-list";

  const targetItem = document.createElement("li");
  targetItem.textContent = `works on: ${entry.targetLabel}`;
  meta.appendChild(targetItem);

  const opcodeItem = document.createElement("li");
  opcodeItem.textContent = `opcode: ${entry.opcode || "(none)"}`;
  meta.appendChild(opcodeItem);

  if (entry.inputs.length > 0) {
    const inputsItem = document.createElement("li");
    inputsItem.textContent = `inputs: ${entry.inputs.map((input) => input.name).join(", ")}`;
    meta.appendChild(inputsItem);
  }

  if (entry.fields.length > 0) {
    const fieldsItem = document.createElement("li");
    fieldsItem.textContent = `fields: ${entry.fields.map((field) => field.name).join(", ")}`;
    meta.appendChild(fieldsItem);
  }

  article.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "doc-actions";

  const copySyntaxButton = document.createElement("button");
  copySyntaxButton.type = "button";
  copySyntaxButton.className = "copy-btn";
  copySyntaxButton.textContent = "Copy syntax";
  copySyntaxButton.addEventListener("click", () => copyToClipboard(entry.syntax, copySyntaxButton));
  actions.appendChild(copySyntaxButton);

  const copyExampleButton = document.createElement("button");
  copyExampleButton.type = "button";
  copyExampleButton.className = "copy-btn";
  copyExampleButton.textContent = "Copy example";
  copyExampleButton.addEventListener("click", () => copyToClipboard(entry.example, copyExampleButton));
  actions.appendChild(copyExampleButton);

  article.appendChild(actions);
  return article;
}

async function copyToClipboard(text, button) {
  const original = button.textContent;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      copyWithFallback(text);
    }
    button.textContent = "Copied";
  } catch (_error) {
    button.textContent = "Copy failed";
  }

  setTimeout(() => {
    button.textContent = original;
  }, 1100);
}

function copyWithFallback(text) {
  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.setAttribute("readonly", "true");
  tempInput.style.position = "absolute";
  tempInput.style.left = "-9999px";
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildSectionLabel(name, definition) {
  if (definition.extension) {
    return `Extensions / ${definition.extension}`;
  }

  if (definition.kind === "meta") {
    return "Core / Meta";
  }

  if (definition.kind === "define" || definition.kind === "call") {
    return "Core / My Blocks";
  }

  const opcode = definition.opcode || "";
  const prefix = opcode.split("_")[0];
  if (CORE_PREFIX_LABELS[prefix]) {
    return CORE_PREFIX_LABELS[prefix];
  }

  if (name === "else" || name === "end") {
    return "Core / Control";
  }

  return "Core / Meta";
}

function compareSections(a, b) {
  const aCoreIndex = CORE_SECTION_ORDER.indexOf(a);
  const bCoreIndex = CORE_SECTION_ORDER.indexOf(b);
  const aIsCore = aCoreIndex >= 0;
  const bIsCore = bCoreIndex >= 0;

  if (aIsCore && bIsCore) {
    return aCoreIndex - bCoreIndex;
  }
  if (aIsCore) {
    return -1;
  }
  if (bIsCore) {
    return 1;
  }

  return a.localeCompare(b);
}

function getTargetAvailability(definition) {
  const opcode = definition.opcode || "";
  if (!opcode) {
    return "both";
  }

  if (STAGE_UNSUPPORTED_OPCODES.has(opcode)) {
    return "sprite";
  }

  if (STAGE_UNSUPPORTED_OPCODE_PREFIXES.some((prefix) => opcode.startsWith(prefix))) {
    return "sprite";
  }

  return "both";
}
