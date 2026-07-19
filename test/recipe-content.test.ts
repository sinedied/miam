/// <reference types="node" />

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECIPES_DIR,
  loadRecipes,
  parseRecipeMarkdown,
  parseRecipes,
  RecipeContentError,
  slugFromFilename,
} from "../build/recipe-content";

const validFrontmatter = `---
title: Fluffy Pancake Stack
description: A tall stack of soft, buttery pancakes.
language: en
image:
  path: images/pancake-stack.svg
  alt: A stack of golden pancakes
prepTime: 10
cookTime: 15
servings: 4
cuisine: American
tags:
  - breakfast
  - sweet
ingredients:
  - name: flour
    quantity: 250
    unit: g
  - name: egg
    quantity: 2
---

## Instructions

1. Whisk the dry ingredients together.
2. Add the wet ingredients and mix until just combined.
3. Cook on a hot griddle until golden on both sides.

## Notes

- Keep pancakes warm in a low oven.
`;

function withFrontmatter(overrides: string, body = "\n## Instructions\n\nDo the thing.\n"): string {
  return `---\n${overrides}\n---\n${body}`;
}

describe("slugFromFilename", () => {
  it("strips the .md extension", () => {
    expect(slugFromFilename("pancake-stack.md")).toBe("pancake-stack");
  });
});

describe("parseRecipeMarkdown - valid input", () => {
  it("parses a fully valid English recipe", () => {
    const recipe = parseRecipeMarkdown("pancake-stack.md", validFrontmatter);

    expect(recipe.slug).toBe("pancake-stack");
    expect(recipe.file).toBe("pancake-stack.md");
    expect(recipe.title).toBe("Fluffy Pancake Stack");
    expect(recipe.language).toBe("en");
    expect(recipe.image).toEqual({
      path: "images/pancake-stack.svg",
      alt: "A stack of golden pancakes",
    });
    expect(recipe.prepTime).toBe(10);
    expect(recipe.cookTime).toBe(15);
    expect(recipe.servings).toBe(4);
    expect(recipe.cuisine).toBe("American");
    expect(recipe.tags).toEqual(["breakfast", "sweet"]);
    expect(recipe.ingredients).toEqual([
      { name: "flour", quantity: 250, unit: "g" },
      { name: "egg", quantity: 2 },
    ]);
  });

  it("renders the Markdown body to HTML without relying on an exact snapshot", () => {
    const recipe = parseRecipeMarkdown("pancake-stack.md", validFrontmatter);

    // Structural checks only: headings render, ordered list renders, content is present.
    expect(recipe.html).toContain("<h2>Instructions</h2>");
    expect(recipe.html).toContain("<h2>Notes</h2>");
    expect(recipe.html).toMatch(
      /<ol>[\s\S]*<li>[\s\S]*Whisk the dry ingredients[\s\S]*<\/li>[\s\S]*<\/ol>/,
    );
    expect(recipe.html).toContain("<ul>");
    expect(recipe.rawBody.length).toBeGreaterThan(0);
  });

  it("parses a fully valid French recipe (different language, accented characters)", () => {
    const raw = withFrontmatter(
      `title: Quiche Lorraine
description: Une tarte salée traditionnelle avec des lardons et de la crème.
language: fr
image:
  path: images/quiche-lorraine.svg
  alt: Une quiche lorraine dorée
prepTime: 20
cookTime: 35
servings: 6
cuisine: Française
tags:
  - plat principal
ingredients:
  - name: lardons
    quantity: 200
    unit: g`,
      "\n## Préparation\n\nFaites cuire les lardons puis assemblez la quiche.\n",
    );

    const recipe = parseRecipeMarkdown("quiche-lorraine.md", raw);

    expect(recipe.language).toBe("fr");
    expect(recipe.title).toBe("Quiche Lorraine");
    expect(recipe.description).toContain("tarte salée");
    expect(recipe.html).toContain("Préparation");
  });

  it("treats language as an optional field", () => {
    const raw = withFrontmatter(
      `title: No Language
description: A recipe without a declared language.
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water`,
    );

    const recipe = parseRecipeMarkdown("no-language.md", raw);
    expect(recipe.language).toBeUndefined();
  });

  it("treats image as an optional field", () => {
    const raw = withFrontmatter(
      `title: No Image
description: A recipe without an image.
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water`,
    );

    const recipe = parseRecipeMarkdown("no-image.md", raw);
    expect(recipe.image).toBeUndefined();
  });
});

