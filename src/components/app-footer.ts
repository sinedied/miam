import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { buildInfo } from "../lib/build-info";
import { type Locale, translate } from "../lib/i18n";
import { sharedStyles } from "../styles/component";

@customElement("app-footer")
export class AppFooter extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        margin-top: var(--space-3);
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        width: min(100% - 2rem, var(--content-width));
        min-height: 2rem;
        margin-inline: auto;
        padding-block: var(--space-2);
        color: var(--color-ink-muted);
        font-size: 0.72rem;
      }

      .sep {
        opacity: 0.6;
      }

      code {
        font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      }

      a {
        color: inherit;
        text-decoration: underline;
        text-decoration-color: var(--color-line);
        text-underline-offset: 0.2em;
      }

      a:hover {
        color: var(--color-ink);
        text-decoration-color: currentColor;
      }
    `,
  ];

  @property({ attribute: false })
  locale: Locale = "en";

  render() {
    return html`
      <footer>
        <code>${buildInfo.commit}</code>
        ${
          buildInfo.repositoryUrl
            ? html`
              <span class="sep" aria-hidden="true">·</span>
              <a href=${buildInfo.repositoryUrl} target="_blank" rel="noreferrer">
                ${translate(this.locale, "sourceCode")}
              </a>
            `
            : null
        }
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-footer": AppFooter;
  }
}
