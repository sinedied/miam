/**
 * Recipe content layer.
 *
 * Parses and validates Markdown + YAML-frontmatter recipe files against a
 * strict schema, and renders the Markdown body to HTML. This module is pure
 * TypeScript with no Vite dependency, so it can be:
 *  - unit tested directly (see test/recipe-content.test.ts), and
 *  - reused from `vite.config.ts` to back a virtual module that exposes the
 *    parsed recipe catalog to the app at build time.
 *
 * Design goals (see AGENTS.md "Recipe content & validation"):
 *  - Strict schema validation, no silent failures: malformed recipes throw a
 *    `RecipeContentError` that lists every problem found, identified by file
 *    and field.
 *  - Duplicate slugs and unsafe/non-local image paths are rejected.
 */

/// <reference types="node" />

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

/** Supported recipe languages. English is the app-wide fallback locale. */
export type RecipeLanguage = "en" | "fr";

export interface RecipeImage {
  /** Repository-local path, relative to `public/`, e.g. "images/recipes/pancakes.svg". */
  path: string;
  /** Non-empty alt text describing the image, for accessibility. */
  alt: string;
}

export interface RecipeIngredient {
  /** Ingredient name, e.g. "flour". Required, non-empty. */
  name: string;
  /** Optional quantity, must be a positive number when present (e.g. 1.5). */
  quantity?: number;
  /** Optional unit, e.g. "cup", "g". */
  unit?: string;
}

/** Fields parsed and validated from the recipe's YAML frontmatter. */
export interface RecipeFrontmatter {
  title: string;
  description: string;
  language: RecipeLanguage;
  image: RecipeImage;
  /** Preparation time in minutes, positive integer. */
  prepTime: number;
  /** Cooking time in minutes, positive integer. */
  cookTime: number;
  /** Number of servings, positive integer. */
  servings: number;
  cuisine: string;
  /** Non-empty list of non-empty tags. */
  tags: string[];
  /** Non-empty list of structured ingredients. */
  ingredients: RecipeIngredient[];
}

/** Fully parsed recipe: validated frontmatter plus rendered Markdown body. */
export interface Recipe extends RecipeFrontmatter {
  /** Slug derived from the filename (without extension), e.g. "pancake-stack". */
  slug: string;
  /** Filename the recipe was parsed from, e.g. "pancake-stack.md". Useful for error context. */
  file: string;
  /** Raw Markdown body (frontmatter stripped), before rendering. */
  rawBody: string;
  /** Markdown body rendered to HTML (instructions + optional notes). */
  html: string;
}

/** A single validation problem, identified by file and (when applicable) field. */
export interface RecipeContentIssue {
  file: string;
  field?: string;
  message: string;
}

/**
 * Thrown whenever one or more recipe files fail validation. Carries the full
 * list of issues found (across all offending fields/files) so problems are
 * never silently dropped or truncated to the first failure.
 */
export class RecipeContentError extends Error {
  readonly issues: RecipeContentIssue[];

  constructor(issues: RecipeContentIssue[]) {
    super(RecipeContentError.formatIssues(issues));
    this.name = "RecipeContentError";
    this.issues = issues;
  }

