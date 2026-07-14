import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { type Locale, supportedLocales, translate } from "../lib/i18n";
import { sharedStyles } from "../styles/component";

@customElement("app-header")
export class AppHeader extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        position: sticky;
        top: 0;
        z-index: 20;
        display: block;
        border-bottom: 1px solid var(--color-line);
        background: color-mix(in srgb, var(--color-canvas) 88%, transparent);
        backdrop-filter: blur(12px);
      }

      .bar {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        width: min(100% - 2rem, var(--content-width));
        min-height: 2.75rem;
        margin-inline: auto;
        padding-block: var(--space-1);
        gap: var(--space-2);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
        gap: 0.4rem;
        color: inherit;
        text-decoration: none;
      }

      .mark {
        display: grid;
        width: 1.75rem;
        height: 1.75rem;
        place-items: center;
        border-radius: var(--radius-sm);
        color: var(--color-surface);
        background: var(--color-leaf);
        font-family: var(--font-display);
        font-size: 1.05rem;
        line-height: 1;
      }

      .name {
        font-family: var(--font-display);
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: -0.035em;
        line-height: 1;
      }

      .search {
        flex: 1 1 6rem;
        min-width: 0;
      }

      .input-wrap {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        border: 1px solid var(--color-line);
        border-radius: 999px;
        background: var(--color-surface);
      }

      .input-wrap:focus-within {
        border-color: var(--color-ink);
        outline: 3px solid var(--color-focus);
        outline-offset: 2px;
      }

      .glyph {
        width: 0.95rem;
        height: 0.95rem;
        margin-inline: 0.7rem 0.1rem;
        color: var(--color-ink-muted);
      }

      input {
        min-width: 0;
        padding: 0.4rem 0.5rem;
        border: 0;
        color: var(--color-ink);
        background: transparent;
      }

      input:focus {
        outline: 0;
      }

      .clear {
        display: grid;
        width: 1.7rem;
        height: 1.7rem;
        margin-right: 0.25rem;
        place-items: center;
        border: 0;
        border-radius: 999px;
        color: var(--color-ink-muted);
        background: transparent;
        font-size: 1.15rem;
        line-height: 1;
        cursor: pointer;
      }

      .clear:hover {
        color: var(--color-ink);
        background: var(--color-surface-strong);
      }

      .settings {
        position: relative;
        flex: 0 0 auto;
        margin-left: auto;
      }

      .settings-button {
        display: grid;
        width: 2.1rem;
        height: 2.1rem;
        place-items: center;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-sm);
        color: var(--color-ink);
        background: var(--color-surface);
        cursor: pointer;
      }

      .settings-button:hover {
        background: var(--color-surface-strong);
      }

      .settings-button svg {
        width: 1.15rem;
        height: 1.15rem;
      }

      .menu {
        position: absolute;
        top: calc(100% + 0.4rem);
        right: 0;
        z-index: 30;
        display: grid;
        gap: 0.15rem;
        min-width: 12rem;
        padding: var(--space-2);
        border: 1px solid var(--color-line);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        box-shadow: var(--shadow-card);
      }

      .menu-group {
        margin: 0.1rem 0.5rem 0.25rem;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        width: 100%;
        padding: 0.45rem 0.5rem;
        border: 0;
        border-radius: var(--radius-sm);
        color: inherit;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .menu-item:hover {
        background: var(--color-surface-strong);
      }

      .menu-item[aria-checked="true"] {
        color: var(--color-leaf);
        font-weight: 700;
      }

      .check {
        display: inline-grid;
        width: 1rem;
        place-items: center;
        color: var(--color-leaf);
      }

      @media (max-width: 20rem) {
        .name {
          display: none;
        }
      }
    `,
  ];

  @property({ attribute: false })
  locale: Locale = "en";

  @property({ attribute: false })
  query = "";

  @property({ type: Boolean })
  showSearch = false;

  @state()
  private menuOpen = false;

  private readonly onDocumentPointerDown = (event: MouseEvent): void => {
    if (this.menuOpen && !event.composedPath().includes(this)) {
      this.closeMenu(false);
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    super.disconnectedCallback();
  }

  private get settingsButton(): HTMLButtonElement | null {
    return this.renderRoot.querySelector<HTMLButtonElement>(".settings-button");
  }

  private async toggleMenu(): Promise<void> {
    this.menuOpen = !this.menuOpen;
    await this.updateComplete;
    if (this.menuOpen) {
      const checked = this.renderRoot.querySelector<HTMLElement>(
        '[role="menuitemradio"][aria-checked="true"]',
      );
      (checked ?? this.renderRoot.querySelector<HTMLElement>('[role="menuitemradio"]'))?.focus();
    }
  }

  private async closeMenu(focusButton: boolean): Promise<void> {
    if (!this.menuOpen) {
      return;
    }
    this.menuOpen = false;
    await this.updateComplete;
    if (focusButton) {
      this.settingsButton?.focus();
    }
  }

  private selectLocale(locale: Locale): void {
    if (locale !== this.locale) {
      this.dispatchEvent(
        new CustomEvent<Locale>("locale-change", {
          bubbles: true,
          composed: true,
          detail: locale,
        }),
      );
    }
    void this.closeMenu(true);
  }

  private onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      void this.closeMenu(true);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const items = [...this.renderRoot.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    if (items.length === 0) {
      return;
    }
    const current = items.indexOf(this.shadowRoot?.activeElement as HTMLElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + delta + items.length) % items.length;
    items[next]?.focus();
  }

  private changeSearch(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent<string>("search-change", {
        bubbles: true,
        composed: true,
        detail: input.value,
      }),
    );
  }

  private clearSearch(): void {
    this.dispatchEvent(new CustomEvent("clear-search", { bubbles: true, composed: true }));
    void this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLInputElement>("#recipe-search")?.focus();
    });
  }

  private renderSearch() {
    return html`
      <div class="search">
        <span class="input-wrap">
          <svg class="glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path
              d="m20 20-3.5-3.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <input
            id="recipe-search"
            type="search"
            autocomplete="off"
            aria-label=${translate(this.locale, "searchLabel")}
            placeholder=${translate(this.locale, "searchPlaceholder")}
            .value=${this.query}
            @input=${this.changeSearch}
          />
          ${
            this.query
              ? html`
                <button
                  class="clear"
                  type="button"
                  title=${translate(this.locale, "clearSearch")}
                  aria-label=${translate(this.locale, "clearSearch")}
                  @click=${this.clearSearch}
                >
                  ×
                </button>
              `
              : html`<span></span>`
          }
        </span>
      </div>
    `;
  }

  private renderSettings() {
    const settingsLabel = translate(this.locale, "settings");
    return html`
      <div class="settings" @keydown=${this.onMenuKeydown}>
        <button
          class="settings-button"
          type="button"
          aria-haspopup="menu"
          aria-expanded=${this.menuOpen}
          aria-controls=${ifDefined(this.menuOpen ? "settings-menu" : undefined)}
          aria-label=${settingsLabel}
          title=${settingsLabel}
          @click=${this.toggleMenu}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="2" />
            <path
              d="M19.4 13a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V19a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 17.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.6 13a1.7 1.7 0 0 0-1.56-1.03H2a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 3.6 7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8 2.6h.09A1.7 1.7 0 0 0 9 1.04V1a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 14 2.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.4 7v.09A1.7 1.7 0 0 0 22 8h.04a2 2 0 1 1 0 4H22a1.7 1.7 0 0 0-1.6 1Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              transform="translate(0 1)"
            />
          </svg>
        </button>
        ${
          this.menuOpen
            ? html`
              <div id="settings-menu" class="menu" role="menu" aria-label=${settingsLabel}>
                <p class="eyebrow menu-group" aria-hidden="true">
                  ${translate(this.locale, "languageLabel")}
                </p>
                <div role="group" aria-label=${translate(this.locale, "languageLabel")}>
                  ${supportedLocales.map(
                    (locale) => html`
                      <button
                        class="menu-item"
                        type="button"
                        role="menuitemradio"
                        aria-checked=${this.locale === locale}
                        @click=${() => this.selectLocale(locale)}
                      >
                        <span class="check" aria-hidden="true">
                          ${this.locale === locale ? "✓" : ""}
                        </span>
                        ${translate(this.locale, locale === "fr" ? "french" : "english")}
                      </button>
                    `,
                  )}
                </div>
              </div>
            `
            : null
        }
      </div>
    `;
  }

  render() {
    return html`
      <header class="bar">
        <a class="brand" href="#/" aria-label="Miam">
          <span class="mark" aria-hidden="true">M</span>
          <span class="name">miam</span>
        </a>

        ${this.showSearch ? this.renderSearch() : null} ${this.renderSettings()}
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-header": AppHeader;
  }
}
