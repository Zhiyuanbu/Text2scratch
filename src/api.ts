import { VALIDATOR_SAMPLE, validateText2Scratch } from "./lib/validator";

type ApiFormat = "json" | "ts" | "ui";

interface ApiRequest {
  code: string;
  format: ApiFormat | null;
  hasCodeParam: boolean;
  inputError: string | null;
}

const API_TYPE_DEFINITIONS = `export type ValidationSeverity = "error" | "warning";

export interface ValidationDiagnostic {
  severity: ValidationSeverity;
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
}`;

const API_RESPONSE_EXAMPLE = JSON.stringify(validateText2Scratch(VALIDATOR_SAMPLE), null, 2);

const ui = {
  codeInput: document.getElementById("apiCodeInput") as HTMLTextAreaElement | null,
  validateButton: document.getElementById("apiValidateBtn") as HTMLButtonElement | null,
  sampleButton: document.getElementById("apiSampleBtn") as HTMLButtonElement | null,
  copyButton: document.getElementById("apiCopyBtn") as HTMLButtonElement | null,
  summary: document.getElementById("apiSummary") as HTMLDivElement | null,
  output: document.getElementById("apiJsonOutput") as HTMLPreElement | null,
  modeExamples: document.getElementById("apiModeExamples") as HTMLPreElement | null,
  typeDefinitions: document.getElementById("apiTypeDefinitions") as HTMLPreElement | null,
  responseExample: document.getElementById("apiResponseExample") as HTMLPreElement | null
};

init();

function init() {
  const request = readApiRequest();

  if (request.format && request.format !== "ui") {
    renderMachineMode(request);
    return;
  }

  if (!ui.codeInput || !ui.output || !ui.summary) {
    return;
  }

  ui.validateButton?.addEventListener("click", runValidation);
  ui.sampleButton?.addEventListener("click", () => {
    ui.codeInput!.value = VALIDATOR_SAMPLE;
    runValidation();
  });
  ui.copyButton?.addEventListener("click", () => void copyResult());

  ui.modeExamples?.replaceChildren(document.createTextNode(buildModeExamples()));
  ui.typeDefinitions?.replaceChildren(document.createTextNode(API_TYPE_DEFINITIONS));
  ui.responseExample?.replaceChildren(document.createTextNode(API_RESPONSE_EXAMPLE));

  ui.codeInput.value = request.code;
  runValidation();
}

function runValidation() {
  if (!ui.codeInput || !ui.output || !ui.summary) {
    return;
  }

  const result = validateText2Scratch(ui.codeInput.value);
  ui.output.textContent = JSON.stringify(result, null, 2);
  ui.summary.innerHTML = "";

  const pills = [
    {
      label: result.ok ? "Status: valid" : "Status: issues found",
      className: result.ok ? "status-success" : "status-warning"
    },
    {
      label: `Errors: ${result.summary.errors}`,
      className: result.summary.errors > 0 ? "status-error" : "status-info"
    },
    {
      label: `Warnings: ${result.summary.warnings}`,
      className: "status-info"
    },
    {
      label: `Lines: ${result.summary.lineCount}`,
      className: "status-info"
    }
  ];

  pills.forEach((pill) => {
    const node = document.createElement("span");
    node.className = `pill ${pill.className}`;
    node.textContent = pill.label;
    ui.summary?.appendChild(node);
  });
}

async function copyResult() {
  if (!ui.output?.textContent) {
    return;
  }

  try {
    await navigator.clipboard.writeText(ui.output.textContent);
    updateCopyButtonLabel("Copied");
  } catch (_error) {
    updateCopyButtonLabel("Copy failed");
  }
}

function updateCopyButtonLabel(label: string) {
  if (!ui.copyButton) {
    return;
  }

  ui.copyButton.textContent = label;
  window.setTimeout(() => {
    if (ui.copyButton) {
      ui.copyButton.textContent = "Copy JSON";
    }
  }, 1200);
}

