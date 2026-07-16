import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
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
        transition:
          translate 160ms ease,
          box-shadow 160ms ease,
          border-color 160ms ease;
      }

      article:hover {
        translate: 0 -0.2rem;
        border-color: var(--color-ink-muted);
        box-shadow: var(--shadow-card);
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
        aspect-ratio: 16 / 10;
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
        scale: 1.04;
      }

      .body {
        display: grid;
        align-content: start;
        gap: 0.4rem;
        padding: var(--space-3);
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        font-size: 0.62rem;
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
        font-size: clamp(1rem, 1.6vw, 1.15rem);
        letter-spacing: -0.02em;
        line-height: 1.15;
      }

      .description {
        display: -webkit-box;
        margin: 0;
        overflow: hidden;
        color: var(--color-ink-muted);
        font-size: 0.8rem;
        line-height: 1.45;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.1rem 0 0;
        padding: 0;
        list-style: none;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.12rem 0.45rem;
        border: 1px solid var(--color-line);
        border-radius: 999px;
        color: var(--color-ink-muted);
        font-size: 0.72rem;
        font-variant-numeric: tabular-nums;
      }

      .chip svg {
        width: 0.8rem;
        height: 0.8rem;
        color: var(--color-leaf);
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
    const totalTime = recipe.prepTime + recipe.cookTime;

    return html`
      <article lang=${ifDefined(recipe.language)}>
        <a href=${recipeHref(recipe.slug)} aria-label=${translate(this.locale, "openRecipe", {
          title: recipe.title,
        })}>
          <div class="image-wrap">
            <img src=${recipe.image} alt=${recipe.imageAlt} loading="lazy" />
          </div>
          <div class="body">
            <p class="eyebrow tags">
              ${recipe.tags.slice(0, 3).map((tag) => html`<span class="tag">${tag}</span>`)}
            </p>
            <h2>${recipe.title}</h2>
            <p class="description">${recipe.description}</p>
            <ul class="meta">
              <li class="chip">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                  <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2" />
                  <path
                    d="M12 9v4l2.5 2.5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span>${totalTime} min</span>
                <span class="visually-hidden">${translate(this.locale, "totalTime")}</span>
              </li>
              <li class="chip">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="2" />
                  <path
                    d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3 3 0 0 1 0 5.6M15.5 19a5.5 5.5 0 0 0-1.8-4.1"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span>${recipe.servings}</span>
                <span class="visually-hidden">${translate(this.locale, "servings")}</span>
              </li>
            </ul>
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
