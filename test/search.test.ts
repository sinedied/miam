import { describe, expect, it } from "vitest";
import { normalizeSearchTerm, searchRecipes } from "../src/lib/search";
import { recipeFixture } from "./fixtures";

const frenchRecipe = {
  ...recipeFixture,
  slug: "creme-brulee",
  title: "Crème brûlée",
  ingredients: [{ name: "Crème entière" }, { name: "vanille" }],
  tags: ["dessert"],
};

describe("recipe search", () => {
  it("normalizes case, whitespace, and diacritics", () => {
    expect(normalizeSearchTerm("  CRÈME   Brûlée ")).toBe("creme brulee");
  });

  it("returns the original ordering for an empty query", () => {
    const recipes = [recipeFixture, frenchRecipe];
    expect(searchRecipes(recipes, "   ")).toBe(recipes);
    expect(searchRecipes(recipes, " -- !! ")).toBe(recipes);
  });

  it("searches titles, ingredients, and tags", () => {
    const recipes = [recipeFixture, frenchRecipe];
    expect(searchRecipes(recipes, "brulee")).toEqual([frenchRecipe]);
    expect(searchRecipes(recipes, "CRÈME")).toEqual([frenchRecipe]);
    expect(searchRecipes(recipes, "tomatoes")).toEqual([recipeFixture]);
    expect(searchRecipes(recipes, "dessert")).toEqual([frenchRecipe]);
  });

  it("requires every query term to match", () => {
    expect(searchRecipes([recipeFixture, frenchRecipe], "creme vanille")).toEqual([frenchRecipe]);
    expect(searchRecipes([recipeFixture, frenchRecipe], "creme tomato")).toEqual([]);
  });

  it("supports prefix and typo-tolerant matching", () => {
    expect(searchRecipes([recipeFixture, frenchRecipe], "brul")).toEqual([frenchRecipe]);
    expect(searchRecipes([recipeFixture, frenchRecipe], "tomto")).toEqual([recipeFixture]);
  });

  it("ranks title matches ahead of ingredient matches", () => {
    const ingredientMatch = {
      ...frenchRecipe,
      slug: "summer-salad",
      title: "Summer Salad",
      ingredients: [{ name: "tomato" }, { name: "lettuce" }],
    };
    expect(searchRecipes([ingredientMatch, recipeFixture], "tomato")).toEqual([
      recipeFixture,
      ingredientMatch,
    ]);
  });
});
