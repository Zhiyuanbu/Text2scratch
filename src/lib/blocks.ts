import rawCatalog from "../../blocks.json";

interface BlockField {
  name?: string;
  options?: string[];
  default?: string | number | boolean;
  registry?: string;
}

interface BlockInput {
  name?: string;
  type?: string;
  mode?: string;
  options?: string[];
  default?: string | number | boolean;
  registry?: string;
  menuOpcode?: string;
}

interface BlockDefinition {
  hidden?: boolean;
  kind?: string;
  syntax?: string;
  description?: string;
  opcode?: string;
  extension?: string;
  fields?: BlockField[];
  inputs?: BlockInput[];
}

interface BlockCatalog {
  aliases?: Record<string, string>;
  commands: Record<string, BlockDefinition>;
}

export interface ReferenceEntry {
  name: string;
  syntax: string;
  description: string;
  kind: string;
  extension: string;
  section: string;
  target: string;
  opcode: string;
  example: string;
  searchText: string;
}

const catalog = rawCatalog as BlockCatalog;

const CORE_PREFIX_LABELS: Record<string, string> = {
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

const PLACEHOLDER_EXAMPLES: Record<string, string> = {
  key_option: "space",
  steps: "10",
  degrees: "15",
  x: "0",
  y: "0",
  secs: "1",
  duration: "1",
  message: "\"Hello\"",
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

const COMMAND_EXAMPLES: Record<string, string> = {
  make_var: "make_var score 0",
  make_list: "make_list inventory",
  make_broadcast: "make_broadcast start_round",
  when_flag_clicked: "when_flag_clicked",
  else: "else",
  end: "end"
};

export const aliases = catalog.aliases || {};

export function getReferenceEntries() {
  return Object.entries(catalog.commands)
    .filter(([, definition]) => !definition.hidden)
    .map(([name, definition]) => {
      const kind = definition.kind || "stack";
      const syntax = definition.syntax || name;
      const description = definition.description?.trim() || defaultDescription(kind, syntax);
      const extension = definition.extension || "core";
      const target = getTargetAvailability(definition.opcode || "");
      const example = buildExample(name, syntax, kind);

      return {
        name,
        syntax,
        description,
        kind,
        extension,
        target,
        example,
        opcode: definition.opcode || "",
        section: buildSectionLabel(name, definition),
        searchText: [
          name,
          syntax,
          description,
          extension,
          target,
          definition.opcode || "",
          definition.kind || "",
          example
        ].join(" ").toLowerCase()
      } satisfies ReferenceEntry;
    })
    .sort((left, right) => {
      if (left.section === right.section) {
        return left.name.localeCompare(right.name);
      }
      return left.section.localeCompare(right.section);
    });
}

export function getReferenceCategories(entries: ReferenceEntry[]) {
  return [...new Set(entries.map((entry) => entry.extension))]
    .sort((left, right) => left.localeCompare(right));
}

function buildSectionLabel(name: string, definition: BlockDefinition) {
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

  const prefix = String(definition.opcode || "").split("_")[0];
  return CORE_PREFIX_LABELS[prefix] || "Core / Meta";
}

function getTargetAvailability(opcode: string) {
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

function buildExample(name: string, syntax: string, kind: string) {
  if (COMMAND_EXAMPLES[name]) {
    return COMMAND_EXAMPLES[name];
  }

  const replaced = syntax
    .replace(/<([^>]+)>/g, (_full, token) => sampleForPlaceholder(token))
    .replace(/\s+/g, " ")
    .trim();

  if (kind === "boolean") {
    return `if ${replaced}\n  say "Ready"\nend`;
  }

  if (kind === "reporter") {
    return `set_var temp ${replaced}`;
  }

  return replaced;
}

function sampleForPlaceholder(token: string) {
  const key = token.toLowerCase();
  if (PLACEHOLDER_EXAMPLES[key]) {
    return PLACEHOLDER_EXAMPLES[key];
  }

  if (key.includes("message")) {
    return "\"Hello\"";
  }
  if (key.includes("color")) {
    return "#00a8ff";
  }
  if (key.includes("x") || key.includes("y") || key.includes("value")) {
    return "10";
  }
  return "value";
}

function defaultDescription(kind: string, syntax: string) {
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
      return "Scratch-style action command.";
  }
}
