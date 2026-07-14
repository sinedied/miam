import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { assetUrl } from "../lib/assets";
import { type Locale, translate } from "../lib/i18n";
import { recipeHref } from "../lib/router";
import { sharedStyles } from "../styles/component";
import type { Recipe } from "../types/recipe";

@customElement("recipe-card")
export class RecipeCard extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      article {
        position: relative;
        height: 100%;
        overflow: hidden;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        box-shadow: var(--shadow-card);
        transition:
          translate 180ms ease,
          box-shadow 180ms ease;
      }

      article:hover {
        translate: 0 -0.25rem;
        box-shadow: 0 1px 0 rgb(29 41 34 / 10%), 0 22px 45px rgb(29 41 34 / 12%);
      }

      a {
        display: grid;
        height: 100%;
        color: inherit;
        text-decoration: none;
      }

      .image-wrap {
        position: relative;
        overflow: hidden;
        aspect-ratio: 4 / 3;
        border-bottom: 1px solid var(--color-line);
        background: var(--color-surface-strong);
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: scale 450ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }

      article:hover img {
        scale: 1.035;
      }

      .language {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        padding: 0.35rem 0.5rem;
        border: 1px solid rgb(255 255 255 / 55%);
        border-radius: var(--radius-sm);
        color: var(--color-surface);
        background: rgb(29 41 34 / 78%);
        backdrop-filter: blur(8px);
      }

      .body {
        display: grid;
        align-content: start;
        gap: var(--space-3);
        padding: var(--space-5);
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .tag {
        color: var(--color-accent-strong);
      }

      .tag:not(:last-child)::after {
        content: " ·";
      }

      h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(1.55rem, 3vw, 2rem);
        letter-spacing: -0.03em;
        line-height: 1.05;
      }

      .description {
        margin: 0;
        color: var(--color-ink-muted);
        font-size: 0.94rem;
        line-height: 1.55;
      }

      dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: var(--space-2) 0 0;
        border-top: 1px solid var(--color-line);
      }

      dl > div {
        padding-top: var(--space-3);
      }

      dt {
        color: var(--color-ink-muted);
        font-family: var(--font-label);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      dd {
        margin: 0.15rem 0 0;
        font-variant-numeric: tabular-nums;
        font-weight: 650;
      }

      @media (max-width: 42rem) {
        .body {
          padding: var(--space-4);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        article,
        img {
          transition: none;
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
      <article lang=${recipe.language}>
        <a href=${recipeHref(recipe.slug)} aria-label=${translate(this.locale, "openRecipe", {
          title: recipe.title,
        })}>
          <div class="image-wrap">
            <img src=${assetUrl(recipe.image)} alt=${recipe.imageAlt} loading="lazy" />
            <span class="eyebrow language">${languageLabel}</span>
          </div>
          <div class="body">
            <p class="eyebrow tags">
              ${recipe.tags.slice(0, 3).map((tag) => html`<span class="tag">${tag}</span>`)}
            </p>
            <h2>${recipe.title}</h2>
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
                <dt>${translate(this.locale, "servings")}</dt>
                <dd>${recipe.servings}</dd>
              </div>
            </dl>
          </div>
        </a>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-card": RecipeCard;
  }
}
