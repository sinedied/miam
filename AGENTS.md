# AGENTS.md

Guidance for coding agents working on **miam**, a read-only MVP family recipe catalog.

## Product scope (MVP)

- **Read-only** recipe catalog: browse, search, and view recipes. No editing UI, no accounts, no backend writes.
- Recipes are authored as **Markdown files with YAML frontmatter**, stored in the repo.
- Recipe images are **local files hosted in this GitHub repo** (no external image CDN/service).
- **Out of scope for MVP** — do not build unless explicitly requested: meal planning, shopping lists, Copilot/AI agents features, user accounts, multi-user sync. These are post-MVP.

## Stack

- **Node 22+**.
- **Vite** + **TypeScript** + **Lit** (use current/latest stable versions — check installed versions before assuming APIs).
- **Vitest** with **happy-dom** for testing.
- **Biome** for linting and formatting (replaces ESLint/Prettier).
- No other frameworks, state libraries, UI kits, or CSS frameworks unless explicitly approved.

## Dependencies

- **Never add a new dependency** (runtime or dev) without first asking the user for explicit confirmation, even if it seems obviously useful or small.
- Stick to the approved set above. If a task seems to require something new, stop and ask before installing.

## Internationalization

- UI supports **English and French**.
- **English is the fallback** locale — every string must have an English value; French is an enhancement, not a requirement for every string.
- Keep translations co-located/structured so missing keys are easy to spot (no silent fallback to raw keys).

## Recipe content & validation

- Recipe Markdown files live in `recipes/*.md`; their images live in `recipes/images/`, referenced
  from front matter as `image.path: images/<file>` (repository-local, no subfolders/URLs). Images
  are imported by the Vite plugin as hashed, base-path-safe assets.
- `language` is an **optional** front-matter field (validated only when present); it is not
  displayed in the UI.
- Recipe files (Markdown + YAML frontmatter) must be **strictly validated** on load (required fields, types, allowed values, image references, etc.).
- **No silent parsing failures**: invalid or malformed recipes must produce a clear, visible error (thrown error, logged warning surfaced in UI/build, or failed build) — never be silently skipped or dropped.
- Validate at build/load time so bad content is caught early, not just at render time.

## Accessibility & responsiveness

- All UI must be **keyboard-navigable** and usable with screen readers (semantic HTML, ARIA where needed, focus management, alt text for recipe images).
- Maintain sufficient color contrast and visible focus states.
- Layout must be **responsive**: usable on mobile, tablet, and desktop viewports.

## Design system

All design tokens are **CSS custom properties** defined in `src/styles/global.css`. Use the
tokens everywhere — do not hard-code colors, font sizes, spacing, or radii in components.

- **Colors** are semantic roles, not raw values: `--color-canvas`, `--color-surface`,
  `--color-surface-strong`, `--color-ink`, `--color-ink-muted`, `--color-line`,
  `--color-accent`, `--color-accent-strong`, `--color-accent-soft`, `--color-leaf` (brand),
  `--color-focus`, plus `--shadow-card`.
- **Type scale**: `--text-2xs`, `--text-xs`, `--text-sm`, `--text-base`, `--text-md`,
  `--text-lg`, `--text-xl`, `--text-2xl`. **Fonts**: `--font-display`, `--font-body`,
  `--font-label`.
- **Spacing**: `--space-1`…`--space-8`. **Radii**: `--radius-sm/md/lg`. **Layout**:
  `--content-width`, `--header-height`.
- **Theming has two axes**, both persisted to `localStorage` and applied on load:
  - **Appearance** (`miam:appearance`): `system` | `light` | `dark` (a radio group in
    settings). `system` follows the OS via `matchMedia`.
  - **Palette** (`miam:palette`): `moka` (default) | `ocean` | `slate` (a dropdown).
  - JS resolves appearance→mode and sets `data-theme="<palette>"` + `data-mode="light|dark"`
    on `<html>`; the CSS token blocks key off those attributes. See `src/lib/theme.ts`.
- **To add a palette**: add its id to `palettes` in `src/lib/theme.ts`, add a
  `themeColors[<id>]` canvas entry, add `:root[data-theme="<id>"]` (light) and
  `:root[data-theme="<id>"][data-mode="dark"]` (dark) token blocks in `global.css`, and a
  `theme<Name>` label in `src/lib/i18n.ts` (both locales). Every palette must define all
  color roles in both modes.

## Testing

- **Test every component and function**, including edge cases (empty/missing data, malformed recipe input, empty search results, locale fallback, etc.).
- Use Vitest + happy-dom for unit/component tests. No test should be skipped without a documented reason.
- New code must ship with tests covering its behavior before being considered done.

## Workflow

- Use **conventional commits** for all commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, etc.).
- After every coherent set of changes, run **`/rubber-duck`** with **GPT 5.5 at xhigh
  reasoning effort** to review the work before moving on.
- **Before committing**, ensure all of the following pass:
  1. Build (`vite build` / project build script)
  2. Type checking (`tsc`)
  3. Biome lint and format checks
  4. All tests (`vitest`)
- Do not commit if any of the above fail. Fix issues first.
