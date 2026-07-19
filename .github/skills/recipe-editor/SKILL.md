---
name: recipe-editor
description: >-
  Use when the user wants to create, add, or edit a miam recipe from freeform
  notes, a recipe URL, or a rough description ("turn this
  link into a recipe", "add grandma's tomato soup", "make a recipe from these
  notes", "update the pancake recipe", "add <dish> to the catalog"). Produces a
  strictly-valid, minimal `recipes/<slug>.md` file (Markdown + YAML
  frontmatter) with concise imperative steps and one fun one-liner tagline as
  the only flair. Do NOT use for: editing app code/components/UI, meal planning
  or shopping lists, writing a README, or generic Markdown/YAML files unrelated
  to the recipe catalog.
---

# Recipe editor

Turn raw input (notes, a URL, a description) into a clean, minimal miam recipe
file, or edit an existing one. The output must pass the project's strict recipe
validation on the first build. Keep it clear and straight to the point — **no
fluff, no filler**. The only place flair is allowed is the `description`
tagline.

## Procedure

1. **Decide create vs. edit.** For an edit, read the existing
   `recipes/<slug>.md` first and change only what's asked. For a new recipe,
   continue below.
2. **Gather the source.** The user may give notes, a URL, both, or a rough
   description. If a URL is given, retrieve the page and extract only the recipe
   core — **ignore blog storytelling, intros, ads, and life stories**. If
   anything essential is missing (times, servings), infer sensibly or ask.
3. **Extract into the schema.** Fill every required field (see *Schema*). Split
   ingredients into `name` / optional `quantity` / optional `unit`. Turn the
   method into short **imperative numbered steps** — one action per step, no
   filler adjectives, no narration.
4. **Write the tagline.** The `description` field is the one appealing one-liner
   that sells the dish. Fun is allowed here, and only here. One sentence, one
   line.
5. **Set the language.** Keep the recipe in the source language (tagline, steps,
   `alt`). The `language` field accepts **only** `en` or `fr`: set it to match
   when the content is English or French; if the source is any other language,
   **omit** `language` (it is optional and not displayed) rather than inventing
   a code. **Do not translate** unless the user asks.
6. **Handle the image** (optional field — omit it rather than fake it):
   - If the source has a usable photo, download it into `recipes/images/` named
     after the slug, e.g. `curl -fsSL "<url>" -o recipes/images/<slug>.<ext>`.
     Use a **lowercase** extension that is one of svg/png/jpg/jpeg/webp (the
     path check is case-sensitive); if the source is another format, convert it
     or omit the image. Set `image.path: images/<slug>.<ext>` and a non-empty
     descriptive `image.alt`.
   - If there's no image, ask the user to supply one (a local file or URL) and
     place it under `recipes/images/`.
   - If none is available, **omit the whole `image` block**. Never invent an SVG
     or placeholder image.
7. **Pick the slug.** Kebab-case from the title
   (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), lowercase, accents stripped, unique across
   `recipes/`. **Drop short linking words** — articles, prepositions,
   conjunctions and elided forms (FR: à, la, le, les, un, une, au, aux, du, de,
   des, d', l', et; EN: a, an, the, of, with, and, to) — keeping only the
   meaningful content words. Examples: "Tarte à la tomate" → `tarte-tomate`;
   "Sorbet à la banane" → `sorbet-banane`; "Glace au Kinder Bueno" →
   `glace-kinder-bueno`. **Two exceptions:** keep a linking word when it is part
   of a canonical dish name (e.g. "Coq au vin" → `coq-au-vin`, "Pot-au-feu" →
   `pot-au-feu`), and keep a distinguishing word when dropping it would collide
   with an existing recipe (e.g. `tarte-pommes` vs `tarte-de-pommes`) rather than
   forcing the shortest form. The filename (minus `.md`) *is* the slug, and the
   image file uses the same slug (`images/<slug>.<ext>`).
8. **Write the file** using [assets/recipe-template.md](assets/recipe-template.md)
   as the skeleton: `recipes/<slug>.md`.
9. **Validate.** Run `npm run build`. On failure it prints a `RecipeContentError`
   listing each problem by file and field — fix and re-run until clean. Do not
   consider the recipe done until the build passes.

## Schema (must match exactly)

Frontmatter fields — required unless marked optional:

| Field | Rules |
| --- | --- |
| `title` | non-empty string |
| `description` | non-empty string — the fun one-liner tagline |
| `prepTime` | positive integer (minutes) |
| `cookTime` | *optional*: positive integer (minutes). Omit for no-cook recipes (salads, no-bake, churned). When omitted, the detail hero shows only Prep |
| `cookTimeLabel` | *optional*: non-empty string overriding the default "Cook" label (e.g. `Levage`, `Turbinage`). Only valid together with `cookTime` |
| `servings` | positive integer |
| `cuisine` | non-empty string |
| `tags` | non-empty array of non-empty strings (a few, lowercase) |
| `ingredients` | non-empty array; each item `{ name, quantity?, unit? }`, `name` non-empty, `quantity` a positive number, `unit` non-empty |
| `language` | *optional*: `en` or `fr`, matching the content |
| `image` | *optional*: `{ path, alt }`. `path` under `images/` ending in svg/png/jpg/jpeg/webp — no URLs, no absolute paths, no `..`. `alt` non-empty |

Body (after frontmatter): required, non-empty Markdown — the numbered
instructions, plus an optional `## Notes` section **only** when a note adds real
value. **No raw HTML, no images in the body**, and links may only be
`http`/`https`/`mailto`/relative.

## Gotchas

- The `description` tagline is the *only* flair. Everything else stays terse and
  factual — resist recipe-blog padding.
- Never leave `<...>` placeholders in the final body, and avoid literal
  `<word word>` text in the body: `marked` lexes it as raw HTML and the build
  fails. Write plain text (e.g. `season to taste`, not `<to taste>`).
- `image` is optional: prefer omitting it over a broken path or a made-up
  placeholder. A missing image file that *is* referenced fails the build.
- `quantity` must be a number (`200`), not a string (`"200g"`); put the unit in
  `unit`. Omit `quantity`/`unit` entirely when there isn't one.
- `prepTime`/`servings` are plain positive integers (minutes/count), no units,
  no ranges. `cookTime` is optional (same format); omit it for no-cook recipes,
  and use `cookTimeLabel` to rename it (e.g. `Levage`, `Turbinage`) when set.
- Times/servings, tags, and cuisine still stay in the source language when
  `language: fr`.
- Quote any frontmatter string value that contains YAML-special characters —
  a colon-space (`: `), a leading `- `, `#`, `[`, `{`, `"`, `'`, `|`, `>`, etc.
  Wrap it in double quotes, e.g. `description: "Croustillantes dehors : moelleuses
  dedans."` An unquoted colon makes YAML parsing fail and the build error.
- Slug must be unique; check `recipes/` before naming a new file.
- Validate with `npm run build`, not just a visual check — strict validation
  catches issues render-time never would.
