import type { Recipe } from "../src/types/recipe";

export const recipeFixture: Recipe = {
  slug: "tomato-tart",
  title: "Tomato Tart",
  description: "A crisp tart for summer lunches.",
  language: "en",
  image: "images/tomato-tart.svg",
  imageAlt: "A tomato tart on a green plate",
  prepTime: 20,
  cookTime: 35,
  servings: 4,
  cuisine: "French",
  tags: ["summer", "vegetarian"],
  ingredients: [
    { name: "tomatoes", quantity: 4 },
    { name: "puff pastry", quantity: 1, unit: "sheet" },
  ],
  instructionsHtml: "<ol><li>Slice the tomatoes.</li><li>Bake until crisp.</li></ol>",
};
