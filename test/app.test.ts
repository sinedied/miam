import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../src/app";
import { recipes } from "virtual:recipes";
import type { MiamApp } from "../src/app";

function setHash(hash: string): void {
  history.replaceState(null, "", hash || "#/");
  globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
}

async function renderApp(): Promise<MiamApp> {
  const app = document.createElement("miam-app") as MiamApp;
  document.body.append(app);
  await app.updateComplete;
  return app;
}

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "#/");
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("miam-app", () => {
  it("renders the recipe catalog and filters it from the header search field", async () => {
    const app = await renderApp();
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(recipes.length);

    const header = app.shadowRoot?.querySelector("app-header");
    const input = header?.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    input.value = "kinder";
    input.dispatchEvent(new InputEvent("input"));
    await app.updateComplete;
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(1);

    input.value = "ingredient-that-does-not-exist";
    input.dispatchEvent(new InputEvent("input"));
    await app.updateComplete;
    expect(app.shadowRoot?.querySelector(".empty")).not.toBeNull();
    expect(app.shadowRoot?.querySelector(".count")?.textContent).toContain("0 recipes");
  });

  it("reflects the search query in the URL and clears it", async () => {
    const app = await renderApp();
    const header = app.shadowRoot?.querySelector("app-header");
    const input = header?.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    if (!input) {
      throw new Error("missing search input");
    }

    input.value = "kinder";
    input.dispatchEvent(new InputEvent("input"));
    await app.updateComplete;
    expect(globalThis.location.hash).toBe("#/?q=kinder");

    header?.shadowRoot?.querySelector<HTMLButtonElement>(".clear")?.click();
    await app.updateComplete;
    expect(globalThis.location.hash).toBe("#/");
  });

  it("restores the search from a shared URL on load", async () => {
    history.replaceState(null, "", "#/?q=kinder");
    const app = await renderApp();

    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(1);
    const input = app.shadowRoot
      ?.querySelector("app-header")
      ?.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    expect(input?.value).toBe("kinder");
  });

  it("syncs the search when the hash changes (back/forward, shared link)", async () => {
    const app = await renderApp();
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(recipes.length);

    setHash("#/?q=kinder");
    await app.updateComplete;

    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(1);
    const input = app.shadowRoot
      ?.querySelector("app-header")
      ?.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    expect(input?.value).toBe("kinder");
  });

  it("restores the search after opening a recipe and navigating back", async () => {
    const app = await renderApp();
    setHash("#/?q=kinder");
    await app.updateComplete;
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(1);

    setHash(`#/recipes/${recipes[0].slug}`);
    await app.updateComplete;
    expect(app.shadowRoot?.querySelector("recipe-detail")).not.toBeNull();

    setHash("#/?q=kinder");
    await app.updateComplete;
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(1);
    const restored = app.shadowRoot
      ?.querySelector("app-header")
      ?.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    expect(restored?.value).toBe("kinder");
  });

  it("renders recipe details and manages focus after hash navigation", async () => {
    const app = await renderApp();
    const target = recipes[0];
    setHash(`#/recipes/${target.slug}`);
    await app.updateComplete;
    await Promise.resolve();

    expect(app.shadowRoot?.querySelector("recipe-detail")).not.toBeNull();
    expect(document.title).toContain(target.title);
    expect(app.shadowRoot?.activeElement).toBe(app.shadowRoot?.querySelector("main"));
  });

  it("renders an explicit not-found state for unknown recipe slugs", async () => {
    const app = await renderApp();
    setHash("#/recipes/not-in-the-pantry");
    await app.updateComplete;

    expect(app.shadowRoot?.querySelector(".not-found")).not.toBeNull();
    expect(app.shadowRoot?.textContent).toContain("Recipe not found");
  });

  it("gives the catalog a single top-level heading", async () => {
    const app = await renderApp();
    const headings = app.shadowRoot?.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings?.[0]?.textContent?.trim()).toBe("Recipes");
  });

  it("persists language changes and updates the document language", async () => {
    const app = await renderApp();
    const header = app.shadowRoot?.querySelector("app-header");
    header?.dispatchEvent(
      new CustomEvent("locale-change", {
        bubbles: true,
        composed: true,
        detail: "fr",
      }),
    );
    await app.updateComplete;

    expect(document.documentElement.lang).toBe("fr");
    expect(localStorage.getItem("miam:locale")).toBe("fr");
    expect(app.shadowRoot?.querySelector(".count")?.textContent).toContain("recettes");
  });

  it("lets keyboard users skip directly to the main content", async () => {
    const app = await renderApp();
    const skipLink = app.shadowRoot?.querySelector<HTMLAnchorElement>(".skip-link");
    skipLink?.click();
    expect(app.shadowRoot?.activeElement).toBe(app.shadowRoot?.querySelector("main"));
  });
});
