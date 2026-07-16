import { afterEach, describe, expect, it, vi } from "vitest";
import "../src/components/app-footer";
import "../src/components/app-header";
import "../src/components/recipe-card";
import "../src/components/recipe-detail";
import type { AppFooter } from "../src/components/app-footer";
import type { AppHeader } from "../src/components/app-header";
import type { RecipeCard } from "../src/components/recipe-card";
import type { RecipeDetail } from "../src/components/recipe-detail";
import { recipeFixture } from "./fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

describe("app-header", () => {
  it("selects language and theme from the settings menu without closing it", async () => {
    const header = document.createElement("app-header") as AppHeader;
    header.locale = "fr";
    header.theme = "system";
    document.body.append(header);
    await header.updateComplete;

    const button = header.shadowRoot?.querySelector<HTMLButtonElement>(".settings-button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-expanded")).toBe("false");
    expect(header.shadowRoot?.querySelector(".menu")).toBeNull();

    button?.click();
    await header.updateComplete;
    expect(button?.getAttribute("aria-expanded")).toBe("true");

    const items = [
      ...(header.shadowRoot?.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']") ?? []),
    ];
    // 2 languages + 3 theme options.
    expect(items).toHaveLength(5);

    const localeListener = vi.fn();
    const themeListener = vi.fn();
    header.addEventListener("locale-change", localeListener);
    header.addEventListener("theme-change", themeListener);

    const english = items.find((item) => item.textContent?.includes("English"));
    english?.click();
    expect(localeListener).toHaveBeenCalledOnce();
    expect(localeListener.mock.calls[0]?.[0]).toMatchObject({ detail: "en" });

    const dark = items.find((item) => item.textContent?.includes("Sombre"));
    dark?.click();
    expect(themeListener).toHaveBeenCalledOnce();
    expect(themeListener.mock.calls[0]?.[0]).toMatchObject({ detail: "dark" });

    // The settings menu stays open so multiple preferences can be changed.
    await header.updateComplete;
    expect(header.shadowRoot?.querySelector(".menu")).not.toBeNull();
    expect(button?.getAttribute("aria-expanded")).toBe("true");
  });

  it("marks the active theme option as checked", async () => {
    const header = document.createElement("app-header") as AppHeader;
    header.theme = "dark";
    document.body.append(header);
    await header.updateComplete;

    header.shadowRoot?.querySelector<HTMLButtonElement>(".settings-button")?.click();
    await header.updateComplete;

    const items = [
      ...(header.shadowRoot?.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']") ?? []),
    ];
    const checkedDark = items.find(
      (item) => item.getAttribute("aria-checked") === "true" && item.textContent?.includes("Dark"),
    );
    expect(checkedDark).toBeDefined();
  });

  it("closes the settings menu on Escape and returns focus to the button", async () => {
    const header = document.createElement("app-header") as AppHeader;
    document.body.append(header);
    await header.updateComplete;

    const button = header.shadowRoot?.querySelector<HTMLButtonElement>(".settings-button");
    button?.click();
    await header.updateComplete;
    expect(header.shadowRoot?.querySelector(".menu")).not.toBeNull();

    header.shadowRoot
      ?.querySelector(".settings")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await header.updateComplete;
    await Promise.resolve();
    expect(header.shadowRoot?.querySelector(".menu")).toBeNull();
    expect(button?.getAttribute("aria-expanded")).toBe("false");
    expect(header.shadowRoot?.activeElement).toBe(button);
  });

  it("closes the settings menu on an outside pointer press", async () => {
    const header = document.createElement("app-header") as AppHeader;
    document.body.append(header);
    await header.updateComplete;

    header.shadowRoot?.querySelector<HTMLButtonElement>(".settings-button")?.click();
    await header.updateComplete;
    expect(header.shadowRoot?.querySelector(".menu")).not.toBeNull();

    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, composed: true }));
    await header.updateComplete;
    expect(header.shadowRoot?.querySelector(".menu")).toBeNull();
  });

  it("hides search unless showSearch is enabled", async () => {
    const header = document.createElement("app-header") as AppHeader;
    document.body.append(header);
    await header.updateComplete;
    expect(header.shadowRoot?.querySelector("#recipe-search")).toBeNull();
  });

  it("emits search-change and clear-search events", async () => {
    const header = document.createElement("app-header") as AppHeader;
    header.locale = "en";
    header.showSearch = true;
    header.query = "soup";
    document.body.append(header);
    await header.updateComplete;

    const searchListener = vi.fn();
    const clearListener = vi.fn();
    header.addEventListener("search-change", searchListener);
    header.addEventListener("clear-search", clearListener);

    const input = header.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }
    input.value = "tart";
    input.dispatchEvent(new InputEvent("input"));
    expect(searchListener).toHaveBeenCalledOnce();
    expect(searchListener.mock.calls[0]?.[0]).toMatchObject({ detail: "tart" });

    const clear = header.shadowRoot?.querySelector<HTMLButtonElement>(".clear");
    expect(clear).not.toBeNull();
    clear?.click();
    expect(clearListener).toHaveBeenCalledOnce();
    await header.updateComplete;
    await Promise.resolve();
    expect(header.shadowRoot?.activeElement).toBe(input);
  });
});

