import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECIPES_DIR,
  loadRecipes,
  RECIPE_CONTENT_MODULE_ID,
} from "../build/recipe-content";
import {
  formatIngredient,
  isRecipeContentFile,
  loadRecipeModule,
  resolveRecipeModuleId,
  toClientRecipe,
} from "../build/recipe-plugin";

describe("recipe content client adapter", () => {
  it("formats structured ingredients without empty placeholders", () => {
    expect(formatIngredient({ name: "flour", quantity: 250, unit: "g" })).toBe("250 g flour");
    expect(formatIngredient({ name: "salt" })).toBe("salt");
  });

  it("exposes only the typed browser recipe model", () => {
    const contentRecipe = loadRecipes()[0];
    expect(contentRecipe).toBeDefined();
    if (!contentRecipe) {
      return;
    }

    const recipe = toClientRecipe(contentRecipe);
    expect(recipe.image).toMatch(/^images\/recipes\//);
    expect(recipe.imageAlt).toBe(contentRecipe.image.alt);
    expect(recipe.instructionsHtml).toBe(contentRecipe.html);
    expect(recipe.ingredients.every((ingredient) => typeof ingredient === "string")).toBe(true);
    expect(recipe).not.toHaveProperty("rawBody");
    expect(recipe).not.toHaveProperty("file");
  });

  it("resolves and loads the Vite virtual module", () => {
    const resolvedId = resolveRecipeModuleId(RECIPE_CONTENT_MODULE_ID);
    expect(resolvedId).toBe(`\0${RECIPE_CONTENT_MODULE_ID}`);
    expect(loadRecipeModule("another-module")).toBeUndefined();

    const moduleSource = resolvedId ? loadRecipeModule(resolvedId) : undefined;
    expect(moduleSource).toContain("export const recipes =");
    expect(moduleSource).toContain("pancake-stack");
  });

  it("recognizes recipe Markdown files independent of relative path syntax", () => {
    expect(isRecipeContentFile(`${DEFAULT_RECIPES_DIR}/pancake-stack.md`)).toBe(true);
    expect(isRecipeContentFile(`${DEFAULT_RECIPES_DIR}/notes.txt`)).toBe(false);
    expect(isRecipeContentFile("/another/content/recipes/pancake-stack.md")).toBe(false);
  });
});
