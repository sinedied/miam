import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { assetUrl } from "../lib/assets";
import { type Locale, translate } from "../lib/i18n";
import { sharedStyles } from "../styles/component";
import type { Recipe } from "../types/recipe";

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

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(18rem, 1.05fr);
        overflow: hidden;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }

      .hero-image {
        aspect-ratio: 16 / 9;
        min-height: 0;
        border-right: 1px solid var(--color-line);
        background: var(--color-surface-strong);
      }

      .hero-image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
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
        grid-template-columns: repeat(4, minmax(0, 1fr));
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

      .recipe-body {
        display: grid;
        grid-template-columns: minmax(14rem, 0.7fr) minmax(0, 1.3fr);
        gap: clamp(1.25rem, 4vw, 3rem);
        align-items: start;
      }

      .ingredients {
        position: sticky;
        top: var(--space-4);
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

      .method {
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
        .hero {
          grid-template-columns: 1fr;
        }

        .hero-image {
          aspect-ratio: 16 / 10;
          min-height: 0;
          border-right: 0;
          border-bottom: 1px solid var(--color-line);
        }

        .recipe-body {
          grid-template-columns: 1fr;
          gap: var(--space-5);
        }

        .ingredients {
          position: static;
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

  render() {
    const recipe = this.recipe;
    const languageLabel = translate(this.locale, recipe.language === "fr" ? "french" : "english");

    return html`
      <a class="back" href="#/">${translate(this.locale, "backToRecipes")}</a>
      <article lang=${recipe.language}>
        <section class="hero">
          <div class="hero-image">
            <img src=${assetUrl(recipe.image)} alt=${recipe.imageAlt} />
          </div>
          <div class="summary">
            <div class="identity">
              <span class="eyebrow">${recipe.cuisine}</span>
              <span class="eyebrow">
                ${translate(this.locale, "recipeLanguage")}: ${languageLabel}
              </span>
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
              <div>
                <dt>${translate(this.locale, "servings")}</dt>
                <dd>${recipe.servings}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="recipe-body">
          <aside class="ingredients">
            <h2>${translate(this.locale, "ingredients")}</h2>
            <ul>
              ${recipe.ingredients.map((ingredient) => html`<li>${ingredient}</li>`)}
            </ul>
          </aside>
          <div class="method">
            <h2>${translate(this.locale, "instructions")}</h2>
            <div class="markdown">${unsafeHTML(recipe.instructionsHtml)}</div>
          </div>
        </section>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-detail": RecipeDetail;
  }
}
