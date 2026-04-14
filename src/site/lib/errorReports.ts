export interface ErrorReport {
  summary: string;
  suggestions: string[];
  detail: string;
}

interface ErrorReportOptions {
  area?: string;
  fallback?: string;
}

export function getErrorMessage(error: unknown, fallback = "Unexpected application error.") {
  if (error instanceof Error) {
    return normalizeWhitespace(error.message || fallback);
  }

  if (typeof error === "string") {
    return normalizeWhitespace(error || fallback);
  }

  if (error && typeof error === "object" && "message" in error) {
    return normalizeWhitespace(String((error as { message?: unknown }).message || fallback));
  }

  return fallback;
}

export function createErrorReport(error: unknown, options: ErrorReportOptions = {}): ErrorReport {
  const area = normalizeWhitespace(options.area || "");
  const fallback = options.fallback || "Unexpected application error.";
  const rawMessage = getErrorMessage(error, fallback);
  const summary = normalizeMessage(rawMessage, fallback);
  const suggestions = buildSuggestions(summary, area);
  const detail = buildDetail(error, summary);

  return {
    summary,
    suggestions,
    detail
  };
}

export function formatErrorDescription(error: unknown, options: ErrorReportOptions = {}) {
  const report = createErrorReport(error, options);
  return [report.summary, report.suggestions[0]].filter(Boolean).join(" ");
}

function normalizeMessage(message: string, fallback: string) {
  const cleaned = normalizeWhitespace(message)
    .replace(/^error:\s*/i, "")
    .replace(/^uncaught\s+/i, "")
    .trim();

  return cleaned || fallback;
}

function buildSuggestions(summary: string, area: string) {
  const lowered = `${area} ${summary}`.toLowerCase();
  const suggestions: string[] = [];

  if (/request timed out|aborterror|timed out/.test(lowered)) {
    suggestions.push("The request stalled. Retry once and check the Supabase project or network connection.");
  }

  if (/failed to fetch|networkerror|network request failed|load failed|err_network/.test(lowered)) {
    suggestions.push("A network request failed. Check connectivity, ad blockers, or CSP rules that might block the request.");
  }

  if (/supabase environment variables are missing|missing required environment variable: vite_supabase_|supabase url is missing|supabase publishable key is missing/.test(lowered)) {
    suggestions.push("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the client environment before loading this page.");
  }

  if (/tables are missing|table "projects" is missing|relation .* does not exist|rpc functions are missing|does not exist/.test(lowered)) {
    suggestions.push("The Supabase schema is incomplete. Re-run the project SQL schema and install any required RPC functions.");
  }

  if (/row-level security|permission denied|rls blocked|rls policy/.test(lowered)) {
    suggestions.push("Supabase RLS blocked the browser request. Public reads and admin actions need explicit policies or a server-side RPC.");
  }

  if (/turnstile|captcha|hcaptcha/.test(lowered)) {
    suggestions.push("Reset the captcha widget and verify the site key and allowed domain configuration.");
  }

  if (/monaco|loader.min.js|jszip|scaffolding-min.js|workspace runtime|script/i.test(lowered)) {
    suggestions.push("A required workspace script failed to load. Check CDN access, browser extensions, or offline mode.");
  }

  if (/sign.?out|session/.test(lowered)) {
    suggestions.push("If the session looks stale, refresh once. The app now falls back to a local sign-out when the global revoke fails.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Retry the action once. If it still fails, open the browser console and capture the exact message shown here.");
  }

  return suggestions.slice(0, 3);
}

function buildDetail(error: unknown, summary: string) {
  if (!(error instanceof Error)) {
    return summary;
  }

  const detailParts = [error.name && error.name !== "Error" ? error.name : "", summary].filter(Boolean);
  return detailParts.join(": ");
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
