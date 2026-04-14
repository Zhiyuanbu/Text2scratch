import { describe, expect, it } from "vitest";
import { createErrorReport, formatErrorDescription } from "./errorReports";

describe("errorReports", () => {
  it("extracts a clean summary from Error objects", () => {
    const report = createErrorReport(new Error("Error: Request timed out (10s)."));
    expect(report.summary).toBe("Request timed out (10s).");
    expect(report.suggestions[0]).toMatch(/retry once/i);
  });

  it("adds Supabase-specific setup guidance", () => {
    const report = createErrorReport("Supabase environment variables are missing.");
    expect(report.suggestions.some((entry) => entry.includes("VITE_SUPABASE_URL"))).toBe(true);
  });

  it("formats a short description with the primary hint", () => {
    const description = formatErrorDescription("RLS policy blocked this request.");
    expect(description).toMatch(/RLS policy blocked this request/i);
    expect(description).toMatch(/explicit policies|server-side RPC/i);
  });
});
