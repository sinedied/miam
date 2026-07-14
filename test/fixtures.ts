import type { Recipe } from "../src/types/recipe";

export const recipeFixture: Recipe = {
  slug: "tomato-tart",
  title: "Tomato Tart",
  description: "A crisp tart for summer lunches.",
  language: "en",
  image: "images/recipes/tomato-tart.svg",
  imageAlt: "A tomato tart on a green plate",
  prepTime: 20,
  cookTime: 35,
  servings: 4,
  cuisine: "French",
  tags: ["summer", "vegetarian"],
  ingredients: ["4 tomatoes", "1 sheet puff pastry"],
  instructionsHtml: "<ol><li>Slice the tomatoes.</li><li>Bake until crisp.</li></ol>",
};
