export const supportedLocales = ["en", "fr"] as const;
export type Locale = (typeof supportedLocales)[number];

const STORAGE_KEY = "miam:locale";

const messages = {
  en: {
    brandTagline: "My Intelligent Assistant for Meals",
    catalogEyebrow: "The family pantry",
    catalogTitle: "Recipes worth making again.",
    catalogIntro: "Reliable favourites, kept together and easy to find.",
    searchLabel: "Search recipes",
    searchPlaceholder: "Name, ingredient, or tag",
    clearSearch: "Clear search",
    resultCount: "{count} recipes",
    resultCountOne: "1 recipe",
    resultCountZero: "0 recipes",
    noResultsTitle: "Nothing in this cupboard.",
    noResultsBody: "Try another recipe name, ingredient, or tag.",
    languageLabel: "Language",
    english: "English",
    french: "Français",
    openRecipe: "Open {title}",
    prepTime: "Prep",
    cookTime: "Cook",
    totalTime: "Total",
    servings: "Serves",
    ingredients: "Ingredients",
    instructions: "Method",
    backToRecipes: "All recipes",
    recipeLanguage: "Recipe language",
    notFoundTitle: "Recipe not found",
    notFoundBody: "This recipe may have moved or is not in the family collection.",
    footerBuiltFrom: "Built from",
    footerDeployed: "deployed {date}",
    footerDevelopment: "local development",
    sourceCode: "GitHub repository",
    skipToContent: "Skip to recipes",
  },
  fr: {
    brandTagline: "Mon assistant intelligent pour les repas",
    catalogEyebrow: "Le garde-manger familial",
    catalogTitle: "Des recettes à refaire encore.",
    catalogIntro: "Les recettes préférées, réunies et faciles à retrouver.",
    searchLabel: "Rechercher des recettes",
    searchPlaceholder: "Nom, ingrédient ou étiquette",
    clearSearch: "Effacer la recherche",
    resultCount: "{count} recettes",
    resultCountOne: "1 recette",
    resultCountZero: "0 recette",
    noResultsTitle: "Rien dans ce placard.",
    noResultsBody: "Essayez un autre nom, ingrédient ou une autre étiquette.",
    languageLabel: "Langue",
    english: "English",
    french: "Français",
    openRecipe: "Ouvrir {title}",
    prepTime: "Prépa",
    cookTime: "Cuisson",
    totalTime: "Total",
    servings: "Portions",
    ingredients: "Ingrédients",
    instructions: "Préparation",
    backToRecipes: "Toutes les recettes",
    recipeLanguage: "Langue de la recette",
    notFoundTitle: "Recette introuvable",
    notFoundBody: "Cette recette a peut-être été déplacée ou retirée de la collection.",
    footerBuiltFrom: "Version",
    footerDeployed: "déployée le {date}",
    footerDevelopment: "développement local",
    sourceCode: "Dépôt GitHub",
    skipToContent: "Aller aux recettes",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}

function baseLocale(language: string): string {
  return language.trim().toLowerCase().split("-")[0] ?? "";
}

export function detectLocale(
  languages: readonly string[] = globalThis.navigator?.languages ?? [],
): Locale {
  for (const language of languages) {
    const candidate = baseLocale(language);
    if (isLocale(candidate)) {
      return candidate;
    }
  }
  return "en";
}

export function loadLocale(
  storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage,
  languages?: readonly string[],
): Locale {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (isLocale(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn("Miam could not read the saved language preference.", error);
  }
  return detectLocale(languages);
}

export function saveLocale(
  locale: Locale,
  storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(STORAGE_KEY, locale);
  } catch (error) {
    console.warn("Miam could not persist the language preference.", error);
  }
}

export function translate(
  locale: Locale,
  key: MessageKey,
  parameters: Readonly<Record<string, string | number>> = {},
): string {
  let result: string = messages[locale][key] ?? messages.en[key];
  for (const [name, value] of Object.entries(parameters)) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
}
