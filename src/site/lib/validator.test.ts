import { describe, expect, it } from "vitest";
import { VALIDATOR_SAMPLE, validateText2Scratch } from "./validator";

describe("validateText2Scratch", () => {
  it("accepts the bundled sample script", () => {
    const result = validateText2Scratch(VALIDATOR_SAMPLE);
    expect(result.ok).toBe(true);
    expect(result.summary.errors).toBe(0);
  });

  it("reports missing end blocks", () => {
    const result = validateText2Scratch("stage_code =\n  when_flag_clicked");
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "missing-end")).toBe(true);
  });

  it("rejects unknown top-level commands", () => {
    const result = validateText2Scratch("bogus_command");
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("unknown-top-level-line");
  });
});
