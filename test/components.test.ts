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

  it("uses prep time as the total when the recipe has no cook time", async () => {
    const card = document.createElement("recipe-card") as RecipeCard;
    card.recipe = { ...recipeFixture, cookTime: undefined };
    card.locale = "en";
    document.body.append(card);
    await card.updateComplete;

    expect(card.shadowRoot?.textContent).toContain("20 min");
    expect(card.shadowRoot?.textContent).not.toContain("55 min");
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
    expect(detail.shadowRoot?.textContent).toContain("1 sheet puff pastry");
    expect(detail.shadowRoot?.textContent).toContain("55 min");
    expect(detail.shadowRoot?.querySelectorAll(".markdown li")).toHaveLength(2);
    expect(detail.shadowRoot?.querySelector("img")?.getAttribute("alt")).toBe(
      recipeFixture.imageAlt,
    );
    expect(detail.shadowRoot?.querySelector("article")?.getAttribute("lang")).toBe("en");
  });

  it("scales ingredient quantities with the servings stepper and clamps/resets", async () => {
    const detail = document.createElement("recipe-detail") as RecipeDetail;
    detail.recipe = recipeFixture;
    detail.locale = "en";
    document.body.append(detail);
    await detail.updateComplete;

    const value = () => detail.shadowRoot?.querySelector(".servings-value")?.textContent?.trim();
    const buttons = () => [
      ...(detail.shadowRoot?.querySelectorAll<HTMLButtonElement>(".stepper button") ?? []),
    ];
    const [minus, plus] = buttons();
    expect(value()).toBe("4");

    // Increase to 6 servings: 4 tomatoes -> 6, 1 sheet -> 1 1/2 sheet.
    plus?.click();
    plus?.click();
    await detail.updateComplete;
    expect(value()).toBe("6");
    expect(detail.shadowRoot?.textContent).toContain("6 tomatoes");
    expect(detail.shadowRoot?.textContent).toContain("1 1/2 sheet puff pastry");

    // Clamp at the minimum of 1.
    for (let i = 0; i < 10; i++) {
      minus?.click();
    }
    await detail.updateComplete;
    expect(value()).toBe("1");
    expect(
      detail.shadowRoot
        ?.querySelector<HTMLButtonElement>(".stepper button")
        ?.getAttribute("aria-disabled"),
    ).toBe("true");

    // Switching recipes resets to that recipe's default servings.
    detail.recipe = { ...recipeFixture, slug: "other", servings: 8 };
    await detail.updateComplete;
    expect(value()).toBe("8");
  });

  it("shows only prep time and hides cook/total when cookTime is absent", async () => {
    const detail = document.createElement("recipe-detail") as RecipeDetail;
    detail.recipe = { ...recipeFixture, cookTime: undefined };
    detail.locale = "en";
    document.body.append(detail);
    await detail.updateComplete;

    const dl = detail.shadowRoot?.querySelector("dl");
    expect(dl?.getAttribute("data-cols")).toBe("1");
    expect(dl?.querySelectorAll("div")).toHaveLength(1);
    expect(detail.shadowRoot?.textContent).toContain("Prep");
    expect(detail.shadowRoot?.textContent).not.toContain("Cook");
    expect(detail.shadowRoot?.textContent).not.toContain("Total");
  });

  it("uses a custom cookTimeLabel when provided", async () => {
    const detail = document.createElement("recipe-detail") as RecipeDetail;
    detail.recipe = { ...recipeFixture, cookTime: 90, cookTimeLabel: "Levage" };
    detail.locale = "en";
    document.body.append(detail);
    await detail.updateComplete;

    const dl = detail.shadowRoot?.querySelector("dl");
    expect(dl?.getAttribute("data-cols")).toBe("3");
    expect(detail.shadowRoot?.textContent).toContain("Levage");
    expect(detail.shadowRoot?.textContent).not.toContain("Cook");
    // 90 min cook renders as hours; total 20 + 90 = 110 -> "1h50".
    expect(detail.shadowRoot?.textContent).toContain("1h30");
    expect(detail.shadowRoot?.textContent).toContain("1h50");
  });
});

describe("app-footer", () => {
  it("links the commit to GitHub and renders a GitHub link with a logo", async () => {
    const footer = document.createElement("app-footer") as AppFooter;
    footer.locale = "en";
    document.body.append(footer);
    await footer.updateComplete;

    expect(footer.shadowRoot?.textContent).toContain("test123");
    expect(footer.shadowRoot?.textContent).not.toContain("deployed");

    const commitLink = footer.shadowRoot?.querySelector("a[aria-label]");
    expect(commitLink?.getAttribute("href")).toBe("https://github.com/example/miam/commit/test123");
    expect(commitLink?.getAttribute("target")).toBe("_blank");
    expect(commitLink?.getAttribute("aria-label")).toBe("View commit test123 on GitHub");
    expect(commitLink?.querySelector("code")?.textContent).toBe("test123");

    const githubLink = footer.shadowRoot?.querySelector("a.github");
    expect(githubLink?.getAttribute("href")).toBe("https://github.com/example/miam");
    expect(githubLink?.getAttribute("target")).toBe("_blank");
    expect(githubLink?.textContent).toContain("GitHub");
    expect(githubLink?.querySelector("svg")).toBeTruthy();
  });
});