describe("parseRecipeMarkdown - missing/invalid fields", () => {
  it("rejects a missing title", () => {
    const raw = withFrontmatter(
      `description: Missing title.
language: en
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water`,
    );

    try {
      parseRecipeMarkdown("missing-title.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RecipeContentError);
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "title")).toBe(true);
      expect(contentError.message).toContain("missing-title.md");
      expect(contentError.message).toContain("title");
    }
  });

  it("rejects an invalid language value", () => {
    const raw = withFrontmatter(
      `title: Bad Language
description: A recipe with an unsupported language.
language: de
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water`,
    );

    expect(() => parseRecipeMarkdown("bad-language.md", raw)).toThrowError(RecipeContentError);
    try {
      parseRecipeMarkdown("bad-language.md", raw);
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "language")).toBe(true);
    }
  });

  it("rejects an empty tags array", () => {
    const raw = withFrontmatter(
      `title: No Tags
description: A recipe with no tags.
language: en
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags: []
ingredients:
  - name: water`,
    );

    try {
      parseRecipeMarkdown("no-tags.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "tags")).toBe(true);
    }
  });

  it("rejects an empty ingredients array", () => {
    const raw = withFrontmatter(
      `title: No Ingredients
description: A recipe with no ingredients.
language: en
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients: []`,
    );

    try {
      parseRecipeMarkdown("no-ingredients.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "ingredients")).toBe(true);
    }
  });

  it("rejects an ingredient with a non-positive quantity", () => {
    const raw = withFrontmatter(
      `title: Bad Ingredient Quantity
description: A recipe with an invalid ingredient quantity.
language: en
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water
    quantity: -1`,
    );

    try {
      parseRecipeMarkdown("bad-ingredient.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "ingredients[0].quantity")).toBe(
        true,
      );
    }
  });

  it("rejects an empty Markdown body", () => {
    const raw = withFrontmatter(
      `title: Empty Body
description: A recipe with no instructions.
language: en
image:
  path: images/x.svg
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water`,
      "\n\n   \n",
    );

    try {
      parseRecipeMarkdown("empty-body.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "body")).toBe(true);
    }
  });

  it.each([
    ["zero", 0],
    ["negative", -5],
    ["non-integer", 1.5],
  ])("rejects prepTime/cookTime/servings that are %s instead of a positive integer", (_label, value) => {
    const raw = withFrontmatter(
      `title: Bad Ranges
description: A recipe with invalid numeric ranges.
language: en
image:
  path: images/x.svg
  alt: alt text
prepTime: ${value}
cookTime: ${value}
servings: ${value}
cuisine: Test
tags:
  - test
ingredients:
  - name: water`,
    );

    try {
      parseRecipeMarkdown("bad-ranges.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "prepTime")).toBe(true);
      expect(contentError.issues.some((issue) => issue.field === "cookTime")).toBe(true);
      expect(contentError.issues.some((issue) => issue.field === "servings")).toBe(true);
    }
  });

  it("reports every issue in a single error, not just the first one found", () => {
    const raw = withFrontmatter(
      `description: Multiple problems at once.
language: xx
image:
  path: /etc/passwd
  alt: alt text
prepTime: -1
cookTime: 0
servings: 1.2
cuisine: Test
tags: []
ingredients: []`,
    );

    try {
      parseRecipeMarkdown("many-problems.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      const fields = contentError.issues.map((issue) => issue.field);
      expect(fields).toEqual(
        expect.arrayContaining([
          "title",
          "language",
          "image.path",
          "prepTime",
          "cookTime",
          "servings",
          "tags",
          "ingredients",
        ]),
      );
      expect(contentError.issues.length).toBeGreaterThanOrEqual(8);
    }
  });
});

describe("parseRecipeMarkdown - malformed YAML", () => {
  it("rejects frontmatter with invalid YAML syntax", () => {
    const raw =
      '---\ntitle: "Unterminated string\ndescription: broken\n---\n\n## Instructions\n\nDo it.\n';

    try {
      parseRecipeMarkdown("malformed-yaml.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RecipeContentError);
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "frontmatter")).toBe(true);
      expect(contentError.message).toContain("malformed-yaml.md");
    }
  });
});

describe("parseRecipeMarkdown - trusted Markdown boundary", () => {
  it("rejects raw HTML so rendered instructions are safe for Lit unsafeHTML", () => {
    const raw = validFrontmatter.replace(
      "1. Whisk the dry ingredients together.",
      '<img src="x" onerror="alert(1)">',
    );

    expect(() => parseRecipeMarkdown("raw-html.md", raw)).toThrowError(
      /body.*must not contain raw HTML/s,
    );
  });

  it.each([
    ["a JavaScript link", "[open me](javascript:alert(1))"],
    ["an entity-obfuscated JavaScript link", "[open me](jav&#x61;script:alert(1))"],
    ["a data link", "[open me](data:text/html,unsafe)"],
    ["a remote image", "![tracking pixel](https://example.com/pixel.png)"],
    ["a repository-local body image", "![Pancakes](images/pancake-stack.svg)"],
  ])("rejects %s", (_label, markdown) => {
    const raw = validFrontmatter.replace("1. Whisk the dry ingredients together.", markdown);
    expect(() => parseRecipeMarkdown("unsafe-link.md", raw)).toThrowError(/body/);
  });

  it("allows safe HTTPS and mailto links in the body", () => {
    const raw = validFrontmatter.replace(
      "1. Whisk the dry ingredients together.",
      "See [the reference](https://example.com) or [email us](mailto:cook@example.com).",
    );
    expect(() => parseRecipeMarkdown("safe-links.md", raw)).not.toThrow();
  });
});

describe("parseRecipeMarkdown - unsafe/non-local image paths", () => {
  const baseFrontmatter = (imagePath: string) => `title: Unsafe Image
description: A recipe with an unsafe image path.
language: en
image:
  path: ${imagePath}
  alt: alt text
prepTime: 10
cookTime: 10
servings: 2
cuisine: Test
tags:
  - test
ingredients:
  - name: water`;

  it.each([
    ["an absolute path", "/etc/passwd"],
    ["a path traversal attempt", "../../etc/passwd"],
    ["a Windows-style backslash path", "images\\recipes\\photo.svg"],
    ["an external http URL", "http://example.com/image.png"],
    ["an external https URL", "https://example.com/image.png"],
    ["a protocol-relative URL", "//example.com/image.png"],
    ["a path outside images/recipes", "images/other/photo.svg"],
    ["a path with no recognized image extension", "images/photo.txt"],
  ])('rejects %s: "%s"', (_label, imagePath) => {
    const raw = withFrontmatter(baseFrontmatter(imagePath));

    try {
      parseRecipeMarkdown("unsafe-image.md", raw);
      expect.unreachable("expected parseRecipeMarkdown to throw");
    } catch (error) {
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "image.path")).toBe(true);
    }
  });

  it("accepts a safe, repository-local image path", () => {
    const raw = withFrontmatter(baseFrontmatter("images/safe-photo.svg"));
    const recipe = parseRecipeMarkdown("safe-image.md", raw);
    expect(recipe.image?.path).toBe("images/safe-photo.svg");
  });
});

