export type RecipeLanguage = "en" | "fr";

export interface Recipe {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly language?: RecipeLanguage;
  readonly image: string;
  readonly imageAlt: string;
  readonly prepTime: number;
  readonly cookTime: number;
  readonly servings: number;
  readonly cuisine: string;
  readonly tags: readonly string[];
  readonly ingredients: readonly string[];
  readonly instructionsHtml: string;
}
