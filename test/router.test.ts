import { describe, expect, it } from "vitest";
import { catalogHref, parseRoute, parseSearchQuery, recipeHref } from "../src/lib/router";

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

  it("parses the search query from the hash", () => {
    expect(parseSearchQuery("#/")).toBe("");
    expect(parseSearchQuery("")).toBe("");
    expect(parseSearchQuery("#/?q=kinder")).toBe("kinder");
    expect(parseSearchQuery("#/?q=tomato%20soup")).toBe("tomato soup");
    expect(parseSearchQuery("#/?other=1")).toBe("");
    expect(parseSearchQuery("#/?q=a%2Bb")).toBe("a+b");
  });

  it("builds the catalog hash for a query and round-trips", () => {
    expect(catalogHref("")).toBe("#/");
    expect(catalogHref("   ")).toBe("#/");
    expect(catalogHref("kinder")).toBe("#/?q=kinder");
    expect(catalogHref("tomato soup")).toBe("#/?q=tomato%20soup");
    for (const query of ["kinder", "tomato soup", "a+b", "crème brûlée"]) {
      expect(parseSearchQuery(catalogHref(query))).toBe(query);
    }
  });
});
