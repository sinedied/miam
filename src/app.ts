import { recipes } from "virtual:recipes";
import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/app-footer";
import "./components/app-header";
import "./components/recipe-card";
import "./components/recipe-detail";
import { type Locale, loadLocale, saveLocale, translate } from "./lib/i18n";
import { parseRoute, type Route } from "./lib/router";
import { searchRecipes } from "./lib/search";
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
        position: relative;
        z-index: 10;
      }

      main {
        width: min(100% - 2rem, var(--content-width));
        margin-inline: auto;
        padding-block: clamp(2.5rem, 7vw, 6.5rem) 0;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
        gap: clamp(2rem, 8vw, 8rem);
        align-items: end;
        padding-bottom: clamp(2.5rem, 6vw, 5rem);
      }

      h1 {
        max-width: 13ch;
        margin: var(--space-3) 0 0;
        font-family: var(--font-display);
        font-size: clamp(3rem, 8vw, 7.8rem);
        font-weight: 700;
        letter-spacing: -0.065em;
        line-height: 0.88;
      }

      .intro {
        max-width: 32rem;
        margin: 0;
        padding-left: var(--space-5);
        border-left: 0.3rem solid var(--color-accent);
        color: var(--color-ink-muted);
        font-family: var(--font-display);
        font-size: clamp(1.05rem, 2.2vw, 1.35rem);
        line-height: 1.6;
      }

      .tools {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--space-4);
        align-items: end;
        padding: var(--space-5);
        border: 1px solid var(--color-line);
        border-radius: var(--radius-md);
        background: var(--color-surface-strong);
      }

      .search {
        display: grid;
        gap: var(--space-2);
      }

      .input-wrap {
        display: grid;
        grid-template-columns: 1fr auto;
        overflow: hidden;
        border: 1px solid var(--color-ink);
        border-radius: var(--radius-sm);
        background: var(--color-surface);
      }

      input {
        min-width: 0;
        padding: 0.9rem 1rem;
        border: 0;
        color: var(--color-ink);
        background: transparent;
      }

      input:focus {
        outline: 0;
      }

      .input-wrap:focus-within {
        outline: 3px solid var(--color-focus);
        outline-offset: 3px;
      }

      .clear {
        min-width: 3rem;
        border: 0;
        color: var(--color-ink);
        background: transparent;
        cursor: pointer;
        font-size: 1.25rem;
      }

      .clear:hover {
        background: var(--color-canvas);
      }

      .count {
        min-width: 7rem;
        margin: 0 0 0.9rem;
        color: var(--color-ink-muted);
        text-align: right;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-5);
        padding-top: var(--space-6);
      }

      recipe-card {
        animation: enter 500ms both;
        animation-delay: calc(var(--index, 0) * 65ms);
      }

      .empty,
      .not-found {
        display: grid;
        min-height: 24rem;
        place-content: center;
        padding: var(--space-7);
        border: 1px dashed var(--color-line);
        border-radius: var(--radius-md);
        text-align: center;
        background: color-mix(in srgb, var(--color-surface) 65%, transparent);
      }

      .empty h2,
      .not-found h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(2rem, 5vw, 3.8rem);
        letter-spacing: -0.04em;
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
          translate: 0 1rem;
        }
      }

      @media (max-width: 62rem) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 48rem) {
        .hero {
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        .intro {
          max-width: 40rem;
        }
      }

      @media (max-width: 40rem) {
        main {
          width: min(100% - 1.25rem, var(--content-width));
        }

        .tools {
          grid-template-columns: 1fr;
          padding: var(--space-4);
        }

        .count {
          margin: 0;
          text-align: left;
        }

        .grid {
          grid-template-columns: 1fr;
          gap: var(--space-4);
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
  private route: Route = parseRoute(globalThis.location?.hash ?? "");

  @state()
  private query = "";

  private readonly onHashChange = (): void => {
    this.route = parseRoute(globalThis.location.hash);
    this.updateDocumentTitle();
    globalThis.scrollTo?.({ top: 0, behavior: "instant" });
    void this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLElement>("main")?.focus();
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    globalThis.addEventListener("hashchange", this.onHashChange);
    this.applyLocale();
    this.updateDocumentTitle();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener("hashchange", this.onHashChange);
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

  private changeQuery(event: Event): void {
    this.query = (event.currentTarget as HTMLInputElement).value;
  }

  private clearQuery(): void {
    this.query = "";
    void this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLInputElement>("#recipe-search")?.focus();
    });
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
      <section class="hero" aria-labelledby="catalog-title">
        <div>
          <p class="eyebrow">${translate(this.locale, "catalogEyebrow")}</p>
          <h1 id="catalog-title">${translate(this.locale, "catalogTitle")}</h1>
        </div>
        <p class="intro">${translate(this.locale, "catalogIntro")}</p>
      </section>

      <section aria-label=${translate(this.locale, "searchLabel")}>
        <div class="tools">
          <label class="search" for="recipe-search">
            <span class="eyebrow">${translate(this.locale, "searchLabel")}</span>
            <span class="input-wrap">
              <input
                id="recipe-search"
                type="search"
                autocomplete="off"
                .value=${this.query}
                placeholder=${translate(this.locale, "searchPlaceholder")}
                @input=${this.changeQuery}
              />
              ${
                this.query
                  ? html`
                    <button
                      class="clear"
                      type="button"
                      title=${translate(this.locale, "clearSearch")}
                      aria-label=${translate(this.locale, "clearSearch")}
                      @click=${this.clearQuery}
                    >
                      ×
                    </button>
                  `
                  : null
              }
            </span>
          </label>
          <p class="eyebrow count" aria-live="polite">${resultLabel}</p>
        </div>

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
      <app-header .locale=${this.locale} @locale-change=${this.changeLocale}></app-header>
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