describe("loadRecipes - real content directory", () => {
  it("loads all sample recipes from the recipes directory with no validation errors", () => {
    const recipes = loadRecipes();

    expect(recipes.length).toBeGreaterThan(0);

    // Sorted by slug.
    const slugs = recipes.map((recipe) => recipe.slug);
    expect(slugs).toEqual([...slugs].sort((a, b) => a.localeCompare(b)));

    for (const recipe of recipes) {
      expect(recipe.title.length).toBeGreaterThan(0);
      expect(recipe.html.length).toBeGreaterThan(0);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.tags.length).toBeGreaterThan(0);
    }
  });

  it("resolves DEFAULT_RECIPES_DIR to the recipes directory", () => {
    expect(DEFAULT_RECIPES_DIR.endsWith("recipes")).toBe(true);
    expect(fs.existsSync(DEFAULT_RECIPES_DIR)).toBe(true);
  });
});

describe("loadRecipes - fixture directories", () => {
  it("rejects a recipe whose validated local image file is missing", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miam-recipes-"));
    const recipesDir = path.join(fixtureRoot, "recipes");
    fs.mkdirSync(recipesDir);
    fs.writeFileSync(path.join(recipesDir, "pancake-stack.md"), validFrontmatter);

    try {
      expect(() => loadRecipes({ dir: recipesDir })).toThrowError(/image\.path.*does not exist/s);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("rejects duplicate slugs across two files (same base name, different filename)", () => {
    // "soup.md" and "soup.MD" both derive the same slug ("soup"), triggering a collision.
    // Using parseRecipes directly (pure, in-memory) avoids relying on filesystem case
    // sensitivity, which varies across platforms.
    try {
      parseRecipes([
        { fileName: "soup.md", raw: validFrontmatter },
        { fileName: "soup.MD", raw: validFrontmatter },
      ]);
      expect.unreachable("expected parseRecipes to throw on duplicate slugs");
    } catch (error) {
      expect(error).toBeInstanceOf(RecipeContentError);
      const contentError = error as RecipeContentError;
      expect(contentError.issues.some((issue) => issue.field === "slug")).toBe(true);
      expect(contentError.message).toContain("duplicate slug");
    }
  });

  it("aggregates issues from multiple malformed files into a single error", () => {
    try {
      parseRecipes([
        { fileName: "good.md", raw: validFrontmatter },
        { fileName: "bad-one.md", raw: withFrontmatter("title: Missing Stuff\nlanguage: en") },
        { fileName: "bad-two.md", raw: '---\ntitle: "unterminated\n---\nBody\n' },
      ]);
      expect.unreachable("expected parseRecipes to throw on malformed files");
    } catch (error) {
      const contentError = error as RecipeContentError;
      const files = new Set(contentError.issues.map((issue) => issue.file));
      expect(files.has("bad-one.md")).toBe(true);
      expect(files.has("bad-two.md")).toBe(true);
      expect(files.has("good.md")).toBe(false);
    }
  });

  it("successfully parses a valid in-memory file set", () => {
    const recipes = parseRecipes([{ fileName: "pancake-stack.md", raw: validFrontmatter }]);
    expect(recipes).toHaveLength(1);
    expect(recipes[0]?.slug).toBe("pancake-stack");
  });
});
