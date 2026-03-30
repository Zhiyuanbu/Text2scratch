import rawCatalog from "../../../data/blocks.json";
import {
  buildBlockExample,
  getBlockSectionLabel,
  getBlockTargetAvailability,
  type BlockDefinitionLike
} from "./blockPresentation";

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

interface BlockDefinition extends BlockDefinitionLike {
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
        target: target as ReferenceEntry["target"],
        example,
        opcode: definition.opcode || "",
        section: getBlockSectionLabel(name, definition),
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

function buildExample(name: string, syntax: string, kind: string) {
  return buildBlockExample(name, syntax, kind);
}

function getTargetAvailability(opcode: string) {
  return getBlockTargetAvailability(opcode);
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
