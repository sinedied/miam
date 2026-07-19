import { describe, expect, it } from "vitest";
import { formatDuration } from "../src/lib/time";

describe("formatDuration", () => {
  it("shows durations under an hour in minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(59)).toBe("59 min");
    expect(formatDuration(1)).toBe("1 min");
  });

  it("shows whole hours without minutes", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(180)).toBe("3h");
  });

  it("shows hours with zero-padded minutes", () => {
    expect(formatDuration(65)).toBe("1h05");
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(125)).toBe("2h05");
    expect(formatDuration(150)).toBe("2h30");
  });

  it("guards against invalid or non-positive input", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(-10)).toBe("0 min");
    expect(formatDuration(Number.NaN)).toBe("0 min");
  });
});
