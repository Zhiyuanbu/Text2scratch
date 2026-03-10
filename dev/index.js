const aliasOutput = document.getElementById("aliasOutput");
const catalogSummary = document.getElementById("catalogSummary");
const catalogOutput = document.getElementById("catalogOutput");

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

init().catch((error) => {
  const message = `Failed to load blocks.json: ${error.message}`;
  aliasOutput.textContent = message;
  catalogSummary.textContent = message;
  catalogOutput.textContent = message;
});

async function init() {
  const catalog = await loadCatalog();
  renderAliases(catalog.aliases || {});
  renderCatalog(catalog.commands || {});
}

async function loadCatalog() {
  if (window.TEXT2SCRATCH_BLOCKS?.commands) {
    return window.TEXT2SCRATCH_BLOCKS;
  }

  const response = await fetch("../data/blocks.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function renderAliases(aliases) {
  const entries = Object.entries(aliases).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    aliasOutput.textContent = "No aliases defined.";
    return;
  }

  aliasOutput.textContent = entries
    .map(([alias, canonical]) => `${alias} -> ${canonical}`)
    .join("\n");
}

function renderCatalog(commands) {
  const entries = Object.entries(commands)
    .filter(([, definition]) => !definition.hidden)
    .map(([name, definition]) => normalizeEntry(name, definition))
    .sort((a, b) => {
      if (a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }
      return a.name.localeCompare(b.name);
    });

  const byKind = countBy(entries, (entry) => entry.kind);
  const byTarget = countBy(entries, (entry) => entry.target);
  const bySection = countBy(entries, (entry) => entry.section);

  catalogSummary.textContent = [
    `total_commands: ${entries.length}`,
    "",
    "by_kind:",
    ...formatCountMap(byKind),
    "",
    "by_target:",
    ...formatCountMap(byTarget),
    "",
    "by_section:",
    ...formatCountMap(bySection)
  ].join("\n");

  catalogOutput.textContent = entries
    .map((entry) => {
      const inputLines = entry.inputs.length > 0
        ? entry.inputs.map((item) => `  - ${item}`)
        : ["  - none"];
      const fieldLines = entry.fields.length > 0
        ? entry.fields.map((item) => `  - ${item}`)
        : ["  - none"];
      const noteLines = entry.notes.length > 0
        ? entry.notes.map((item) => `  - ${item}`)
        : ["  - none"];

      return [
        `section: ${entry.section}`,
        `command: ${entry.name}`,
        `kind: ${entry.kind}`,
        `target: ${entry.target}`,
        `syntax: ${entry.syntax}`,
        `opcode: ${entry.opcode || "(none)"}`,
        `extension: ${entry.extension || "core"}`,
        `description: ${entry.description}`,
        "inputs:",
        ...inputLines,
        "fields:",
        ...fieldLines,
        "notes:",
        ...noteLines,
        `example: ${entry.example}`,
        ""
      ].join("\n");
    })
    .join("\n");
}

function normalizeEntry(name, definition) {
  const kind = String(definition.kind || "stack").trim() || "stack";
  const opcode = String(definition.opcode || "").trim();
  const extension = String(definition.extension || "").trim();
  const syntax = String(definition.syntax || name).trim() || name;
  const description = String(definition.description || defaultDescription(kind, syntax)).trim();
  const target = getTargetAvailability(opcode);
  const section = buildSectionLabel(name, definition);
  const inputs = Array.isArray(definition.inputs)
    ? definition.inputs.map((input) => formatInput(input))
    : [];
  const fields = Array.isArray(definition.fields)
    ? definition.fields.map((field) => formatField(field))
    : [];
  const notes = buildNotes({ kind, syntax, target, extension, opcode });

  return {
    name,
    kind,
    target,
    syntax,
    opcode,
    extension,
    description,
    section,
    inputs,
    fields,
    notes,
    example: buildExample(name, syntax, kind)
  };
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

  if (name === "else" || name === "end") {
    return "Core / Control";
  }

  const opcode = String(definition.opcode || "").trim();
  const prefix = opcode.split("_")[0];
  return CORE_PREFIX_LABELS[prefix] || "Core / Meta";
}

