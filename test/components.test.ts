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
  it("renders the selected language and emits locale changes", async () => {
    const header = document.createElement("app-header") as AppHeader;
    header.locale = "fr";
    document.body.append(header);
    await header.updateComplete;

    expect(header.shadowRoot?.textContent).toContain("Langue");
    const listener = vi.fn();
    header.addEventListener("locale-change", listener);
    const select = header.shadowRoot?.querySelector("select");
    expect(select).not.toBeNull();
    if (!select) {
      return;
    }
    select.value = "en";
    select.dispatchEvent(new Event("change"));
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ detail: "en" });
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
    expect(card.shadowRoot?.textContent).toContain("35 min");
    expect(card.shadowRoot?.querySelector("a")?.getAttribute("href")).toBe("#/recipes/tomato-tart");
    expect(card.shadowRoot?.querySelector("img")?.getAttribute("alt")).toBe(recipeFixture.imageAlt);
    expect(card.shadowRoot?.querySelector("article")?.getAttribute("lang")).toBe("en");
    expect(card.shadowRoot?.querySelector("img")?.getAttribute("loading")).toBe("lazy");
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
