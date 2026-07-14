import { describe, expect, it, vi } from "vitest";
import { detectLocale, loadLocale, saveLocale, translate } from "../src/lib/i18n";

describe("i18n", () => {
  it("detects supported base languages from browser preferences", () => {
    expect(detectLocale(["de-DE", "fr-CA", "en-US"])).toBe("fr");
    expect(detectLocale(["EN-gb"])).toBe("en");
  });

  it("falls back to English for unsupported or empty preferences", () => {
    expect(detectLocale(["de", "es"])).toBe("en");
    expect(detectLocale([])).toBe("en");
  });

  it("prefers a valid saved locale and ignores corrupted values", () => {
    expect(loadLocale({ getItem: () => "fr" }, ["en-US"])).toBe("fr");
    expect(loadLocale({ getItem: () => "not-a-locale" }, ["fr-FR"])).toBe("fr");
  });

  it("continues when storage access is denied", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const denied = {
      getItem: () => {
        throw new DOMException("Denied");
      },
    };
    expect(loadLocale(denied, ["fr"])).toBe("fr");
    expect(warning).toHaveBeenCalledOnce();
  });

  it("persists locale changes when storage is available", () => {
    const setItem = vi.fn();
    saveLocale("fr", { setItem });
    expect(setItem).toHaveBeenCalledWith("miam:locale", "fr");
  });

  it("reports persistence failures without changing the active locale", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    saveLocale("fr", {
      setItem: () => {
        throw new DOMException("Denied");
      },
    });
    expect(warning).toHaveBeenCalledOnce();
  });

  it("interpolates translated values", () => {
    expect(translate("en", "resultCount", { count: 4 })).toBe("4 recipes");
    expect(translate("fr", "openRecipe", { title: "Tarte" })).toBe("Ouvrir Tarte");
  });
});
