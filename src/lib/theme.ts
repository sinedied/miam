export const themePreferences = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof themePreferences)[number];

const STORAGE_KEY = "miam:theme";

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && themePreferences.includes(value as ThemePreference);
}

export function loadTheme(
  storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage,
): ThemePreference {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (isThemePreference(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn("Miam could not read the saved theme preference.", error);
  }
  return "system";
}

export function saveTheme(
  theme: ThemePreference,
  storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Miam could not persist the theme preference.", error);
  }
}

/**
 * Applies the theme preference to the document root. `system` removes the
 * override so the CSS `prefers-color-scheme` rules take effect; `light`/`dark`
 * force the theme via `data-theme`.
 */
export function applyTheme(
  theme: ThemePreference,
  root: HTMLElement | undefined = globalThis.document?.documentElement,
): void {
  if (!root) {
    return;
  }
  if (theme === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }
}

/** Theme-color values matching the light/dark canvas backgrounds in global.css. */
export const themeColors = { light: "#f6f3ee", dark: "#17130f" } as const;

/** Resolves a preference to the concrete `light`/`dark` theme actually in effect. */
export function resolveTheme(
  theme: ThemePreference,
  prefersDark: boolean = globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false,
): "light" | "dark" {
  if (theme === "system") {
    return prefersDark ? "dark" : "light";
  }
  return theme;
}
