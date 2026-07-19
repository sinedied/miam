import { describe, expect, it } from "vitest";
import { formatIngredient, formatQuantity, scaleQuantity } from "../src/lib/ingredients";

describe("formatQuantity", () => {
  it("rounds to at most 2 decimals and trims trailing zeros for large values", () => {
    expect(formatQuantity(2)).toBe("2");
    expect(formatQuantity(187.5)).toBe("187.5");
    expect(formatQuantity(12.5)).toBe("12.5");
    expect(formatQuantity(83.333333)).toBe("83.33");
    expect(formatQuantity(2.001)).toBe("2");
    expect(formatQuantity(0)).toBe("0");
  });

  it("renders small values as nice fractions", () => {
    expect(formatQuantity(0.5)).toBe("1/2");
    expect(formatQuantity(0.25)).toBe("1/4");
    expect(formatQuantity(0.75)).toBe("3/4");
    expect(formatQuantity(2 / 3)).toBe("2/3");
    expect(formatQuantity(1 / 3)).toBe("1/3");
    expect(formatQuantity(0.125)).toBe("1/8");
    expect(formatQuantity(2.5)).toBe("2 1/2");
    expect(formatQuantity(1.333333)).toBe("1 1/3");
    expect(formatQuantity(9.75)).toBe("9 3/4");
  });

  it("matches 2-decimal authored fractions (e.g. 0.33, 0.67)", () => {
    expect(formatQuantity(0.33)).toBe("1/3");
    expect(formatQuantity(0.67)).toBe("2/3");
    expect(formatQuantity(0.17)).toBe("1/6");
  });

  it("falls back to decimals when no nice fraction fits", () => {
    expect(formatQuantity(0.1)).toBe("0.1");
    expect(formatQuantity(1.1)).toBe("1.1");
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

  it("renders scaled small quantities as fractions", () => {
    expect(formatIngredient({ name: "crust", quantity: 1 }, 1.5)).toBe("1 1/2 crust");
    expect(formatIngredient({ name: "cup flour", quantity: 1 }, 0.5)).toBe("1/2 cup flour");
  });

  it("leaves ingredients without a quantity unchanged", () => {
    expect(formatIngredient({ name: "salt" }, 3)).toBe("salt");
    expect(formatIngredient({ name: "pepper", unit: "pinch" }, 3)).toBe("pinch pepper");
  });

  it("defaults to a factor of 1", () => {
    expect(formatIngredient({ name: "milk", quantity: 300, unit: "ml" })).toBe("300 ml milk");
  });
});
