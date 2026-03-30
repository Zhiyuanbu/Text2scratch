export interface BlockFieldLike {
  name?: string;
  options?: string[];
  default?: string | number | boolean;
  registry?: string;
}

export interface BlockInputLike {
  name?: string;
  type?: string;
  mode?: string;
  options?: string[];
  default?: string | number | boolean;
  registry?: string;
  menuOpcode?: string;
}

export interface BlockDefinitionLike {
  hidden?: boolean;
  kind?: string;
  syntax?: string;
  description?: string;
  opcode?: string;
  extension?: string;
  fields?: BlockFieldLike[];
  inputs?: BlockInputLike[];
}

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

const SCRATCHBLOCK_CATEGORY_LABELS: Record<string, string> = {
  motion: "motion",
  looks: "looks",
  sound: "sound",
  control: "control",
  sensing: "sensing",
  operator: "operators",
  event: "events",
  data: "variables",
  procedures: "custom"
};

const DROPDOWN_PLACEHOLDERS = new Set([
  "backdrop",
  "broadcast_input",
  "broadcast_option",
  "costume",
  "effect",
  "key_option",
  "rotation_style",
  "sound_menu",
  "stop_option",
  "style",
  "to",
  "towards",
  "video_sensing_attribute",
  "video_state",
  "whengreaterthanmenu"
]);

export function getBlockSectionLabel(name: string, definition: BlockDefinitionLike) {
  if (definition.extension) {
    return `Extensions / ${definition.extension}`;
  }

  if (definition.kind === "meta") {
    if (name === "make_var") return "Core / Variables & Lists";
    if (name === "make_list") return "Core / Variables & Lists";
    if (name === "make_broadcast") return "Core / Events";
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

export function getBlockTargetAvailability(opcode: string) {
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

export function buildBlockExample(name: string, syntax: string, kind: string) {
  if (COMMAND_EXAMPLES[name]) {
    return COMMAND_EXAMPLES[name];
  }

  const replaced = replaceSyntaxPlaceholders(syntax)
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

export function buildScratchblocksCode(name: string, definition: BlockDefinitionLike) {
  const syntax = definition.syntax || name;
  const displayText = humanizeScratchblocksSyntax(COMMAND_EXAMPLES[name] || syntax);
  const overrides = [getScratchblocksCategory(name, definition)];
  const shape = name === "end" ? "cap" : getScratchblocksShape(definition.kind || "stack");

  if (shape !== "stack") {
    overrides.push(shape);
  }

  return `${displayText} :: ${overrides.join(" ")}`;
}

function replaceSyntaxPlaceholders(syntax: string) {
  return syntax.replace(/<([^>]+)>/g, (_full, token) => sampleForPlaceholder(token));
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

function getScratchblocksCategory(name: string, definition: BlockDefinitionLike) {
  if (definition.extension) {
    return "extension";
  }

  if (definition.kind === "define" || definition.kind === "call") {
    return "custom";
  }

  if (name === "make_var") return "variables";
  if (name === "make_list") return "list";
  if (name === "make_broadcast") return "events";
  if (name === "else" || name === "end") return "control";

  const prefix = String(definition.opcode || "").split("_")[0];
  return SCRATCHBLOCK_CATEGORY_LABELS[prefix] || "grey";
}

function getScratchblocksShape(kind: string) {
  if (kind === "cap") {
    return "cap";
  }

  switch (kind) {
    case "hat":
      return "hat";
    case "boolean":
      return "boolean";
    case "reporter":
      return "reporter";
    default:
      return "stack";
  }
}

function humanizeScratchblocksSyntax(syntax: string) {
  return syntax
    .replace(/<([^>]+)>/g, (_full, token) => formatScratchblocksPlaceholder(token))
    .replace(/_/g, " ")
    .replace(/\s*=\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatScratchblocksPlaceholder(token: string) {
  const key = token.toLowerCase();
  const label = token.replace(/_/g, " ");

  if (key.includes("condition")) {
    return `<${label}>`;
  }

  if (key.includes("message") || key.includes("text")) {
    return `[${label}]`;
  }

  if (key.includes("color")) {
    return "[#00a8ff]";
  }

  if (DROPDOWN_PLACEHOLDERS.has(key) || key.endsWith("_option") || key.endsWith("_menu")) {
    return `[${label} v]`;
  }

  return `(${label})`;
}
