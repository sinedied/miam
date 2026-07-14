import MiniSearch from "minisearch";
import type { Recipe } from "../types/recipe";

interface SearchDocument {
  readonly id: string;
  readonly title: string;
  readonly ingredients: string;
  readonly tags: string;
}

interface SearchContext {
  readonly index: MiniSearch<SearchDocument>;
  readonly recipesBySlug: ReadonlyMap<string, Recipe>;
}

const searchContexts = new WeakMap<readonly Recipe[], SearchContext>();

export function normalizeSearchTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchContext(recipes: readonly Recipe[]): SearchContext {
  const existing = searchContexts.get(recipes);
  if (existing) {
    return existing;
  }

  const index = new MiniSearch<SearchDocument>({
    fields: ["title", "ingredients", "tags"],
    processTerm: normalizeSearchTerm,
  });
  index.addAll(
    recipes.map((recipe) => ({
      id: recipe.slug,
      title: recipe.title,
      ingredients: recipe.ingredients.join(" "),
      tags: recipe.tags.join(" "),
    })),
  );

  const context = {
    index,
    recipesBySlug: new Map(recipes.map((recipe) => [recipe.slug, recipe])),
  };
  searchContexts.set(recipes, context);
  return context;
}

export function searchRecipes(recipes: readonly Recipe[], query: string): readonly Recipe[] {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!/[\p{Letter}\p{Number}]/u.test(normalizedQuery)) {
    return recipes;
  }

  const { index, recipesBySlug } = getSearchContext(recipes);
  return index
    .search(query, {
      boost: { title: 3, tags: 2, ingredients: 1 },
      combineWith: "AND",
      fuzzy: 0.2,
      prefix: true,
    })
    .flatMap((result) => {
      const recipe = recipesBySlug.get(String(result.id));
      return recipe ? [recipe] : [];
    });
}
