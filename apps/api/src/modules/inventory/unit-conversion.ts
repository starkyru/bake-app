/**
 * Predefined unit groups: ingredient base unit → allowed package units
 */
export const UNIT_GROUPS: Record<string, string[]> = {
  g: ['g', 'kg', 'lb', 'oz'],
  ml: ['ml', 'L', 'fl oz'],
  pcs: ['pcs'],
  tbsp: ['tbsp', 'ml'],
  tsp: ['tsp', 'ml'],
};

/**
 * Conversion factors to the ingredient's base unit.
 * Weight → g, Volume → ml, Count → pcs, Spoon → ml
 */
export const CONVERSION_FACTORS: Record<string, number> = {
  // Weight → g
  g: 1,
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
  // Volume → ml
  ml: 1,
  L: 1000,
  'fl oz': 29.5735,
  // Count
  pcs: 1,
  // Spoon → ml
  tbsp: 15,
  tsp: 5,
};

/**
 * Convert a value from one unit to the ingredient's base unit.
 */
export function convertToBaseUnit(
  value: number,
  fromUnit: string,
  ingredientUnit: string,
): number {
  const factor = CONVERSION_FACTORS[fromUnit];
  if (!factor) return value;

  // If the ingredient unit matches the fromUnit, no conversion needed
  if (fromUnit === ingredientUnit) return value;

  // Convert fromUnit to its base, then see if base matches ingredientUnit
  const baseValue = value * factor;

  // If ingredient unit is the base unit for this group, return directly
  const ingredientFactor = CONVERSION_FACTORS[ingredientUnit];
  if (!ingredientFactor) return baseValue;

  // Convert: fromUnit → base → ingredientUnit
  return baseValue / ingredientFactor;
}

/**
 * Get metric equivalent for non-metric units.
 * Returns null if the unit is already metric.
 */
export function getMetricEquivalent(
  value: number,
  unit: string,
): { value: number; unit: string } | null {
  switch (unit) {
    case 'lb':
      return { value: Math.round(value * 453.592 * 100) / 100, unit: 'g' };
    case 'oz':
      return { value: Math.round(value * 28.3495 * 100) / 100, unit: 'g' };
    case 'fl oz':
      return { value: Math.round(value * 29.5735 * 100) / 100, unit: 'ml' };
    default:
      return null;
  }
}
