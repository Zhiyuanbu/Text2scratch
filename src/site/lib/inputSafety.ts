import { validateText2Scratch } from "./validator";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const MAX_SOURCE_LENGTH = 100_000;
export const MAX_WORKSPACE_SOURCE_LENGTH = MAX_SOURCE_LENGTH;
export const MAX_PROJECT_NAME_LENGTH = 80;
export const MAX_IDENTIFIER_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_USERNAME_LENGTH = 32;

export function sanitizePlainTextInput(value: string, maxLength = MAX_SOURCE_LENGTH) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .slice(0, maxLength);
}

export function sanitizeSingleLineInput(value: string, maxLength = 120) {
  return sanitizePlainTextInput(value, maxLength)
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeEmailInput(value: string) {
  return sanitizeSingleLineInput(value, MAX_EMAIL_LENGTH).toLowerCase();
}

export function sanitizeIdentifierInput(value: string) {
  return sanitizeSingleLineInput(value, MAX_IDENTIFIER_LENGTH);
}

export function sanitizeUsernameInput(value: string) {
  return sanitizeSingleLineInput(value, MAX_USERNAME_LENGTH)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, MAX_USERNAME_LENGTH);
}

export function sanitizeProjectNameInput(value: string) {
  return sanitizeSingleLineInput(value, MAX_PROJECT_NAME_LENGTH);
}

export function sanitizeScratchSourceInput(value: string, maxLength = MAX_WORKSPACE_SOURCE_LENGTH) {
  return sanitizePlainTextInput(value, maxLength);
}

export function isValidEmailInput(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizeEmailInput(value));
}

export function isValidPasswordInput(value: string) {
  return String(value || "").trim().length >= 8;
}

export function assertReasonableScratchSource(
  value: string,
  options?: {
    allowEmpty?: boolean;
    maxLength?: number;
  }
) {
  const maxLength = options?.maxLength || MAX_WORKSPACE_SOURCE_LENGTH;
  const normalized = sanitizeScratchSourceInput(value, maxLength);
  const allowEmpty = options?.allowEmpty !== false;

  if (!allowEmpty && normalized.trim().length === 0) {
    throw new Error("Add some text2scratch code before continuing.");
  }

  if (normalized.length > maxLength) {
    throw new Error(`Project source is too large. Keep it under ${maxLength.toLocaleString()} characters.`);
  }

  return normalized;
}

export function isReasonableScratchSource(value: string) {
  const normalized = sanitizeScratchSourceInput(value);
  return normalized.length > 0 && normalized.length <= MAX_WORKSPACE_SOURCE_LENGTH;
}

export function getScratchSourceValidationMessage(value: string) {
  const result = validateText2Scratch(sanitizeScratchSourceInput(value));
  if (result.ok) {
    return "";
  }

  const firstError = result.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (!firstError) {
    return "";
  }

  return `Line ${firstError.line}: ${firstError.message}`;
}
