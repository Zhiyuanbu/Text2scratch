import blockCatalog from "../../blocks.json";

type Severity = "error" | "warning";

interface BlockDefinition {
  kind?: string;
}

interface BlockCatalog {
  aliases?: Record<string, string>;
  commands?: Record<string, BlockDefinition>;
  sampleScript?: string[];
}

export interface ValidationDiagnostic {
  severity: Severity;
  line: number;
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  summary: {
    errors: number;
    warnings: number;
    lineCount: number;
  };
  diagnostics: ValidationDiagnostic[];
}

interface BlockStackEntry {
  command: string;
  line: number;
  allowElse: boolean;
  inElse: boolean;
}

const catalog = blockCatalog as BlockCatalog;
const aliases = catalog.aliases || {};
const commands = catalog.commands || {};

export const VALIDATOR_SAMPLE = Array.isArray(catalog.sampleScript)
  ? catalog.sampleScript.join("\n")
  : "";

export function validateText2Scratch(code: string): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];
  const lines = normalizeText(code).split("\n");
  const blockStack: BlockStackEntry[] = [];
  const declaredSprites = new Set<string>();

  let insideCodeSection = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    if (/^\s+/.test(rawLine) && countLeadingSpaces(rawLine) % 2 !== 0) {
      diagnostics.push({
        severity: "warning",
        line: lineNumber,
        code: "odd-indentation",
        message: "Use multiples of two spaces for indentation so nested blocks stay readable."
      });
    }

    if (isSpriteDeclaration(trimmed)) {
      declaredSprites.add(normalizeSpriteName(readAssignmentValue(trimmed)));
      insideCodeSection = false;
      return;
    }

    if (isSvgDeclaration(trimmed)) {
      insideCodeSection = false;
      return;
    }

    if (isStageHeader(trimmed)) {
      insideCodeSection = true;
      return;
    }

    const spriteCodeHeader = readSpriteCodeHeader(trimmed);
    if (spriteCodeHeader) {
      insideCodeSection = true;
      if (!declaredSprites.has(normalizeSpriteName(spriteCodeHeader))) {
        diagnostics.push({
          severity: "warning",
          line: lineNumber,
          code: "sprite-before-definition",
          message: `Sprite "${spriteCodeHeader}" has code before its sprite declaration.`
        });
      }
      return;
    }

    const commandToken = readCommandToken(trimmed);
    const normalizedCommand = resolveCommand(commandToken);

    if (!insideCodeSection) {
      if (!normalizedCommand) {
        diagnostics.push({
          severity: "error",
          line: lineNumber,
          code: "unknown-top-level-line",
          message: `Unknown top-level line "${commandToken}".`
        });
        return;
      }

      if ((commands[normalizedCommand]?.kind || "") !== "meta") {
        diagnostics.push({
          severity: "error",
          line: lineNumber,
          code: "command-outside-code",
          message: `Command "${normalizedCommand}" should be inside \`stage_code =\` or \`name_code =\`.`
        });
      }
      return;
    }

    if (trimmed.startsWith("@")) {
      diagnostics.push({
        severity: "error",
        line: lineNumber,
        code: "expression-standalone",
        message: "Expressions that start with `@` must be used inside another command."
      });
      return;
    }

    if (!normalizedCommand) {
      diagnostics.push({
        severity: "error",
        line: lineNumber,
        code: "unknown-command",
        message: `Unknown command "${commandToken}".`
      });
      return;
    }

    if (normalizedCommand === "else") {
      const current = blockStack[blockStack.length - 1];
      if (!current || !current.allowElse) {
        diagnostics.push({
          severity: "error",
          line: lineNumber,
          code: "unexpected-else",
          message: "`else` must follow an open `if` block."
        });
        return;
      }
      if (current.inElse) {
        diagnostics.push({
          severity: "error",
          line: lineNumber,
          code: "duplicate-else",
          message: "Only one `else` is allowed for the same `if` block."
        });
        return;
      }
      current.inElse = true;
      return;
    }

    if (normalizedCommand === "end") {
      if (blockStack.length === 0) {
        diagnostics.push({
          severity: "error",
          line: lineNumber,
          code: "unmatched-end",
          message: "`end` does not match an open block."
        });
        return;
      }
      blockStack.pop();
      return;
    }

    if (requiresEnd(normalizedCommand)) {
      blockStack.push({
        command: normalizedCommand,
        line: lineNumber,
        allowElse: normalizedCommand === "if" || normalizedCommand === "if_else",
        inElse: false
      });
    }
  });

  blockStack.forEach((entry) => {
    diagnostics.push({
      severity: "error",
      line: entry.line,
      code: "missing-end",
      message: `Block "${entry.command}" is missing a closing \`end\`.`
    });
  });

  const errors = diagnostics.filter((item) => item.severity === "error").length;
  const warnings = diagnostics.length - errors;

  return {
    ok: errors === 0,
    summary: {
      errors,
      warnings,
      lineCount: lines.length
    },
    diagnostics
  };
}

function resolveCommand(value: string) {
  const direct = normalizeCommandName(value);
  if (commands[direct]) {
    return direct;
  }

  const alias = aliases[direct];
  if (alias && commands[alias]) {
    return alias;
  }

  return "";
}

function requiresEnd(commandName: string) {
  const kind = String(commands[commandName]?.kind || "").trim().toLowerCase();
  return kind === "hat" || kind === "c" || kind === "define";
}

function readCommandToken(value: string) {
  return String(value.split(/\s+/)[0] || "").trim();
}

function normalizeCommandName(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value: string) {
  return String(value || "").replace(/\r\n?/g, "\n");
}

function countLeadingSpaces(value: string) {
  const match = value.match(/^ */);
  return match ? match[0].length : 0;
}

function isStageHeader(value: string) {
  return /^stage_code\s*=$/i.test(value);
}

function readSpriteCodeHeader(value: string) {
  const match = value.match(/^([a-z0-9_]+)_code\s*=$/i);
  if (!match || String(match[1]).toLowerCase() === "stage") {
    return "";
  }
  return match[1];
}

function isSpriteDeclaration(value: string) {
  return /^sprite\s*=/i.test(value);
}

function isSvgDeclaration(value: string) {
  return /^svg\s*=/i.test(value);
}

function readAssignmentValue(value: string) {
  const [, raw = ""] = value.split("=");
  return String(raw || "").trim().replace(/^["']|["']$/g, "");
}

function normalizeSpriteName(value: string) {
  return String(value || "").trim().toLowerCase();
}
