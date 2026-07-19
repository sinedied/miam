export type RecipeLanguage = "en" | "fr";

export interface RecipeIngredient {
  readonly name: string;
  readonly quantity?: number;
  readonly unit?: string;
}

export interface Recipe {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly language?: RecipeLanguage;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly prepTime: number;
  readonly cookTime?: number;
  readonly cookTimeLabel?: string;
  readonly servings: number;
  readonly cuisine: string;
  readonly tags: readonly string[];
  readonly ingredients: readonly RecipeIngredient[];
  readonly instructionsHtml: string;
}
