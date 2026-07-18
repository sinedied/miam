import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { type Locale, translate } from "../lib/i18n";
import { formatIngredient } from "../lib/ingredients";
import { sharedStyles } from "../styles/component";
import type { Recipe } from "../types/recipe";
import { imagePlaceholder } from "./image-placeholder";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

@customElement("recipe-detail")
export class RecipeDetail extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .back {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
        color: var(--color-leaf);
        font-weight: 700;
        text-underline-offset: 0.2em;
      }

      .back::before {
        content: "←";
        font-size: 1.2em;
      }

      article {
        display: grid;
        gap: var(--space-5);
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.44fr);
        grid-template-areas: "hero side" "method side";
        gap: var(--space-5) clamp(1.25rem, 4vw, 3rem);
        align-items: start;
      }

      .hero {
        grid-area: hero;
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(18rem, 1.05fr);
        min-height: 14rem;
        overflow: hidden;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }

      .hero-image {
        position: relative;
        min-height: 0;
        overflow: hidden;
        border-right: 1px solid var(--color-line);
        background: var(--color-surface-strong);
      }

      .hero-image img {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-image .placeholder {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--color-accent);
        background: var(--color-accent-soft);
      }

      .hero-image .placeholder svg {
        width: 22%;
        max-width: 5rem;
        height: auto;
        opacity: 0.85;
      }

      .summary {
        display: grid;
        align-content: center;
        gap: var(--space-3);
        padding: clamp(1.25rem, 3vw, 2.25rem);
      }

      .identity {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .identity span {
        padding: 0.35rem 0.5rem;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-sm);
      }

      h1 {
        max-width: 14ch;
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(1.75rem, 4vw, 2.6rem);
        font-weight: 700;
        letter-spacing: -0.04em;
        line-height: 0.98;
      }

      .description {
        max-width: 38rem;
        margin: 0;
        color: var(--color-ink-muted);
        font-size: 0.95rem;
        line-height: 1.55;
      }

      dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: var(--space-3) 0 0;
        border-top: 1px solid var(--color-line);
        border-bottom: 1px solid var(--color-line);
      }

      dl > div {
        padding: var(--space-4) var(--space-3) var(--space-4) 0;
      }

      dt {
        color: var(--color-ink-muted);
        font-family: var(--font-label);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      dd {
        margin: 0.2rem 0 0;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .ingredients {
        grid-area: side;
        align-self: stretch;
      }

      .ingredients-panel {
        position: sticky;
        top: calc(var(--header-height) + var(--space-3));
        /* Use the full height between the header and the footer, scrolling long lists
           internally. The subtracted amount is the constant space below the layout
           (footer margin + footer height + page padding ≈ 95px) plus the header, so the
           pinned top clears the header even at the page bottom. */
        max-height: max(14rem, calc(100vh - 170px));
        overflow-y: auto;
        padding: var(--space-4);
        border: 1px solid var(--color-line);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }

      h2 {
        margin: 0 0 var(--space-3);
        font-family: var(--font-display);
        font-size: clamp(1.4rem, 3vw, 1.9rem);
        letter-spacing: -0.03em;
      }

      ul {
        display: grid;
        gap: 0;
        padding: 0;
        margin: 0;
        list-style: none;
      }

      li {
        padding: 0.55rem 0;
        border-top: 1px solid var(--color-line);
        line-height: 1.45;
      }

      .ingredients-panel > ul > li:first-child {
        border-top: 0;
        padding-top: 0;
      }

      .servings {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        margin: 0 0 var(--space-3);
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--color-line);
      }

      .servings-label {
        color: var(--color-ink-muted);
      }

      .stepper {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
      }

      .stepper button {
        display: grid;
        width: 1.9rem;
        height: 1.9rem;
        place-items: center;
        border: 1px solid var(--color-line);
        border-radius: 999px;
        color: var(--color-ink);
        background: var(--color-surface);
        font-size: 1.15rem;
        line-height: 1;
        cursor: pointer;
      }

      .stepper button:hover:not([aria-disabled="true"]) {
        border-color: var(--color-ink-muted);
        background: var(--color-surface-strong);
      }

      .stepper button[aria-disabled="true"] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .servings-value {
        min-width: 1.75rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        text-align: center;
      }

      .method {
        grid-area: method;
        min-width: 0;
        padding: var(--space-1) 0;
      }

      .markdown {
        color: var(--color-ink);
        font-family: var(--font-display);
        font-size: clamp(0.95rem, 1.4vw, 1.1rem);
        line-height: 1.65;
      }

      .markdown :is(h2, h3) {
        margin: 1.5em 0 0.4em;
        letter-spacing: -0.025em;
        line-height: 1.15;
      }

      .markdown > :first-child {
        margin-top: 0;
      }

      .markdown :is(ol, ul) {
        display: grid;
        gap: var(--space-3);
        padding-left: 1.4em;
        list-style: revert;
      }

      .markdown li {
        padding: 0;
        border: 0;
      }

      .markdown a {
        color: var(--color-accent-strong);
      }

      @media (max-width: 58rem) {
        .layout {
          grid-template-columns: 1fr;
          grid-template-areas: "hero" "side" "method";
          gap: var(--space-5);
        }

        .hero {
          grid-template-columns: 1fr;
        }

        .hero-image {
          aspect-ratio: 16 / 10;
          min-height: 0;
          border-right: 0;
          border-bottom: 1px solid var(--color-line);
        }

        .ingredients {
          align-self: start;
        }

        .ingredients-panel {
          position: static;
          max-height: none;
          overflow: visible;
        }
      }

      @media (max-width: 34rem) {
        .summary {
          padding: var(--space-5) var(--space-4);
        }

        dl {
          grid-template-columns: repeat(2, 1fr);
        }

        dl > div:nth-child(-n + 2) {
          border-bottom: 1px solid var(--color-line);
        }

        .ingredients {
          padding: var(--space-4);
        }
      }
    `,
  ];

  @property({ attribute: false })
  recipe!: Recipe;

  @property({ attribute: false })
  locale: Locale = "en";

  @state()
  private servings = 0;

  willUpdate(changed: PropertyValues<this>): void {
    // Reset the servings to the recipe's default whenever the recipe changes,
    // so opening a recipe always starts from its authored serving count.
    if (changed.has("recipe") && this.recipe) {
      this.servings = this.recipe.servings;
    }
  }

  private adjustServings(delta: number): void {
    this.servings = Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, this.servings + delta));
  }

  render() {
    const recipe = this.recipe;
    const factor = recipe.servings > 0 ? this.servings / recipe.servings : 1;

    return html`
      <a class="back" href="#/">${translate(this.locale, "backToRecipes")}</a>
      <article lang=${ifDefined(recipe.language)}>
        <div class="layout">
          <section class="hero">
            <div class="hero-image">
              ${
                recipe.image
                  ? html`<img src=${recipe.image} alt=${recipe.imageAlt ?? ""} />`
                  : imagePlaceholder()
              }
            </div>
            <div class="summary">
              <div class="identity">
                <span class="eyebrow">${recipe.cuisine}</span>
              </div>
              <h1>${recipe.title}</h1>
              <p class="description">${recipe.description}</p>
              <dl>
                <div>
                  <dt>${translate(this.locale, "prepTime")}</dt>
                  <dd>${recipe.prepTime} min</dd>
                </div>
                <div>
                  <dt>${translate(this.locale, "cookTime")}</dt>
                  <dd>${recipe.cookTime} min</dd>
                </div>
                <div>
                  <dt>${translate(this.locale, "totalTime")}</dt>
                  <dd>${recipe.prepTime + recipe.cookTime} min</dd>
                </div>
              </dl>
            </div>
          </section>

          <aside class="ingredients">
            <div
              class="ingredients-panel"
              role="region"
              tabindex="0"
              aria-labelledby="ingredients-heading"
            >
              <h2 id="ingredients-heading">${translate(this.locale, "ingredients")}</h2>
              <div class="servings">
                <span class="eyebrow servings-label">${translate(this.locale, "servings")}</span>
                <div class="stepper">
                  <button
                    type="button"
                    aria-label=${translate(this.locale, "decreaseServings")}
                    aria-disabled=${this.servings <= MIN_SERVINGS}
                    @click=${() => this.adjustServings(-1)}
                  >
                    −
                  </button>
                  <span class="servings-value" aria-live="polite">${this.servings}</span>
                  <button
                    type="button"
                    aria-label=${translate(this.locale, "increaseServings")}
                    aria-disabled=${this.servings >= MAX_SERVINGS}
                    @click=${() => this.adjustServings(1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <ul>
                ${recipe.ingredients.map(
                  (ingredient) => html`<li>${formatIngredient(ingredient, factor)}</li>`,
                )}
              </ul>
            </div>
          </aside>

          <div class="method">
            <h2>${translate(this.locale, "instructions")}</h2>
            <div class="markdown">${unsafeHTML(recipe.instructionsHtml)}</div>
          </div>
        </div>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-detail": RecipeDetail;
  }
}
