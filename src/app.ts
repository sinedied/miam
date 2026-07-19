import { recipes } from "virtual:recipes";
import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/app-footer";
import "./components/app-header";
import "./components/recipe-card";
import "./components/recipe-detail";
import { type Locale, loadLocale, saveLocale, translate } from "./lib/i18n";
import { catalogHref, parseRoute, parseSearchQuery, type Route } from "./lib/router";
import { searchRecipes } from "./lib/search";
import {
  type Appearance,
  applyTheme,
  loadAppearance,
  loadPalette,
  type Palette,
  resolveMode,
  saveAppearance,
  savePalette,
  themeColors,
} from "./lib/theme";
import { sharedStyles } from "./styles/component";

@customElement("miam-app")
export class MiamApp extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: grid;
        min-height: 100vh;
        grid-template-rows: auto 1fr auto;
      }

      .skip-link {
        position: fixed;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 100;
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--color-ink);
        border-radius: var(--radius-sm);
        color: var(--color-ink);
        background: var(--color-surface);
        font-weight: 700;
        translate: 0 -200%;
        transition: translate 120ms ease;
      }

      .skip-link:focus {
        translate: 0;
      }

      app-header {
        position: sticky;
        top: 0;
        z-index: 20;
      }

      main {
        width: min(100% - 2rem, var(--content-width));
        margin-inline: auto;
        padding-block: var(--space-3) var(--space-5);
        scroll-margin-top: var(--header-height);
      }

      .count {
        margin: 0 0 var(--space-3);
        color: var(--color-ink-muted);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
        gap: var(--space-3);
      }

      recipe-card {
        animation: enter 420ms both;
        animation-delay: calc(var(--index, 0) * 45ms);
      }

      .empty,
      .not-found {
        display: grid;
        min-height: 16rem;
        place-content: center;
        padding: var(--space-6);
        border: 1px dashed var(--color-line);
        border-radius: var(--radius-md);
        text-align: center;
        background: color-mix(in srgb, var(--color-surface) 65%, transparent);
      }

      .empty h2,
      .not-found h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(1.6rem, 4vw, 2.4rem);
        letter-spacing: -0.03em;
      }

      .empty p,
      .not-found p {
        max-width: 32rem;
        margin: var(--space-3) auto 0;
        color: var(--color-ink-muted);
        line-height: 1.6;
      }

      .not-found a {
        margin-top: var(--space-5);
        color: var(--color-leaf);
        font-weight: 700;
      }

      @keyframes enter {
        from {
          opacity: 0;
          translate: 0 0.75rem;
        }
      }

      @media (max-width: 40rem) {
        main {
          width: min(100% - 1.5rem, var(--content-width));
        }

        .grid {
          grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
          gap: var(--space-3);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .skip-link {
          transition: none;
        }

        recipe-card {
          animation: none;
        }
      }
    `,
  ];

  @state()
  private locale: Locale = loadLocale();

  @state()
  private appearance: Appearance = loadAppearance();

  @state()
  private palette: Palette = loadPalette();

  private readonly darkModeQuery = globalThis.matchMedia?.("(prefers-color-scheme: dark)");

  private readonly onSystemModeChange = (): void => {
    if (this.appearance === "system") {
      this.applyThemePreference();
    }
  };

  @state()
  private route: Route = parseRoute(globalThis.location?.hash ?? "");

  @state()
  private query = parseSearchQuery(globalThis.location?.hash ?? "");

  private readonly onHashChange = (): void => {
    this.route = parseRoute(globalThis.location.hash);
    this.query = parseSearchQuery(globalThis.location.hash);
    this.updateDocumentTitle();
    globalThis.scrollTo?.({ top: 0, behavior: "instant" });
    void this.updateComplete.then(() => {
      // Move focus to the new content for a11y, but keep the page at the top:
      // a scrolling focus would slide the hero/ingredients under the sticky header.
      this.renderRoot.querySelector<HTMLElement>("main")?.focus({ preventScroll: true });
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    globalThis.addEventListener("hashchange", this.onHashChange);
    this.darkModeQuery?.addEventListener("change", this.onSystemModeChange);
    this.applyLocale();
    this.applyThemePreference();
    this.updateDocumentTitle();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener("hashchange", this.onHashChange);
    this.darkModeQuery?.removeEventListener("change", this.onSystemModeChange);
    super.disconnectedCallback();
  }

  private applyLocale(): void {
    document.documentElement.lang = this.locale;
  }

  private updateDocumentTitle(): void {
    const route = this.route;
    const recipe =
      route.name === "recipe"
        ? recipes.find((candidate) => candidate.slug === route.slug)
        : undefined;
    document.title = recipe ? `${recipe.title} — Miam` : "Miam — Family recipes";
  }

  private changeLocale(event: CustomEvent<Locale>): void {
    this.locale = event.detail;
    saveLocale(this.locale);
    this.applyLocale();
  }

  private changeAppearance(event: CustomEvent<Appearance>): void {
    this.appearance = event.detail;
    saveAppearance(this.appearance);
    this.applyThemePreference();
  }

  private changePalette(event: CustomEvent<Palette>): void {
    this.palette = event.detail;
    savePalette(this.palette);
    this.applyThemePreference();
  }

  private applyThemePreference(): void {
    const mode = resolveMode(this.appearance);
    applyTheme(this.palette, mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", themeColors[this.palette][mode]);
  }

  private changeQuery(event: CustomEvent<string>): void {
    this.query = event.detail;
    this.syncQueryToUrl();
  }

  private clearQuery(): void {
    this.query = "";
    this.syncQueryToUrl();
  }

  /**
   * Reflects the current search query into the URL so a search can be shared or
   * restored. Uses `replaceState` (no `hashchange`) to avoid per-keystroke history
   * entries and the scroll/focus handling in `onHashChange`.
   */
  private syncQueryToUrl(): void {
    const target = catalogHref(this.query);
    if (globalThis.location.hash !== target) {
      globalThis.history.replaceState(null, "", target);
    }
  }

  private skipToContent(event: Event): void {
    event.preventDefault();
    this.renderRoot.querySelector<HTMLElement>("main")?.focus();
  }

  private renderCatalog() {
    const visibleRecipes = searchRecipes(recipes, this.query);
    const resultLabel = translate(
      this.locale,
      visibleRecipes.length === 0
        ? "resultCountZero"
        : visibleRecipes.length === 1
          ? "resultCountOne"
          : "resultCount",
      { count: visibleRecipes.length },
    );

    return html`
      <section aria-labelledby="catalog-heading">
        <h1 id="catalog-heading" class="visually-hidden">
          ${translate(this.locale, "recipesHeading")}
        </h1>
        <p class="eyebrow count" aria-live="polite">${resultLabel}</p>

        ${
          visibleRecipes.length
            ? html`
              <div class="grid">
                ${visibleRecipes.map(
                  (recipe, index) => html`
                    <recipe-card
                      style=${`--index: ${index}`}
                      .recipe=${recipe}
                      .locale=${this.locale}
                    ></recipe-card>
                  `,
                )}
              </div>
            `
            : html`
              <div class="empty">
                <h2>${translate(this.locale, "noResultsTitle")}</h2>
                <p>${translate(this.locale, "noResultsBody")}</p>
              </div>
            `
        }
      </section>
    `;
  }

  private renderRecipe(slug: string) {
    const recipe = recipes.find((candidate) => candidate.slug === slug);
    if (!recipe) {
      return html`
        <section class="not-found">
          <h1>${translate(this.locale, "notFoundTitle")}</h1>
          <p>${translate(this.locale, "notFoundBody")}</p>
          <a href="#/">${translate(this.locale, "backToRecipes")}</a>
        </section>
      `;
    }

    return html`<recipe-detail .recipe=${recipe} .locale=${this.locale}></recipe-detail>`;
  }

  render() {
    return html`
      <a class="skip-link" href="#main-content" @click=${this.skipToContent}>
        ${translate(this.locale, "skipToContent")}
      </a>
      <app-header
        .locale=${this.locale}
        .appearance=${this.appearance}
        .palette=${this.palette}
        .query=${this.query}
        .showSearch=${this.route.name === "catalog"}
        @locale-change=${this.changeLocale}
        @appearance-change=${this.changeAppearance}
        @palette-change=${this.changePalette}
        @search-change=${this.changeQuery}
        @clear-search=${this.clearQuery}
      ></app-header>
      <main id="main-content" tabindex="-1">
        ${this.route.name === "recipe" ? this.renderRecipe(this.route.slug) : this.renderCatalog()}
      </main>
      <app-footer .locale=${this.locale}></app-footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "miam-app": MiamApp;
  }
}
