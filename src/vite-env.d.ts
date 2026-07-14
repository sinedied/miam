/// <reference types="vite/client" />

declare module "virtual:recipes" {
  import type { Recipe } from "./types/recipe";

  export const recipes: readonly Recipe[];
}

declare const __MIAM_BUILD__: {
  readonly commit: string;
  readonly deployedAt: string | null;
  readonly repositoryUrl: string | null;
};
