import type { Recipe } from "../types/recipe";

export function normalizeSearchTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function searchRecipes(recipes: readonly Recipe[], query: string): readonly Recipe[] {
  const terms = normalizeSearchTerm(query).split(" ").filter(Boolean);
  if (terms.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const searchable = normalizeSearchTerm(
      [recipe.title, ...recipe.ingredients, ...recipe.tags].join(" "),
    );
    return terms.every((term) => searchable.includes(term));
  });
}
