import { defineConfig } from "vite";
import { recipeContentPlugin } from "./build/recipe-plugin";

function optionalEnvironmentValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export default defineConfig({
  base: process.env.BASE_PATH?.trim() || "/",
  plugins: [recipeContentPlugin()],
  build: {
    // Emit recipe images as separately-cacheable hashed files instead of inlining them.
    assetsInlineLimit: 0,
  },
  define: {
    __MIAM_BUILD__: JSON.stringify({
      commit: optionalEnvironmentValue("VITE_COMMIT_SHA") ?? "dev",
      deployedAt: optionalEnvironmentValue("VITE_DEPLOYED_AT"),
      repositoryUrl: optionalEnvironmentValue("VITE_REPOSITORY_URL"),
    }),
  },
});
