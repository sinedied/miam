import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../src/app";
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
  it("renders the recipe catalog and filters it from the search field", async () => {
    const app = await renderApp();
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(4);

    const input = app.shadowRoot?.querySelector<HTMLInputElement>("#recipe-search");
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    input.value = "quiche";
    input.dispatchEvent(new InputEvent("input"));
    await app.updateComplete;
    expect(app.shadowRoot?.querySelectorAll("recipe-card")).toHaveLength(1);

    input.value = "ingredient-that-does-not-exist";
    input.dispatchEvent(new InputEvent("input"));
    await app.updateComplete;
    expect(app.shadowRoot?.querySelector(".empty")).not.toBeNull();
    expect(app.shadowRoot?.querySelector(".count")?.textContent).toContain("0 recipes");
  });

  it("renders recipe details and manages focus after hash navigation", async () => {
    const app = await renderApp();
    setHash("#/recipes/pancake-stack");
    await app.updateComplete;
    await Promise.resolve();

    expect(app.shadowRoot?.querySelector("recipe-detail")).not.toBeNull();
    expect(document.title).toContain("Fluffy Pancake Stack");
    expect(app.shadowRoot?.activeElement).toBe(app.shadowRoot?.querySelector("main"));
  });

  it("renders an explicit not-found state for unknown recipe slugs", async () => {
    const app = await renderApp();
    setHash("#/recipes/not-in-the-pantry");
    await app.updateComplete;

    expect(app.shadowRoot?.querySelector(".not-found")).not.toBeNull();
    expect(app.shadowRoot?.textContent).toContain("Recipe not found");
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
    expect(app.shadowRoot?.textContent).toContain("Des recettes à refaire encore.");
  });

  it("lets keyboard users skip directly to the main content", async () => {
    const app = await renderApp();
    const skipLink = app.shadowRoot?.querySelector<HTMLAnchorElement>(".skip-link");
    skipLink?.click();
    expect(app.shadowRoot?.activeElement).toBe(app.shadowRoot?.querySelector("main"));
  });
});
