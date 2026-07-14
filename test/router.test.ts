import { describe, expect, it } from "vitest";
import { parseRoute, recipeHref } from "../src/lib/router";

describe("hash router", () => {
  it("parses recipe routes and decoded slugs", () => {
    expect(parseRoute("#/recipes/tarte%20fine")).toEqual({
      name: "recipe",
      slug: "tarte fine",
    });
    expect(parseRoute("#/recipes/tomato-tart/")).toEqual({
      name: "recipe",
      slug: "tomato-tart",
    });
  });

  it("routes unknown hashes to the catalog", () => {
    expect(parseRoute("")).toEqual({ name: "catalog" });
    expect(parseRoute("#/settings")).toEqual({ name: "catalog" });
  });

  it("preserves malformed encoded slugs instead of throwing", () => {
    expect(parseRoute("#/recipes/bad%slug")).toEqual({
      name: "recipe",
      slug: "bad%slug",
    });
  });

  it("builds encoded recipe links", () => {
    expect(recipeHref("tarte fine")).toBe("#/recipes/tarte%20fine");
  });
});
