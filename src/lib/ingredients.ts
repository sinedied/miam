import type { RecipeIngredient } from "../types/recipe";

/** Quantities at or above this value are shown as decimals, not fractions. */
const MAX_FRACTION_VALUE = 10;

/** Denominators considered when rendering a quantity as a nice fraction. */
const FRACTION_DENOMINATORS = [2, 3, 4, 6, 8];

/**
 * Tolerance for matching a fractional remainder to a nice fraction. Loose enough to
 * catch 2-decimal authored values (e.g. 0.33 → 1/3) and scaled rationals, but well
 * below the ~0.04 gap between adjacent target fractions to avoid false matches.
 */
const FRACTION_TOLERANCE = 0.01;

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/** Renders the fractional remainder `frac` (0..1) as a reduced "n/d", or null. */
function toFraction(frac: number): string | null {
  for (const denominator of FRACTION_DENOMINATORS) {
    const numerator = Math.round(frac * denominator);
    if (numerator <= 0 || numerator >= denominator) {
      continue;
    }
    if (Math.abs(frac - numerator / denominator) <= FRACTION_TOLERANCE) {
      const divisor = greatestCommonDivisor(numerator, denominator);
      return `${numerator / divisor}/${denominator / divisor}`;
    }
  }
  return null;
}

/**
 * Formats a quantity for display. Small values (< 10) render as nice fractions when
 * possible (e.g. `1/2`, `1 1/3`); otherwise the value is rounded to at most 2 decimals
 * with trailing zeros trimmed.
 */
export function formatQuantity(value: number): string {
  const decimal = Number.parseFloat(value.toFixed(2)).toString();
  if (!Number.isFinite(value) || value <= 0 || value >= MAX_FRACTION_VALUE) {
    return decimal;
  }

  const whole = Math.floor(value);
  const fraction = toFraction(value - whole);
  if (!fraction) {
    return decimal;
  }
  return whole > 0 ? `${whole} ${fraction}` : fraction;
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
