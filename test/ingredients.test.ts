import { describe, expect, it } from "vitest";
import { formatIngredient, formatQuantity, scaleQuantity } from "../src/lib/ingredients";

describe("formatQuantity", () => {
  it("rounds to at most 2 decimals and trims trailing zeros", () => {
    expect(formatQuantity(2)).toBe("2");
    expect(formatQuantity(2.5)).toBe("2.5");
    expect(formatQuantity(187.5)).toBe("187.5");
    expect(formatQuantity(1.333333)).toBe("1.33");
    expect(formatQuantity(2.001)).toBe("2");
  });
});

describe("scaleQuantity", () => {
  it("scales by a valid factor and ignores invalid factors", () => {
    expect(scaleQuantity(250, 1.5)).toBe(375);
    expect(scaleQuantity(4, 0)).toBe(4);
    expect(scaleQuantity(4, Number.NaN)).toBe(4);
    expect(scaleQuantity(4, -2)).toBe(4);
  });
});

describe("formatIngredient", () => {
  it("scales the quantity but not the unit or name", () => {
    expect(formatIngredient({ name: "flour", quantity: 250, unit: "g" }, 1.5)).toBe("375 g flour");
    expect(formatIngredient({ name: "egg", quantity: 2 }, 1.5)).toBe("3 egg");
  });

  it("leaves ingredients without a quantity unchanged", () => {
    expect(formatIngredient({ name: "salt" }, 3)).toBe("salt");
    expect(formatIngredient({ name: "pepper", unit: "pinch" }, 3)).toBe("pinch pepper");
  });

  it("defaults to a factor of 1", () => {
    expect(formatIngredient({ name: "milk", quantity: 300, unit: "ml" })).toBe("300 ml milk");
  });
});
