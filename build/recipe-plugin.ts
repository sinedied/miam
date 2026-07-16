import path from "node:path";
import type { Plugin } from "vite";
import type { Recipe as ClientRecipe } from "../src/types/recipe";
import {
  type Recipe as ContentRecipe,
  DEFAULT_RECIPES_DIR,
  loadRecipes,
  RECIPE_CONTENT_MODULE_ID,
  type RecipeIngredient,
} from "./recipe-content";

const RESOLVED_MODULE_ID = `\0${RECIPE_CONTENT_MODULE_ID}`;

export function isRecipeContentFile(file: string): boolean {
  return (
    path.dirname(path.resolve(file)) === path.resolve(DEFAULT_RECIPES_DIR) &&
    path.extname(file).toLowerCase() === ".md"
  );
}

export function formatIngredient(ingredient: RecipeIngredient): string {
  return [ingredient.quantity, ingredient.unit, ingredient.name]
    .filter((part) => part !== undefined)
    .join(" ");
}

export function toClientRecipe(recipe: ContentRecipe): ClientRecipe {
  return {
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    language: recipe.language,
    image: recipe.image.path,
    imageAlt: recipe.image.alt,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    cuisine: recipe.cuisine,
    tags: recipe.tags,
    ingredients: recipe.ingredients.map(formatIngredient),
    instructionsHtml: recipe.html,
  };
}

export function resolveRecipeModuleId(id: string): string | undefined {
  return id === RECIPE_CONTENT_MODULE_ID ? RESOLVED_MODULE_ID : undefined;
}

export function loadRecipeModule(id: string): string | undefined {
  if (id !== RESOLVED_MODULE_ID) {
    return undefined;
  }
  const recipes = loadRecipes().map(toClientRecipe);
  const imports = recipes.map(
    (recipe, index) => `import img${index} from ${JSON.stringify(`/recipes/${recipe.image}`)};`,
  );
  const entries = recipes.map((recipe, index) => {
    const { image: _image, ...rest } = recipe;
    return `{ ...${JSON.stringify(rest)}, image: img${index} }`;
  });
  return `${imports.join("\n")}\nexport const recipes = [${entries.join(",")}];`;
}

export function recipeContentPlugin(): Plugin {
  return {
    name: "miam-recipe-content",
    resolveId: resolveRecipeModuleId,
    load: loadRecipeModule,
    configureServer(server) {
      server.watcher.add(DEFAULT_RECIPES_DIR);
      const refreshRecipes = (file: string): void => {
        if (!isRecipeContentFile(file)) {
          return;
        }
        const recipeModule = server.moduleGraph.getModuleById(RESOLVED_MODULE_ID);
        if (recipeModule) {
          server.moduleGraph.invalidateModule(recipeModule);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refreshRecipes);
      server.watcher.on("unlink", refreshRecipes);
    },
    handleHotUpdate({ file, server }) {
      if (!isRecipeContentFile(file)) {
        return;
      }

      const recipeModule = server.moduleGraph.getModuleById(RESOLVED_MODULE_ID);
      if (recipeModule) {
        server.moduleGraph.invalidateModule(recipeModule);
      }
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}
