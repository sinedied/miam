# miam — Product Specification

**miam** ("My Intelligent Assistant for Meals") is a **read-only family recipe
catalog**. Users browse, search, and read recipes. Recipes are authored as
Markdown files with YAML frontmatter and stored in the repository; images are
repository-local files. The app is a static single-page application deployed to
GitHub Pages.

This document describes the **functionality, features, and layout** needed to
recreate the project. It intentionally omits visual design details (exact
colors, spacing, typography).

## Scope (MVP)

**In scope**

- Browse a catalog of recipes.
- Search recipes by name, ingredient, or tag.
- View a single recipe with its details, ingredients, and instructions.
- Bilingual UI (English / French) with locale persistence.
- Responsive, accessible, static site.

**Out of scope** (post-MVP, do not build unless requested)

- Recipe editing/creation UI, user accounts, multi-user sync.
- Meal planning and shopping lists (planned as an agent-based post-MVP feature).
- Any AI/Copilot features.
- Any backend writes — content is read-only and sourced from the repo.

## Tech stack

- **Node.js 22+**.
- **Vite** + **TypeScript** + **Lit** web components (current stable versions).
- **MiniSearch** for client-side full-text search.
- **gray-matter** (frontmatter parsing) + **marked** (Markdown → HTML) at build time.
- **Vitest** + **happy-dom** for unit/component tests.
- **Biome** for linting and formatting.
- **GitHub Actions** → **GitHub Pages** for CI/CD.
- Minimal, CSS-variable-based styling. No CSS framework or state library.
- Keep dependencies minimal; adding a new one requires explicit approval.

## Application structure

Single-page app rendered by a root `<miam-app>` Lit component with three stacked
regions: **header**, **main content**, **footer**. A "skip to content" link
precedes the header for keyboard users.

Client-side routing is **hash-based** with two routes:

| Route            | Hash                    | View            |
| ---------------- | ----------------------- | --------------- |
| Catalog (home)   | `#/` (or anything else) | Recipe catalog  |
| Recipe detail    | `#/recipes/<slug>`      | Single recipe   |

- Unknown recipe slugs render a **"recipe not found"** view with a link back to
  the catalog.
- On navigation, scroll resets to top and focus moves to the main content
  region. The document `<title>` updates to the recipe title (or the app name).

## Layout & features by view

### Header (all views)

- **Brand**: logo mark + "miam" name, links back to the catalog (`#/`).
- **Search box**: shown **only on the catalog** view. Has a search icon, a
  clearable text input, and an accessible label/placeholder. A clear (×) button
  appears when there is a query and returns focus to the input.
