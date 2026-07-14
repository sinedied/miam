import { describe, expect, it } from "vitest";
import { assetUrl } from "../src/lib/assets";

describe("assetUrl", () => {
  it("joins root-relative assets to a Pages base path", () => {
    expect(assetUrl("/images/recipes/dish.svg", "/miam/")).toBe("/miam/images/recipes/dish.svg");
  });

  it("normalizes missing slashes", () => {
    expect(assetUrl("images/dish.svg", "/miam")).toBe("/miam/images/dish.svg");
  });
});
