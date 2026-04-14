import { describe, expect, it } from "vitest";
import {
  getScratchSourceValidationMessage,
  sanitizeProjectNameInput,
  sanitizeScratchSourceInput
} from "./inputSafety";

describe("inputSafety", () => {
  it("sanitizes project names down to a single safe line", () => {
    expect(sanitizeProjectNameInput("  hello\nworld\t  ")).toBe("hello world");
  });

  it("removes unsupported control characters from workspace source", () => {
    expect(sanitizeScratchSourceInput("say \u0000\"Hello\"\r\nend")).toBe("say \"Hello\"\nend");
  });

  it("returns the first validator error in a user-friendly format", () => {
    expect(getScratchSourceValidationMessage("stage_code =\n  when_flag_clicked")).toContain("Line 2");
  });
});
