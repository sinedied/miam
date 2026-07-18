export const supportedLocales = ["en", "fr"] as const;
export type Locale = (typeof supportedLocales)[number];

const STORAGE_KEY = "miam:locale";

const messages = {
  en: {
    recipesHeading: "Recipes",
    searchLabel: "Search recipes",
    searchPlaceholder: "Name, ingredient, or tag",
    clearSearch: "Clear search",
    resultCount: "{count} recipes",
    resultCountOne: "1 recipe",
    resultCountZero: "0 recipes",
    noResultsTitle: "Nothing in this cupboard.",
    noResultsBody: "Try another recipe name, ingredient, or tag.",
    languageLabel: "Language",
    settings: "Settings",
    appearance: "Appearance",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    english: "English",
    french: "Français",
    openRecipe: "Open {title}",
    prepTime: "Prep",
    cookTime: "Cook",
    totalTime: "Total",
    servings: "Serves",
    decreaseServings: "Decrease servings",
    increaseServings: "Increase servings",
    ingredients: "Ingredients",
    instructions: "Method",
    backToRecipes: "All recipes",
    notFoundTitle: "Recipe not found",
    notFoundBody: "This recipe may have moved or is not in the family collection.",
    sourceCode: "GitHub repository",
    skipToContent: "Skip to recipes",
  },
  fr: {
    recipesHeading: "Recettes",
    searchLabel: "Rechercher des recettes",
    searchPlaceholder: "Nom, ingrédient ou étiquette",
    clearSearch: "Effacer la recherche",
    resultCount: "{count} recettes",
    resultCountOne: "1 recette",
    resultCountZero: "0 recette",
    noResultsTitle: "Rien dans ce placard.",
    noResultsBody: "Essayez un autre nom, ingrédient ou une autre étiquette.",
    languageLabel: "Langue",
    settings: "Paramètres",
    appearance: "Apparence",
    themeSystem: "Système",
    themeLight: "Clair",
    themeDark: "Sombre",
    english: "English",
    french: "Français",
    openRecipe: "Ouvrir {title}",
    prepTime: "Prépa",
    cookTime: "Cuisson",
    totalTime: "Total",
    servings: "Portions",
    decreaseServings: "Réduire les portions",
    increaseServings: "Augmenter les portions",
    ingredients: "Ingrédients",
    instructions: "Préparation",
    backToRecipes: "Toutes les recettes",
    notFoundTitle: "Recette introuvable",
    notFoundBody: "Cette recette a peut-être été déplacée ou retirée de la collection.",
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
