import type { RecipeIngredient } from "../types/recipe";

/** Rounds a quantity to at most 2 decimals and trims trailing zeros. */
export function formatQuantity(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString();
}

/** Scales a base quantity by a factor, guarding against invalid factors. */
export function scaleQuantity(quantity: number, factor: number): number {
  return quantity * (Number.isFinite(factor) && factor > 0 ? factor : 1);
}

/**
 * Formats an ingredient for display, scaling its quantity by `factor`. The unit
 * and name are never scaled, and ingredients without a quantity are shown as-is.
 */
export function formatIngredient(ingredient: RecipeIngredient, factor = 1): string {
  const quantity =
    ingredient.quantity === undefined
      ? undefined
      : formatQuantity(scaleQuantity(ingredient.quantity, factor));
  return [quantity, ingredient.unit, ingredient.name]
    .filter((part) => part !== undefined)
    .join(" ");
}
