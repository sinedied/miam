import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { buildInfo, formatDeploymentDate } from "../lib/build-info";
import { type Locale, translate } from "../lib/i18n";
import { sharedStyles } from "../styles/component";

@customElement("app-footer")
export class AppFooter extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        margin-top: var(--space-6);
        border-top: 1px solid var(--color-line);
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: min(100% - 2rem, var(--content-width));
        min-height: 4rem;
        margin-inline: auto;
        gap: var(--space-4);
        color: var(--color-ink-muted);
        font-size: 0.8rem;
      }

      p {
        margin: 0;
      }

      code {
        padding: 0.2rem 0.35rem;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-sm);
        color: var(--color-ink);
        background: var(--color-surface);
        font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      }

      a {
        color: var(--color-leaf);
        font-weight: 700;
        text-underline-offset: 0.2em;
      }

      @media (max-width: 38rem) {
        footer {
          align-items: flex-start;
          flex-direction: column;
          justify-content: center;
          min-height: 5rem;
        }
      }
    `,
  ];

  @property({ attribute: false })
  locale: Locale = "en";

  render() {
    const deployedAt = formatDeploymentDate(buildInfo.deployedAt, this.locale);
    const deploymentLabel = deployedAt
      ? translate(this.locale, "footerDeployed", { date: deployedAt })
      : translate(this.locale, "footerDevelopment");

    return html`
      <footer>
        <p>
          ${translate(this.locale, "footerBuiltFrom")}
          <code>${buildInfo.commit}</code> · ${deploymentLabel}
        </p>
        ${
          buildInfo.repositoryUrl
            ? html`
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