function getTargetAvailability(opcode) {
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

function formatInput(input) {
  const name = String(input?.name || "UNKNOWN").trim();
  const mode = String(input?.mode || "value").trim();
  const defaultValue = Object.prototype.hasOwnProperty.call(input || {}, "default")
    ? JSON.stringify(input.default)
    : "(none)";
  return `${name} | mode=${mode} | default=${defaultValue}`;
}

function formatField(field) {
  const name = String(field?.name || "UNKNOWN").trim();
  const defaultValue = Object.prototype.hasOwnProperty.call(field || {}, "default")
    ? JSON.stringify(field.default)
    : "(none)";
  const options = Array.isArray(field?.options) && field.options.length > 0
    ? field.options.join(", ")
    : "any";
  return `${name} | default=${defaultValue} | options=${options}`;
}

function buildNotes(entry) {
  const notes = [];

  if (entry.syntax.startsWith("@") || entry.kind === "reporter" || entry.kind === "boolean") {
    notes.push("Value expression. Use inside another command input, not as a standalone line.");
  }

  if (entry.kind === "c") {
    notes.push("Control block. Any nested body must end with a matching end line.");
  }

  if (entry.kind === "else") {
    notes.push("Flow control marker. Only valid inside if or if_else before the matching end.");
  }

  if (entry.kind === "end") {
    notes.push("Closes the nearest open block or code section.");
  }

  if (entry.target === "sprite") {
    notes.push("Sprite-compatible only. Do not use inside stage_code.");
  }

  if (entry.extension) {
    notes.push(`Requires the Scratch extension category: ${entry.extension}.`);
  }

  if (!entry.opcode) {
    notes.push("Meta or structural syntax. This line controls project structure rather than mapping to a Scratch opcode.");
  }

  return notes;
}

function defaultDescription(kind, syntax) {
  if (syntax.startsWith("@")) {
    return "Expression syntax that returns a value.";
  }

  switch (kind) {
    case "hat":
      return "Starts a script when an event occurs.";
    case "boolean":
      return "Returns true or false for conditions.";
    case "reporter":
      return "Returns a value for use inside another command input.";
    case "meta":
      return "Project setup or structure command.";
    case "define":
      return "Custom block definition syntax.";
    case "call":
      return "Custom block call syntax.";
    default:
      return "Standard stack command.";
  }
}

function buildExample(name, syntax, kind) {
  if (name === "make_var") {
    return "make_var score 0";
  }
  if (name === "make_list") {
    return "make_list inventory";
  }
  if (name === "make_broadcast") {
    return "make_broadcast round_start";
  }
  if (name === "stage_code") {
    return "stage_code =";
  }

  const fallback = syntax.replace(/<([^>]+)>/g, (_full, token) => sampleForToken(token));
  if (kind === "boolean") {
    return `if ${fallback}\n  say "Condition met"\nend`;
  }
  if (kind === "reporter") {
    return `set_var temp ${fallback}`;
  }
  return fallback;
}

function sampleForToken(token) {
  const key = String(token || "").trim().toLowerCase();
  if (key.includes("message") || key.includes("question") || key.includes("words")) {
    return '"Hello"';
  }
  if (key.includes("color")) {
    return "#00a8ff";
  }
  if (key.includes("broadcast")) {
    return "round_start";
  }
  if (key.includes("backdrop")) {
    return "backdrop1";
  }
  if (key.includes("costume")) {
    return "costume1";
  }
  if (key.includes("direction")) {
    return "90";
  }
  if (key.includes("key")) {
    return "space";
  }
  if (key.includes("sound")) {
    return "pop";
  }
  if (key.includes("list")) {
    return "inventory";
  }
  if (key.includes("variable")) {
    return "score";
  }
  if (key.includes("condition")) {
    return "@gt(@var(score), 5)";
  }
  if (key.includes("object") || key.includes("to") || key.includes("towards")) {
    return "_mouse_";
  }
  if (key.includes("style")) {
    return "left-right";
  }
  return "10";
}

function countBy(entries, select) {
  const counts = new Map();
  entries.forEach((entry) => {
    const key = select(entry);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function formatCountMap(map) {
  return [...map.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([key, value]) => `- ${key}: ${value}`);
}
