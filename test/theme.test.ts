import { describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  loadAppearance,
  loadPalette,
  resolveMode,
  saveAppearance,
  savePalette,
} from "../src/lib/theme";

describe("theme — appearance", () => {
  it("loads a valid saved appearance and falls back to system", () => {
    expect(loadAppearance({ getItem: (key) => (key === "miam:appearance" ? "dark" : null) })).toBe(
      "dark",
    );
    expect(loadAppearance({ getItem: () => "not-an-appearance" })).toBe("system");
    expect(loadAppearance({ getItem: () => null })).toBe("system");
  });

  it("migrates a legacy miam:theme appearance value", () => {
    const storage = {
      getItem: (key: string) => (key === "miam:theme" ? "dark" : null),
    };
    expect(loadAppearance(storage)).toBe("dark");
  });

  it("continues when storage access is denied", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const denied = {
      getItem: () => {
        throw new DOMException("Denied");
      },
    };
    expect(loadAppearance(denied)).toBe("system");
    expect(warning).toHaveBeenCalledOnce();
  });

  it("persists the appearance and reports failures", () => {
    const setItem = vi.fn();
    saveAppearance("dark", { setItem });
    expect(setItem).toHaveBeenCalledWith("miam:appearance", "dark");

    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    saveAppearance("light", {
      setItem: () => {
        throw new DOMException("Denied");
      },
    });
    expect(warning).toHaveBeenCalledOnce();
  });
});

describe("theme — palette", () => {
  it("loads a valid saved palette and falls back to terracotta", () => {
    expect(loadPalette({ getItem: () => "ocean" })).toBe("ocean");
    expect(loadPalette({ getItem: () => "berry" })).toBe("berry");
    expect(loadPalette({ getItem: () => "not-a-palette" })).toBe("terracotta");
    expect(loadPalette({ getItem: () => null })).toBe("terracotta");
  });

  it("persists the palette", () => {
    const setItem = vi.fn();
    savePalette("ocean", { setItem });
    expect(setItem).toHaveBeenCalledWith("miam:palette", "ocean");
  });
});

describe("theme — apply & resolve", () => {
  it("applies the palette and mode to the root dataset", () => {
    const root = document.createElement("html");
    applyTheme("ocean", "dark", root);
    expect(root.dataset.theme).toBe("ocean");
    expect(root.dataset.mode).toBe("dark");
    applyTheme("terracotta", "light", root);
    expect(root.dataset.theme).toBe("terracotta");
    expect(root.dataset.mode).toBe("light");
  });

  it("is a no-op when there is no root element", () => {
    expect(() => applyTheme("terracotta", "dark", undefined)).not.toThrow();
  });

  it("resolves system to the OS preference and forces otherwise", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
  });
});