- **Settings menu**: a single settings button that toggles a popup menu with
  two grouped sections (see [Theming](#theming) for appearance behavior):
  - A **Language** group (English / Français) as radio-style menu items with a
    checkmark on the active locale.
  - An **Appearance** group (System / Light / Dark) as radio-style menu items
    with a checkmark on the active theme preference.
  - Structured to allow future settings to be added.
  - Fully keyboard operable: open/close, arrow-key navigation between items,
    `Escape` to close (returns focus to the button), and closes on outside
    click. Uses appropriate ARIA (`aria-haspopup`, `aria-expanded`,
    `role="menu"`, `menuitemradio`, `aria-checked`).
- Header is sticky to the top of the viewport.

### Catalog view (home)

- A visually-hidden page heading ("Recipes").
- A **result count** line, announced politely to assistive tech (e.g. "12
  recipes" / "1 recipe" / "0 recipes"), reflecting the current search.
- A **responsive grid of recipe cards**. Each card shows:
  - Cover image (lazy-loaded, with alt text) — or a **decorative placeholder**
    icon when the recipe has no image.
  - Up to three tags.
  - Title.
  - Short description (clamped to ~2 lines).
  - Metadata chips: **total time** (prep + cook, in minutes) and **servings**,
    each paired with a visually-hidden label.
  - The whole card is a link to the recipe detail (`#/recipes/<slug>`), with an
    accessible "Open <title>" label.
- **Empty state**: when a search yields no results, show a friendly "nothing
  found" message prompting the user to try another term.
- Cards animate in on load (respecting `prefers-reduced-motion`).

### Recipe detail view

- **Back link** to the full catalog.
- **Hero** region combining:
  - The recipe image (with alt text) — or a **decorative placeholder** icon
    when the recipe has no image.
  - A **summary**: cuisine label (eyebrow), title, description, and a
    definition list of **Prep**, **Cook**, **Total** (prep + cook), and
    **Servings** — all in minutes / counts.
- **Ingredients** panel (aside): a list of ingredients formatted as
  `quantity unit name` (omitting missing parts). On desktop/tablet it sits
  **beside** the hero/method as a sticky, independently scrollable panel; on
  mobile it stacks in the normal flow.
- **Method** region: the recipe instructions rendered from Markdown to HTML
  (may include an optional "Notes" section).
- Layout is responsive: multi-column (method + sticky ingredients sidebar) on
  wider viewports, single-column stacked on narrow viewports.

### Footer (all views)

- Shows the **deployed build version**: the short commit hash and the
  deployment date (e.g. "Built from `abc1234` · deployed 16 Jul 2026"). When
  running locally (no deploy metadata), it shows a "local development" label
  instead of a date.
- A link to the **GitHub repository** (shown only when a repository URL is
  configured).
- Build metadata (commit hash, deployment date, repository URL) is injected at
  build time via environment variables; the date is formatted per the active
  locale.

## Internationalization

- Supported UI locales: **English (`en`)** and **French (`fr`)**.
- **English is the fallback**: every message key must have an English value;
  missing translations fall back to English (never to a raw key).
- **Locale resolution order** on load:
  1. Saved preference from `localStorage`.
  2. Browser language(s) (`navigator.languages`), matched by base language.
  3. Default to English.
- Changing the language updates the UI immediately, sets `<html lang>`, and
  **persists** the choice to `localStorage`.
- Translations are centralized and structured so missing keys are easy to spot.
- Messages support simple `{placeholder}` interpolation (e.g. counts, dates,
  titles).

## Theming

The app supports **light and dark** appearances with a user-selectable
preference exposed in the settings menu's **Appearance** group.

- **Preference values**: `system` (default), `light`, `dark`.
  - `system` follows the OS setting via `prefers-color-scheme`.
  - `light` / `dark` force the theme regardless of the OS.
- The preference is **persisted** to `localStorage` and restored on load
  (defaults to `system` when unset or unreadable).
- The chosen theme is applied by toggling a `data-theme` attribute on the
  document root; `system` removes the override so CSS media queries take over.
- To avoid a flash of the wrong theme, a small inline script in the HTML applies
  the saved theme **before first paint**.
- The browser chrome color (`theme-color` meta) is kept in sync with the active
  light/dark background.
- Colors are defined with CSS variables (light and dark token sets); there is no
  decorative background texture.

## Search

- Client-side, in-memory index (MiniSearch) built once from the recipe catalog.
- Indexes each recipe's **title**, **ingredients**, and **tags**, with title
  weighted highest, then tags, then ingredients.
- Behavior:
  - **Diacritic-insensitive** and case-insensitive (terms normalized, accents
    stripped, whitespace collapsed).
  - **Prefix** matching and light **fuzzy** matching.
  - All query terms must match (AND semantics).
  - An empty/whitespace/punctuation-only query returns the full catalog
    unfiltered.
- Search only appears and applies on the catalog view.

## Recipe content model

Recipes live in `recipes/*.md`; their images live in `recipes/images/`. Each
recipe is Markdown with a YAML frontmatter block.

**Directory layout**

```
recipes/
├── <slug>.md            # one Markdown + YAML frontmatter file per recipe
├── ...
└── images/
    ├── <name>.<ext>     # recipe images (svg, png, jpg, jpeg, webp)
    └── ...
```

- Recipe files sit directly in `recipes/` (no subfolders); the filename (minus
  `.md`) is the recipe slug.
- Images live only in `recipes/images/` (no nested subfolders) and are
  referenced from frontmatter as `image.path: images/<name>.<ext>`.

**Frontmatter fields**

| Field         | Type                      | Required | Rules                                                                 |
| ------------- | ------------------------- | -------- | --------------------------------------------------------------------- |
| `title`       | string                    | yes      | non-empty                                                             |
| `description` | string                    | yes      | non-empty                                                             |
| `language`    | `"en"` \| `"fr"`          | no       | validated only when present; **not displayed** in the UI             |
| `image.path`  | string                    | no       | when the `image` object is present: repository-local path under `images/`, image extension (svg/png/jpg/jpeg/webp), no URLs, no absolute paths, no traversal |
| `image.alt`   | string                    | if image | required (non-empty) **when an `image` is provided**, for accessibility |
| `prepTime`    | number (minutes)          | yes      | positive integer                                                      |
| `cookTime`    | number (minutes)          | no       | positive integer when present; when omitted, the detail hero shows only Prep (Cook and Total are hidden) |
| `cookTimeLabel` | string                  | no       | non-empty when present; overrides the default "Cook"/"Cuisson" label of the cook-time entry (e.g. "Levage", "Turbinage"). Requires `cookTime` |
| `servings`    | number                    | yes      | positive integer                                                      |
| `cuisine`     | string                    | yes      | non-empty                                                             |
| `tags`        | string[]                  | yes      | non-empty array of non-empty strings                                  |
| `ingredients` | object[]                  | yes      | non-empty array; each has `name` (required, non-empty), optional `quantity` (positive number), optional `unit` (non-empty) |

The whole `image` object is **optional**. When omitted, the recipe renders with a
decorative placeholder in the catalog card and detail hero. When present, both
`image.path` and `image.alt` are required and validated.

**Body** (Markdown after frontmatter)

- Required, non-empty — the cooking **instructions** (optionally a "Notes"
  section).
- Rendered to HTML at build time.
- Restricted for safety: **no raw HTML**, **no embedded body images** (use the
  `image` field instead), and **no unsafe link destinations** (only
  `http`, `https`, `mailto`, or relative links allowed).

**Slug**

- Derived from the filename without extension, must be kebab-case
  (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- Must be unique across all recipes.

## Content validation (build/load time)

Validation is **strict** with **no silent failures** — invalid content must
produce a clear, visible error, never be silently skipped.

- All recipe files are parsed and validated before failing, so **every** issue
  (malformed YAML, invalid/missing fields, duplicate slugs, missing image
  files) is reported together in a single aggregated error, each identified by
  **file** and **field**.
- Validation includes: required fields and types, allowed `language` values,
  positive integers for times/servings, non-empty tags/ingredients, image path
  safety/locality **(validated only when an image is provided)**, slug format
  and uniqueness, safe Markdown body, and that each referenced image file
  **exists** on disk.
- Validation runs at build/load time (via a Vite plugin), so bad content fails
  the build early rather than at render time.

## Build & asset pipeline

- A custom **Vite plugin** exposes the validated recipe catalog to the app as a
  virtual module (`virtual:recipes`).
- Recipe images referenced in frontmatter are **imported through Vite's asset
  pipeline** so they become hashed, cache-friendly, base-path-safe URLs (images
  are not inlined).
- In dev, editing/adding/removing a recipe Markdown file invalidates the
  virtual module and triggers a full reload.
- The app's base path is configurable (`BASE_PATH`) to support both project and
  user/org GitHub Pages URLs.

## Accessibility & responsiveness

- Fully **keyboard-navigable** and screen-reader friendly: semantic HTML, ARIA
  where needed, focus management on route changes, a skip-to-content link, and
  visually-hidden labels for icon-only metadata.
- Recipe images, when present, require **alt text** (enforced by validation);
  recipes without an image use a decorative, `aria-hidden` placeholder.
- Live-region announcement for search result counts.
- Sufficient color contrast and visible focus states; honors
  `prefers-reduced-motion`.
- **Responsive** layouts usable on mobile, tablet, and desktop viewports.

## Deployment

- Deployed as a static site to **GitHub Pages** via **GitHub Actions** on push
  to `main` (and manual dispatch).
- The workflow computes and injects build metadata (short commit SHA,
  deployment timestamp, repository URL, base path), runs the full check suite
  (typecheck, Biome CI, tests, build), then uploads and deploys the `dist`
  artifact.

## Quality gates

Before any change is considered done, all of the following must pass:

1. **Build** (`vite build` / project build script).
2. **Type checking** (`tsc`).
3. **Biome** lint and format checks.
4. **All tests** (`vitest`) — every component and function is tested, including
   edge cases (empty/missing data, malformed input, empty search results,
   locale fallback).

Commits use **conventional commit** messages.
