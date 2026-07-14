import { css } from "lit";

export const sharedStyles = css`
  :host {
    color: var(--color-ink);
    font-family: var(--font-body);
  }

  .eyebrow {
    margin: 0;
    color: var(--color-ink-muted);
    font-family: var(--font-label);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