function readApiRequest(): ApiRequest {
  const params = new URLSearchParams(window.location.search);
  const requestedFormat = readFormat(params);
  const code64 = params.get("code64");
  const code = params.get("code");
  const hasCodeParam = code64 !== null || code !== null;
  const format = requestedFormat ?? (hasCodeParam ? "json" : null);

  if (code64) {
    const decoded = decodeBase64Utf8(code64);
    if (decoded === null) {
      return {
        code: VALIDATOR_SAMPLE,
        format,
        hasCodeParam: true,
        inputError: "invalid-code64"
      };
    }

    return {
      code: decoded,
      format,
      hasCodeParam: true,
      inputError: null
    };
  }

  if (code !== null) {
    return {
      code: normalizeApiCode(code),
      format,
      hasCodeParam: true,
      inputError: null
    };
  }

  return {
    code: VALIDATOR_SAMPLE,
    format,
    hasCodeParam: false,
    inputError: null
  };
}

function readFormat(params: URLSearchParams): ApiFormat | null {
  const format = (params.get("format") || "").trim().toLowerCase();

  if (format === "json" || format === "ts" || format === "ui" || format === "page") {
    if (format === "page") {
      return "ui";
    }
    return format;
  }

  const ts = (params.get("ts") || "").trim().toLowerCase();
  if (ts === "1" || ts === "true") {
    return "ts";
  }

  return null;
}

function renderMachineMode(request: ApiRequest) {
  if (request.format === "ts") {
    renderRawDocument(API_TYPE_DEFINITIONS, "text2scratch | API TypeScript");
    return;
  }

  if (request.inputError) {
    renderRawDocument(
      JSON.stringify(
        {
          ok: false,
          error: {
            code: request.inputError,
            message: "The `code64` query parameter is not valid base64-encoded UTF-8 text."
          }
        },
        null,
        2
      ),
      "text2scratch | API JSON"
    );
    return;
  }

  if (!request.hasCodeParam) {
    renderRawDocument(
      JSON.stringify(
        {
          ok: false,
          error: {
            code: "missing-code",
            message: "Pass `code` or `code64` in the query string to validate text2scratch code."
          },
          usage: {
            json: `${window.location.origin}${window.location.pathname}?code=YOUR_TEXT2SCRATCH_CODE`,
            jsonBase64: `${window.location.origin}${window.location.pathname}?code64=BASE64_ENCODED_TEXT2SCRATCH_CODE`,
            ts: `${window.location.origin}${window.location.pathname}?format=ts`,
            ui: `${window.location.origin}${window.location.pathname}?format=ui`
          }
        },
        null,
        2
      ),
      "text2scratch | API JSON"
    );
    return;
  }

  renderRawDocument(JSON.stringify(validateText2Scratch(request.code), null, 2), "text2scratch | API JSON");
}

function renderRawDocument(content: string, title: string) {
  document.title = title;

  const style = document.createElement("style");
  style.textContent = `
    :root {
      color-scheme: light dark;
    }

    body {
      margin: 0;
      min-height: 100vh;
      padding: 24px;
      background: #0f172a;
      color: #e2e8f0;
      font: 14px/1.6 "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media (max-width: 640px) {
      body {
        padding: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.className = "api-raw-page";
  document.body.replaceChildren();

  const pre = document.createElement("pre");
  pre.textContent = content;
  document.body.appendChild(pre);
}

function buildModeExamples() {
  const endpoint = `${window.location.origin}${window.location.pathname}`;

  return [
    `JSON output (default when code is present): ${endpoint}?code=YOUR_TEXT2SCRATCH_CODE`,
    `Escaped multiline code works too: ${endpoint}?code=stage_code%20%3D%5Cnwhen_flag_clicked%5Cn%20%20say(%22Hello%22)`,
    `Base64 JSON output: ${endpoint}?code64=BASE64_ENCODED_TEXT2SCRATCH_CODE`,
    `TypeScript types: ${endpoint}?format=ts`,
    `Force the browser UI: ${endpoint}?format=ui&code=YOUR_TEXT2SCRATCH_CODE`
  ].join("\n\n");
}

function normalizeApiCode(value: string) {
  const parsedJsonString = tryParseJsonString(value);
  if (parsedJsonString !== null) {
    return parsedJsonString;
  }

  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

function tryParseJsonString(value: string) {
  if (!(value.startsWith("\"") && value.endsWith("\""))) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function decodeBase64Utf8(value: string) {
  try {
    const normalized = normalizeBase64(value);
    const binary = window.atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_error) {
    return null;
  }
}

function normalizeBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;

  if (padding === 0) {
    return normalized;
  }

  return normalized.padEnd(normalized.length + (4 - padding), "=");
}