  private static formatIssues(issues: RecipeContentIssue[]): string {
    return issues
      .map((issue) => `${issue.file}${issue.field ? ` [${issue.field}]` : ""}: ${issue.message}`)
      .join("\n");
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGES: readonly RecipeLanguage[] = ["en", "fr"];
/** Image paths must live under this repository-local prefix (served from `public/`). */
const IMAGE_PATH_PREFIX = "images/recipes/";
const IMAGE_PATH_PATTERN = /^images\/recipes\/[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(?:svg|png|jpe?g|webp)$/;

function isSafeMarkdownLink(href: string): boolean {
  const value = href.trim();
  const prefix = value.split(/[/?#]/, 1)[0] ?? "";
  if (prefix.includes("&") || value.startsWith("//") || value.startsWith("\\\\")) {
    return false;
  }

  const normalized = [...value]
    .filter((character) => character.charCodeAt(0) > 32 && character !== "\\")
    .join("");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(normalized)?.[1];
  return !scheme || ["http", "https", "mailto"].includes(scheme.toLowerCase());
}

function validateMarkdownTokens(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(validateMarkdownTokens);
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }

  const token = value as Record<string, unknown>;
  if (token.type === "html") {
    return ["must not contain raw HTML"];
  }
  if (token.type === "link" && typeof token.href === "string" && !isSafeMarkdownLink(token.href)) {
    return [`contains an unsafe link destination: "${token.href}"`];
  }
  if (token.type === "image" && typeof token.href === "string") {
    const imageIssues = validateImagePath(token.href, "Markdown image");
    if (imageIssues.length > 0) {
      return imageIssues;
    }
  }
  return Object.values(token).flatMap(validateMarkdownTokens);
}

/**
 * Derives the recipe slug from a recipe filename, e.g. "pancake-stack.md" -> "pancake-stack".
 */
export function slugFromFilename(fileName: string): string {
  return fileName.replace(/\.md$/i, "");
}

/**
 * Validates that an image path is a safe, repository-local path (no absolute
 * paths, no URL schemes, no path traversal) and lives under the recipes image
 * directory. Returns a list of issues (empty when the path is valid).
 */
function validateImagePath(imagePath: unknown, field: string): string[] {
  const issues: string[] = [];
  if (typeof imagePath !== "string" || imagePath.trim().length === 0) {
    issues.push(`${field} must be a non-empty string`);
    return issues;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(imagePath) || imagePath.startsWith("//")) {
    issues.push(`${field} must be a repository-local path, not a URL: "${imagePath}"`);
    return issues;
  }

  if (path.isAbsolute(imagePath) || imagePath.startsWith("/")) {
    issues.push(`${field} must be a relative path, not absolute: "${imagePath}"`);
    return issues;
  }

  if (imagePath.includes("\\")) {
    issues.push(`${field} must use forward slashes: "${imagePath}"`);
    return issues;
  }

  const segments = imagePath.split("/");
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    issues.push(`${field} must not contain path traversal segments: "${imagePath}"`);
    return issues;
  }

  if (!imagePath.startsWith(IMAGE_PATH_PREFIX) || !IMAGE_PATH_PATTERN.test(imagePath)) {
    issues.push(
      `${field} must be a local path under "${IMAGE_PATH_PREFIX}" with an image extension (svg, png, jpg, jpeg, webp): "${imagePath}"`,
    );
  }

  return issues;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateIngredients(
  value: unknown,
  pushIssue: (field: string, message: string) => void,
): RecipeIngredient[] {
  if (!Array.isArray(value) || value.length === 0) {
    pushIssue("ingredients", "must be a non-empty array");
    return [];
  }

  const ingredients: RecipeIngredient[] = [];
  value.forEach((entry, index) => {
    const field = `ingredients[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      pushIssue(field, 'must be an object with at least a "name" field');
      return;
    }

    const candidate = entry as Record<string, unknown>;
    if (!isNonEmptyString(candidate.name)) {
      pushIssue(`${field}.name`, "must be a non-empty string");
      return;
    }

    const ingredient: RecipeIngredient = { name: candidate.name.trim() };

    if (candidate.quantity !== undefined) {
      if (
        typeof candidate.quantity !== "number" ||
        !Number.isFinite(candidate.quantity) ||
        candidate.quantity <= 0
      ) {
        pushIssue(`${field}.quantity`, "must be a positive number when present");
        return;
      }

      ingredient.quantity = candidate.quantity;
    }

    if (candidate.unit !== undefined) {
      if (!isNonEmptyString(candidate.unit)) {
        pushIssue(`${field}.unit`, "must be a non-empty string when present");
        return;
      }

      ingredient.unit = candidate.unit.trim();
    }

    ingredients.push(ingredient);
  });

  return ingredients;
}

function validateTags(
  value: unknown,
  pushIssue: (field: string, message: string) => void,
): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    pushIssue("tags", "must be a non-empty array");
    return [];
  }

  const tags: string[] = [];
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      pushIssue(`tags[${index}]`, "must be a non-empty string");
      return;
    }

    tags.push(entry.trim());
  });

  return tags;
}

function validateImage(
  value: unknown,
  pushIssue: (field: string, message: string) => void,
): RecipeImage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    pushIssue("image", 'must be an object with "path" and "alt" fields');
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const pathIssues = validateImagePath(candidate.path, "image.path");
  for (const issue of pathIssues) pushIssue("image.path", issue);

  if (!isNonEmptyString(candidate.alt)) {
    pushIssue("image.alt", "must be a non-empty string");
  }

  if (pathIssues.length > 0 || !isNonEmptyString(candidate.alt)) return undefined;

  return { path: candidate.path as string, alt: (candidate.alt as string).trim() };
}

/**
 * Parses and strictly validates a single recipe Markdown file (with YAML
 * frontmatter). Pure function: does not touch the filesystem.
 *
 * @param fileName - the recipe's filename, e.g. "pancake-stack.md". Used to
 *   derive the slug and to identify issues in error messages.
 * @param raw - the raw file contents (frontmatter + Markdown body).
 * @throws {RecipeContentError} when the file is malformed or fails schema validation.
 */
export function parseRecipeMarkdown(fileName: string, raw: string): Recipe {
  const issues: RecipeContentIssue[] = [];
  const pushIssue = (field: string, message: string) =>
    issues.push({ file: fileName, field, message });

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new RecipeContentError([
      { file: fileName, field: "frontmatter", message: `invalid YAML frontmatter: ${message}` },
    ]);
  }

  const data = parsed.data as Record<string, unknown>;

  const slug = slugFromFilename(fileName);
  if (!SLUG_PATTERN.test(slug)) {
    pushIssue(
      "slug",
      `filename must produce a kebab-case slug (lowercase letters, digits, hyphens): got "${slug}"`,
    );
  }

  if (!isNonEmptyString(data.title)) {
    pushIssue("title", "must be a non-empty string");
  }

  if (!isNonEmptyString(data.description)) {
    pushIssue("description", "must be a non-empty string");
  }

  if (typeof data.language !== "string" || !LANGUAGES.includes(data.language as RecipeLanguage)) {
    pushIssue("language", `must be one of ${LANGUAGES.map((l) => `"${l}"`).join(", ")}`);
  }

  const image = validateImage(data.image, pushIssue);

  if (!isPositiveInteger(data.prepTime)) {
    pushIssue("prepTime", "must be a positive integer (minutes)");
  }

  if (!isPositiveInteger(data.cookTime)) {
    pushIssue("cookTime", "must be a positive integer (minutes)");
  }

  if (!isPositiveInteger(data.servings)) {
    pushIssue("servings", "must be a positive integer");
  }

  if (!isNonEmptyString(data.cuisine)) {
    pushIssue("cuisine", "must be a non-empty string");
  }

  const tags = validateTags(data.tags, pushIssue);
  const ingredients = validateIngredients(data.ingredients, pushIssue);

  const rawBody = parsed.content.trim();
  if (rawBody.length === 0) {
    pushIssue("body", "must contain Markdown instructions (and optionally notes)");
  } else {
    for (const issue of validateMarkdownTokens(marked.lexer(rawBody))) {
      pushIssue("body", issue);
    }
  }

  if (issues.length > 0) {
    throw new RecipeContentError(issues);
  }

  const html = marked.parse(rawBody, { async: false }) as string;

  return {
    slug,
    file: fileName,
    title: (data.title as string).trim(),
    description: (data.description as string).trim(),
    language: data.language as RecipeLanguage,
    // biome-ignore lint: image is guaranteed defined here since issues.length === 0
    image: image!,
    prepTime: data.prepTime as number,
    cookTime: data.cookTime as number,
    servings: data.servings as number,
    cuisine: (data.cuisine as string).trim(),
    tags,
    ingredients,
    rawBody,
    html,
  };
}

/** Default directory containing recipe Markdown files, resolved relative to this file. */
export const DEFAULT_RECIPES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "recipes",
);

/** Default directory containing public assets, resolved from the repository root. */
export const DEFAULT_PUBLIC_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
);

/** An in-memory recipe file, as read from disk (or provided directly in tests). */
export interface RecipeFileInput {
  /** Filename, e.g. "pancake-stack.md". Used to derive the slug and identify issues. */
  fileName: string;
  /** Raw file contents (frontmatter + Markdown body). */
  raw: string;
}

/**
 * Parses and validates a set of recipe files, enforcing slug uniqueness
 * across the whole set. Pure function: does not touch the filesystem, so it
 * is fully testable in isolation and is the core aggregation logic reused by
 * {@link loadRecipes}.
 *
 * All files are parsed before failing so every issue (malformed files,
 * invalid fields, duplicate slugs) is reported together in a single
 * `RecipeContentError` rather than stopping at the first problem found.
 *
 * @throws {RecipeContentError} when any recipe is malformed, invalid, or a
 *   duplicate slug is found.
 */
export function parseRecipes(files: RecipeFileInput[]): Recipe[] {
  const issues: RecipeContentIssue[] = [];
  const recipes: Recipe[] = [];
  const slugToFile = new Map<string, string>();

  for (const { fileName, raw } of files) {
    let recipe: Recipe;
    try {
      recipe = parseRecipeMarkdown(fileName, raw);
    } catch (error) {
      if (error instanceof RecipeContentError) {
        issues.push(...error.issues);
        continue;
      }

      throw error;
    }

    const existingFile = slugToFile.get(recipe.slug);
    if (existingFile) {
      issues.push({
        file: fileName,
        field: "slug",
        message: `duplicate slug "${recipe.slug}" is already used by "${existingFile}"`,
      });
      continue;
    }

    slugToFile.set(recipe.slug, fileName);
    recipes.push(recipe);
  }

  if (issues.length > 0) {
    throw new RecipeContentError(issues);
  }

  return recipes.sort((a, b) => a.slug.localeCompare(b.slug));
}

export interface LoadRecipesOptions {
  /** Absolute directory to read `*.md` recipe files from. Defaults to `content/recipes`. */
  dir?: string;
  /** Absolute public asset directory used to verify recipe images. Defaults to `public/`. */
  publicDir?: string;
}

/**
 * Reads every `*.md` recipe file in the given directory (defaults to
 * `content/recipes`) and delegates to {@link parseRecipes} for validation,
 * rendering and slug-uniqueness enforcement.
 *
 * @throws {RecipeContentError} when any recipe file is malformed, invalid, or
 *   a duplicate slug is found.
 */
export function loadRecipes(options: LoadRecipesOptions = {}): Recipe[] {
  const dir = options.dir ?? DEFAULT_RECIPES_DIR;
  const publicDir = options.publicDir ?? DEFAULT_PUBLIC_DIR;
  const fileNames = fs
    .readdirSync(dir)
    .filter((entry) => entry.toLowerCase().endsWith(".md"))
    .sort();

  const files: RecipeFileInput[] = fileNames.map((fileName) => ({
    fileName,
    raw: fs.readFileSync(path.join(dir, fileName), "utf8"),
  }));

  const recipes = parseRecipes(files);
  const missingImages = recipes
    .filter((recipe) => !fs.existsSync(path.join(publicDir, recipe.image.path)))
    .map((recipe) => ({
      file: recipe.file,
      field: "image.path",
      message: `referenced image does not exist under public/: "${recipe.image.path}"`,
    }));

  if (missingImages.length > 0) {
    throw new RecipeContentError(missingImages);
  }

  return recipes;
}

/**
 * Virtual module id intended for use from `vite.config.ts` to expose the
 * parsed recipe catalog to app code, e.g.:
 *
 * ```ts
 * import { loadRecipes, RECIPE_CONTENT_MODULE_ID } from './build/recipe-content';
 *
 * export default defineConfig({
 *   plugins: [{
 *     name: 'recipe-content',
 *     resolveId: (id) => (id === RECIPE_CONTENT_MODULE_ID ? '\0' + id : undefined),
 *     load: (id) => (id === '\0' + RECIPE_CONTENT_MODULE_ID
 *       ? `export const recipes = ${JSON.stringify(loadRecipes())};`
 *       : undefined),
 *   }],
 * });
 * ```
 */
export const RECIPE_CONTENT_MODULE_ID = "virtual:recipes";
