import { css, html, LitElement, svg } from "lit";
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
        margin-top: var(--space-4);
        border-top: 1px solid var(--color-line);
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
        opacity: 0.7;
      }

      .sep {
        opacity: 0.85;
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

      .github {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
      }

      .github svg {
        width: 1em;
        height: 1em;
        fill: currentColor;
      }
    `,
  ];

  @property({ attribute: false })
  locale: Locale = "en";

  render() {
    const { commit, repositoryUrl } = buildInfo;
    return html`
      <footer>
        ${
          repositoryUrl
            ? html`<a
                href=${`${repositoryUrl}/commit/${commit}`}
                target="_blank"
                rel="noreferrer"
                aria-label=${translate(this.locale, "viewCommit", { sha: commit })}
                ><code>${commit}</code></a
              >`
            : html`<code>${commit}</code>`
        }
        ${
          repositoryUrl
            ? html`
              <span class="sep" aria-hidden="true">·</span>
              <a class="github" href=${repositoryUrl} target="_blank" rel="noreferrer">
                ${githubLogo()}${translate(this.locale, "sourceCode")}
              </a>
            `
            : null
        }
      </footer>
    `;
  }
}

function githubLogo() {
  return svg`<svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      fill-rule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
    ></path>
  </svg>`;
}

declare global {
  interface HTMLElementTagNameMap {
    "app-footer": AppFooter;
  }
}
