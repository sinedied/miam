import { defineConfig } from "vitest/config";
import { recipeContentPlugin } from "./build/recipe-plugin";

export default defineConfig({
  plugins: [recipeContentPlugin()],
  define: {
    __MIAM_BUILD__: JSON.stringify({
      commit: "test123",
      deployedAt: "2026-07-13T18:00:00.000Z",
      repositoryUrl: "https://github.com/example/miam",
    }),
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
    restoreMocks: true,
  },
});
