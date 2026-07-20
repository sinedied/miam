export const appearances = ["system", "light", "dark"] as const;
export type Appearance = (typeof appearances)[number];

export const palettes = ["terracotta", "ocean", "slate", "berry"] as const;
export type Palette = (typeof palettes)[number];

export type Mode = "light" | "dark";

const APPEARANCE_KEY = "miam:appearance";
const PALETTE_KEY = "miam:palette";
/** Legacy key that once stored the appearance (system/light/dark); read for migration. */
const LEGACY_KEY = "miam:theme";

function isAppearance(value: unknown): value is Appearance {
  return typeof value === "string" && appearances.includes(value as Appearance);
}

function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && palettes.includes(value as Palette);
}

export function loadAppearance(
  storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage,
): Appearance {
  try {
    const saved = storage?.getItem(APPEARANCE_KEY);
    if (isAppearance(saved)) {
      return saved;
    }
    // Migration: the legacy `miam:theme` key used to store the appearance.
    const legacy = storage?.getItem(LEGACY_KEY);
    if (isAppearance(legacy)) {
      return legacy;
    }
  } catch (error) {
    console.warn("Miam could not read the saved appearance preference.", error);
  }
  return "system";
}

export function saveAppearance(
  appearance: Appearance,
  storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(APPEARANCE_KEY, appearance);
  } catch (error) {
    console.warn("Miam could not persist the appearance preference.", error);
  }
}

export function loadPalette(
  storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage,
): Palette {
  try {
    const saved = storage?.getItem(PALETTE_KEY);
    if (isPalette(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn("Miam could not read the saved theme preference.", error);
  }
  return "terracotta";
}

export function savePalette(
  palette: Palette,
  storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(PALETTE_KEY, palette);
  } catch (error) {
    console.warn("Miam could not persist the theme preference.", error);
  }
}

/** Resolves an appearance preference to the concrete light/dark mode in effect. */
export function resolveMode(
  appearance: Appearance,
  prefersDark: boolean = globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false,
): Mode {
  if (appearance === "system") {
    return prefersDark ? "dark" : "light";
  }
  return appearance;
}

/**
 * Applies the palette and resolved mode to the document root via `data-theme`
 * (palette) and `data-mode` (light/dark), which the CSS custom properties key off.
 */
export function applyTheme(
  palette: Palette,
  mode: Mode,
  root: HTMLElement | undefined = globalThis.document?.documentElement,
): void {
  if (!root) {
    return;
  }
  root.dataset.theme = palette;
  root.dataset.mode = mode;
}

/** Meta theme-color (canvas) for each palette and mode, matching global.css. */
export const themeColors: Record<Palette, Record<Mode, string>> = {
  terracotta: { light: "#f6f3ee", dark: "#17130f" },
  ocean: { light: "#f7fafa", dark: "#0c151b" },
  slate: { light: "#f8f9fa", dark: "#121316" },
  berry: { light: "#faf6f8", dark: "#161016" },
};
