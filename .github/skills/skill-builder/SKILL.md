---
name: skill-builder
description: Create, refine, or retire skills. Use when the user has a repeatable workflow worth capturing as a skill, wants to create, improve or fix an existing skill, or wants to remove one. This skill is the authority on this project's skill format and authoring best practices. Do not use for one-off tasks the agent already handles well.
---

# Skill builder

You build and maintain this project's skills. A skill teaches the agent a repeatable
workflow it couldn't reliably do on its own. The litmus test for every skill — and every
line in it — is: *"would the agent get this wrong without it?"* If no, leave it out.

## Skill format

A skill is a folder `.github/skills/<name>/` with a `SKILL.md` (YAML frontmatter +
Markdown body), plus optional `scripts/`, `references/`, `assets/`.

```
---
name: <name>          # lowercase, digits, hyphens only; ≤64 chars; matches the folder name
description: <…>       # the most important part — see "Write the description" below
---

# <Title>

<procedure: numbered steps, decisions with a default, a validation step>

## Gotchas
- <concrete, non-obvious mistakes to avoid>
```

## Write the description (highest-ROI step)

The `description` is the skill's **activation function** — usually the only text the agent
sees before deciding to load the skill. Get it right first:

- Imperative phrasing ("Use when…"). Describe the user's intent/scenario, not internals.
- Front-load the primary use case and the words/cues that should trigger it.
- List positive triggers **and** negative ones ("Do not use for…") to avoid misfires.
- Keep **all** triggers here, not in the body — the body loads only after activation. ≤1024 chars.

## Keep it lean (progressive disclosure)

- The body holds the procedure only; include only what the agent would get wrong without
  it, and don't restate knowledge the base model already has.
- Give **defaults, not menus** of equal options. Be prescriptive for fragile or
  order-dependent steps; explain *why* for flexible ones. Add a short **Gotchas** section.
- Move bulky or conditional detail into `references/` (docs) or `assets/` (templates), and
  always say **when** to open each file — never a vague "see references/".

## Scripts (only when needed)

Add a script only for work that's deterministic, fragile, repetitive, or token-heavy
(parsing, conversion, validation) — something reasoning alone can't do reliably. A script
must be non-interactive (input via flags/stdin), print structured stdout with diagnostics
on stderr, give helpful errors and meaningful exit codes, be idempotent, require
`--confirm` for destructive actions, and pin versions. Skills are markdown at their core;
scripts are the exception, not the default.

## Creating a skill

1. Interview the user one question at a time: trigger, steps, inputs/outputs, edge cases,
   and what "done" looks like. Ask the next question only after they answer.
2. Confirm it's warranted (fails the litmus test → say so and stop).
3. Pick the `name`, then write the `description` — spend the most effort here.
4. Scaffold `.github/skills/<name>/SKILL.md`; add `scripts/`/`references/`/`assets/` only if needed.
5. Sanity-check triggering: list a few prompts that SHOULD load it and a few near-miss
   ones that should NOT; adjust the description until both hold.
6. Commit to `main`.

## Refining a skill

1. Read the `SKILL.md`; clarify what should change and why.
2. Make the smallest change that fully addresses it; keep the description accurate.
3. If you touched the description, re-run the triggering sanity-check. Commit to `main`.

## Retiring a skill

1. Confirm the skill is no longer needed.
2. Delete its folder. Commit to `main`.

## Rules

- Commit your changes to `main`.
- Never weaken privacy or other project rules through a skill.
- Portability: target the open `SKILL.md` standard and avoid vendor-specific features so
  skills work across any agent. Note real environment needs in a `compatibility` field
  when relevant.
