import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type Locale, translate } from "../lib/i18n";
import { sharedStyles } from "../styles/component";

@customElement("app-header")
export class AppHeader extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        border-bottom: 1px solid var(--color-line);
        background: color-mix(in srgb, var(--color-canvas) 92%, transparent);
        backdrop-filter: blur(12px);
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: min(100% - 2rem, var(--content-width));
        min-height: 5rem;
        margin-inline: auto;
        gap: var(--space-4);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: var(--space-3);
        color: inherit;
        text-decoration: none;
      }

      .mark {
        display: grid;
        width: 2.5rem;
        height: 2.5rem;
        place-items: center;
        border-radius: var(--radius-sm);
        color: var(--color-surface);
        background: var(--color-leaf);
        font-family: var(--font-display);
        font-size: 1.45rem;
        line-height: 1;
      }

      .wordmark {
        display: grid;
        gap: 0.1rem;
      }

      .name {
        font-family: var(--font-display);
        font-size: clamp(1.45rem, 4vw, 1.8rem);
        font-weight: 700;
        letter-spacing: -0.035em;
        line-height: 1;
      }

      .tagline {
        color: var(--color-ink-muted);
        font-family: var(--font-label);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.09em;
        line-height: 1.2;
        text-transform: uppercase;
      }

      label {
        display: grid;
        gap: 0.2rem;
        color: var(--color-ink-muted);
        font-family: var(--font-label);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      select {
        min-width: 7.3rem;
        padding: 0.55rem 2rem 0.55rem 0.7rem;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-sm);
        color: var(--color-ink);
        background: var(--color-surface);
        cursor: pointer;
      }

      @media (max-width: 36rem) {
        header {
          min-height: 4.5rem;
        }

        .tagline,
        label > span {
          display: none;
        }

        select {
          min-width: 6.5rem;
        }
      }
    `,
  ];

  @property({ attribute: false })
  locale: Locale = "en";

  private changeLocale(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    this.dispatchEvent(
      new CustomEvent<Locale>("locale-change", {
        bubbles: true,
        composed: true,
        detail: select.value as Locale,
      }),
    );
  }

  render() {
    return html`
      <header>
        <a class="brand" href="#/" aria-label="Miam">
          <span class="mark" aria-hidden="true">M</span>
          <span class="wordmark">
            <span class="name">miam</span>
            <span class="tagline">${translate(this.locale, "brandTagline")}</span>
          </span>
        </a>

        <label>
          <span>${translate(this.locale, "languageLabel")}</span>
          <select .value=${this.locale} @change=${this.changeLocale}>
            <option value="en">${translate(this.locale, "english")}</option>
            <option value="fr">${translate(this.locale, "french")}</option>
          </select>
        </label>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-header": AppHeader;
  }
}
