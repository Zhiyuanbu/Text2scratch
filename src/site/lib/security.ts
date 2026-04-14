export const MAX_PROJECT_NAME_LENGTH = 80;
export const MAX_WORKSPACE_SOURCE_LENGTH = 150_000;
export const MAX_WORKSPACE_LINE_COUNT = 5_000;

export interface SanitizedInputResult {
  value: string;
  issues: string[];
}

export function sanitizeProjectNameInput(value: string, fallback = "project"): SanitizedInputResult {
  const normalized = String(value || "")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROJECT_NAME_LENGTH);

  const nextValue = normalized || fallback;
  const issues: string[] = [];

  if (nextValue !== value) {
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

  let nextValue = rawValue.replace(/\r\n?/g, "\n").replace(/[\u0000\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
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
  return String(value || "").trim().slice(0, 120);
}

export function sanitizeEmailInput(value: string) {
  return sanitizeIdentifierInput(value).toLowerCase();
}

export function sanitizeUsernameInput(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
}

export function isValidEmailInput(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizeEmailInput(value));
}

export function isValidPasswordInput(value: string) {
  return String(value || "").trim().length >= 8;
}