describe("recipe-card", () => {
  it("renders recipe metadata and an encoded detail link", async () => {
    const card = document.createElement("recipe-card") as RecipeCard;
    card.recipe = recipeFixture;
    card.locale = "en";
    document.body.append(card);
    await card.updateComplete;

    expect(card.shadowRoot?.textContent).toContain("Tomato Tart");
    expect(card.shadowRoot?.textContent).toContain("55 min");
    expect(card.shadowRoot?.textContent).toContain("4");
    expect(card.shadowRoot?.querySelector("a")?.getAttribute("href")).toBe("#/recipes/tomato-tart");
    expect(card.shadowRoot?.querySelector("img")?.getAttribute("alt")).toBe(recipeFixture.imageAlt);
    expect(card.shadowRoot?.querySelector("article")?.getAttribute("lang")).toBe("en");
    expect(card.shadowRoot?.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("renders a placeholder when the recipe has no image", async () => {
    const card = document.createElement("recipe-card") as RecipeCard;
    card.recipe = { ...recipeFixture, image: undefined, imageAlt: undefined };
    card.locale = "en";
    document.body.append(card);
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector("img")).toBeNull();
    expect(card.shadowRoot?.querySelector(".placeholder")).not.toBeNull();
    expect(card.shadowRoot?.textContent).toContain("Tomato Tart");
  });
});

describe("recipe-detail", () => {
  it("renders ingredients, metadata, and trusted generated instructions", async () => {
    const detail = document.createElement("recipe-detail") as RecipeDetail;
    detail.recipe = recipeFixture;
    detail.locale = "en";
    document.body.append(detail);
    await detail.updateComplete;

    expect(detail.shadowRoot?.textContent).toContain("4 tomatoes");
    expect(detail.shadowRoot?.textContent).toContain("55 min");
    expect(detail.shadowRoot?.querySelectorAll(".markdown li")).toHaveLength(2);
    expect(detail.shadowRoot?.querySelector("img")?.getAttribute("alt")).toBe(
      recipeFixture.imageAlt,
    );
    expect(detail.shadowRoot?.querySelector("article")?.getAttribute("lang")).toBe("en");
  });
});

describe("app-footer", () => {
  it("renders deployed revision metadata and the repository link", async () => {
    const footer = document.createElement("app-footer") as AppFooter;
    footer.locale = "en";
    document.body.append(footer);
    await footer.updateComplete;

    expect(footer.shadowRoot?.textContent).toContain("test123");
    expect(footer.shadowRoot?.textContent).toContain("deployed");
    expect(footer.shadowRoot?.querySelector("a")?.getAttribute("href")).toBe(
      "https://github.com/example/miam",
    );
    expect(footer.shadowRoot?.querySelector("a")?.getAttribute("target")).toBe("_blank");
  });
});
