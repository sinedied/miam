import { describe, expect, it, vi } from "vitest";
import { applyTheme, loadTheme, resolveTheme, saveTheme } from "../src/lib/theme";

describe("theme", () => {
  it("loads a valid saved preference and falls back to system", () => {
    expect(loadTheme({ getItem: () => "dark" })).toBe("dark");
    expect(loadTheme({ getItem: () => "light" })).toBe("light");
    expect(loadTheme({ getItem: () => "not-a-theme" })).toBe("system");
    expect(loadTheme({ getItem: () => null })).toBe("system");
  });

  it("continues when storage access is denied", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const denied = {
      getItem: () => {
        throw new DOMException("Denied");
      },
    };
    expect(loadTheme(denied)).toBe("system");
    expect(warning).toHaveBeenCalledOnce();
  });

  it("persists the preference and reports failures", () => {
    const setItem = vi.fn();
    saveTheme("dark", { setItem });
    expect(setItem).toHaveBeenCalledWith("miam:theme", "dark");

    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    saveTheme("light", {
      setItem: () => {
        throw new DOMException("Denied");
      },
    });
    expect(warning).toHaveBeenCalledOnce();
  });

  it("applies forced themes and removes the override for system", () => {
    const root = document.createElement("html");
    applyTheme("dark", root);
    expect(root.dataset.theme).toBe("dark");
    applyTheme("light", root);
    expect(root.dataset.theme).toBe("light");
    applyTheme("system", root);
    expect(root.dataset.theme).toBeUndefined();
  });

  it("is a no-op when there is no root element", () => {
    expect(() => applyTheme("dark", undefined)).not.toThrow();
  });

  it("resolves system to the OS preference and forces otherwise", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
