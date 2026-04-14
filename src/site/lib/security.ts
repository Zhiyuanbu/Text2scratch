import {
  MAX_PROJECT_NAME_LENGTH,
  MAX_WORKSPACE_SOURCE_LENGTH,
  sanitizeEmailInput as canonicalSanitizeEmailInput,
  sanitizeIdentifierInput as canonicalSanitizeIdentifierInput,
  sanitizeProjectNameInput as canonicalSanitizeProjectNameInput,
  sanitizeScratchSourceInput,
  sanitizeUsernameInput as canonicalSanitizeUsernameInput,
  isValidEmailInput as canonicalIsValidEmailInput,
  isValidPasswordInput as canonicalIsValidPasswordInput
} from "./inputSafety";

export { MAX_PROJECT_NAME_LENGTH, MAX_WORKSPACE_SOURCE_LENGTH };

export const MAX_WORKSPACE_LINE_COUNT = 5_000;

export interface SanitizedInputResult {
  value: string;
  issues: string[];
}

export function sanitizeProjectNameInput(value: string, fallback = "project"): SanitizedInputResult {
  const normalized = canonicalSanitizeProjectNameInput(value);
  const nextValue = normalized || fallback;
  const issues: string[] = [];

  if (nextValue !== String(value || "")) {
    issues.push("Project name was sanitized to remove unsupported characters.");
  }

  return {
    value: nextValue,
    issues
  };
}

export function sanitizeWorkspaceSource(value: string): SanitizedInputResult {
  const rawValue = String(value || "");
  const issues: string[] = [];

  let nextValue = sanitizeScratchSourceInput(rawValue, MAX_WORKSPACE_SOURCE_LENGTH);
  if (nextValue !== rawValue) {
    issues.push("Removed unsupported control characters from the workspace source.");
  }

  const lineCount = nextValue ? nextValue.split("\n").length : 0;
  if (lineCount > MAX_WORKSPACE_LINE_COUNT) {
    issues.push(`Workspace input is limited to ${MAX_WORKSPACE_LINE_COUNT} lines.`);
    nextValue = nextValue.split("\n").slice(0, MAX_WORKSPACE_LINE_COUNT).join("\n");
  }

  if (nextValue.length > MAX_WORKSPACE_SOURCE_LENGTH) {
    issues.push(`Workspace input is limited to ${MAX_WORKSPACE_SOURCE_LENGTH.toLocaleString()} characters.`);
    nextValue = nextValue.slice(0, MAX_WORKSPACE_SOURCE_LENGTH);
  }

  return {
    value: nextValue,
    issues
  };
}

export function sanitizeIdentifierInput(value: string) {
  return canonicalSanitizeIdentifierInput(value);
}

export function sanitizeEmailInput(value: string) {
  return canonicalSanitizeEmailInput(value);
}

export function sanitizeUsernameInput(value: string) {
  return canonicalSanitizeUsernameInput(value);
}

export function isValidEmailInput(value: string) {
  return canonicalIsValidEmailInput(value);
}

export function isValidPasswordInput(value: string) {
  return canonicalIsValidPasswordInput(value);
}
