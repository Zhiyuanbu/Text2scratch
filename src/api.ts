import { VALIDATOR_SAMPLE, validateText2Scratch } from "./lib/validator";

type InputSource = "input" | "input64" | "sample";

interface ApiRequest {
  input: string | null;
  inputError: string | null;
  pretty: boolean;
  requestError: {
    code: string;
    message: string;
  } | null;
  source: InputSource | null;
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
}

export interface ApiRequestError {
  code: string;
  message: string;
}

export interface ApiValidationMeta {
  endpoint: string;
  source: "input" | "input64" | "sample";
  inputLength: number;
  lineCount: number;
  pretty: boolean;
}

export interface ApiDocs {
  endpoint: string;
  description: string;
  quickStart: string[];
  notes: string[];
}

export interface ApiValidationEnvelope {
  ok: boolean;
  data?: ValidationResult;
  meta?: ApiValidationMeta;
  error?: ApiRequestError;
  docs?: ApiDocs;
}`;

init();

function init() {
  const request = readApiRequest();
  const response = buildResponse(request);
  renderJson(response, request.pretty);
}

function readApiRequest(): ApiRequest {
  const params = new URLSearchParams(window.location.search);
  const pretty = readBoolean(params.get("pretty"), true);
  const format = String(params.get("format") || "").trim().toLowerCase();

  if (format && format !== "json") {
    return {
      input: null,
      inputError: null,
      pretty,
      requestError: {
        code: "unsupported_format",
        message: "The `/api/` route is JSON-only. UI and alternate format modes are not supported."
      },
      source: null
    };
  }

  if (params.has("ts")) {
    return {
      input: null,
      inputError: null,
      pretty,
      requestError: {
        code: "unsupported_mode",
        message: "The `/api/` route no longer supports TypeScript-only output. Read the TypeScript contract from the JSON docs object instead."
      },
      source: null
    };
  }

  if (params.has("code") || params.has("code64")) {
    return {
      input: null,
      inputError: null,
      pretty,
      requestError: {
        code: "unsupported_parameter",
        message: "Use `input` or `input64`. Legacy `code` parameters are no longer supported on `/api/`."
      },
      source: null
    };
  }

  if (readBoolean(params.get("sample"), false)) {
    return {
      input: VALIDATOR_SAMPLE,
      inputError: null,
      pretty,
      requestError: null,
      source: "sample"
    };
  }

  const input64 = params.get("input64");
  if (input64 !== null) {
    const decoded = decodeBase64Utf8(input64);
    return {
      input: decoded,
      inputError: decoded === null ? "invalid_input64" : null,
      pretty,
      requestError: null,
      source: "input64"
    };
  }

  const input = params.get("input");
  if (input !== null) {
    return {
      input: normalizeApiInput(input),
      inputError: null,
      pretty,
      requestError: null,
      source: "input"
    };
  }

  return {
    input: null,
    inputError: null,
    pretty,
    requestError: null,
    source: null
  };
}

function buildResponse(request: ApiRequest) {
  if (request.requestError) {
    return {
      ok: false,
      error: request.requestError,
      docs: buildDocs()
    };
  }

  if (request.inputError) {
    return {
      ok: false,
      error: {
        code: request.inputError,
        message: "The `input64` parameter must be valid base64-encoded UTF-8 text."
      },
      docs: buildDocs()
    };
  }

  if (request.input === null) {
    return {
      ok: true,
      docs: buildDocs()
    };
  }

  const result = validateText2Scratch(request.input);

  return {
    ok: result.ok,
    data: result,
    meta: {
      endpoint: `${window.location.origin}${window.location.pathname}`,
      source: request.source,
      inputLength: request.input.length,
      lineCount: normalizeLineCount(request.input),
      pretty: request.pretty
    }
  };
}

function buildDocs() {
  const endpoint = `${window.location.origin}${window.location.pathname}`;

  return {
    endpoint,
    description: "Static text2scratch validator route for GitHub Pages.",
    quickStart: [
      "Open `/api/` with no parameters to read the docs object.",
      "Use `input` for URL-encoded source text or `input64` for base64-encoded UTF-8 text.",
      "Set `pretty=0` when you want compact JSON output.",
      "Use `sample=1` to validate the built-in example script."
    ],
    notes: [
      "This route always emits JSON text in the document body.",
      "Use `input` for URL-encoded source text.",
      "Use `input64` for multiline or large payloads.",
      "Legacy `code` and `code64` parameters are rejected.",
      "UI and alternate output modes are not supported on this route."
    ],
    parameters: {
      input: {
        type: "string",
        description: "URL-encoded text2scratch source. Escaped newline sequences like \\\\n are accepted."
      },
      input64: {
        type: "string",
        description: "Base64-encoded UTF-8 text2scratch source. Preferred for multiline payloads."
      },
      pretty: {
        type: "boolean",
        default: true,
        description: "Pretty-print the JSON response. Use `pretty=0` for compact output."
      },
      sample: {
        type: "boolean",
        default: false,
        description: "Validate the built-in sample script."
      }
    },
    responses: {
      docs: {
        description: "Returned when no validation input is provided.",
        shape: {
          ok: true,
          docs: "ApiDocs"
        }
      },
      validation: {
        description: "Returned when `input`, `input64`, or `sample=1` is provided.",
        shape: {
          ok: "boolean",
          data: "ValidationResult",
          meta: {
            endpoint: "string",
            source: "input | input64 | sample",
            inputLength: "number",
            lineCount: "number",
            pretty: "boolean"
          }
        }
      },
      error: {
        description: "Returned for unsupported query parameters or malformed `input64`.",
        shape: {
          ok: false,
          error: {
            code: "string",
            message: "string"
          },
          docs: "ApiDocs"
        }
      }
    },
    errors: {
      invalid_input64: "The `input64` value could not be decoded as base64-encoded UTF-8 text.",
      unsupported_format: "Only JSON output is supported on `/api/`.",
      unsupported_mode: "TypeScript-only output mode was removed; read the TypeScript contract from `docs.contracts.typescript`.",
      unsupported_parameter: "Legacy `code` and `code64` parameters are rejected. Use `input` or `input64`."
    },
    examples: {
      docs: {
        description: "Read the docs object only.",
        url: endpoint
      },
      validate: {
        description: "Validate source passed directly in the query string.",
        url: `${endpoint}?input=YOUR_TEXT2SCRATCH_CODE`
      },
      validateMultiline: {
        description: "Validate a multiline snippet using escaped newlines.",
        url: `${endpoint}?input=stage_code%20%3D%5Cnwhen_flag_clicked%5Cn%20%20say(%22Hello%22)`
      },
      validateBase64: {
        description: "Validate base64-encoded UTF-8 source text.",
        url: `${endpoint}?input64=BASE64_ENCODED_TEXT2SCRATCH_CODE`
      },
      compact: {
        description: "Return compact JSON instead of pretty-printed JSON.",
        url: `${endpoint}?input=YOUR_TEXT2SCRATCH_CODE&pretty=0`
      },
      sample: {
        description: "Validate the built-in sample script.",
        url: `${endpoint}?sample=1`
      }
    },
    contracts: {
      typescript: API_TYPE_DEFINITIONS
    }
  };
}

function renderJson(data: unknown, pretty: boolean) {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  document.title = "text2scratch | API";
  document.body.replaceChildren();
  document.body.textContent = content;
  document.body.style.margin = "0";
  document.body.style.padding = "16px";
  document.body.style.whiteSpace = "pre-wrap";
  document.body.style.wordBreak = "break-word";
  document.body.style.fontFamily = 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace';
  document.body.style.fontSize = "14px";
  document.body.style.lineHeight = "1.5";
  document.body.style.background = "#f7f9fc";
  document.body.style.color = "#13203a";
}

function readBoolean(value: string | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }

  return fallback;
}

function normalizeApiInput(value: string) {
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

function normalizeLineCount(input: string) {
  if (!input) {
    return 0;
  }

  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").length;
}
