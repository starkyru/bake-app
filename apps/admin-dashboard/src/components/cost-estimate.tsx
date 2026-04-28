import type { RecipeCostResult } from '@bake-app/react/api-client';

const WEIGHT_UNITS = new Set(['g', 'kg', 'lb', 'oz']);
const VOLUME_UNITS = new Set(['ml', 'L', 'tbsp', 'tsp']);

const TO_GRAMS: Record<string, number> = { g: 1, kg: 1000, lb: 453.592, oz: 28.3495 };
const TO_ML: Record<string, number> = { ml: 1, L: 1000, tbsp: 14.787, tsp: 4.929 };

function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${Math.round(grams)} g`;
}

function formatVolume(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(2)} L`;
  return `${Math.round(ml)} ml`;
}

export interface SubRecipeCostLine {
  subRecipeId?: string;
  subRecipeName: string;
  quantity: number;
  unit: string;
  costPerYield?: number;
  lineCost: number;
}

interface CostEstimateProps {
  recipeCost: RecipeCostResult;
  scaleFactor?: number;
  title?: string;
  subRecipeCosts?: SubRecipeCostLine[];
  grandTotal?: number;
}

export function CostEstimate({
  recipeCost,
  scaleFactor = 1,
  title = 'Batch Cost Estimate',
  subRecipeCosts,
  grandTotal,
}: CostEstimateProps) {
  if (!recipeCost.ingredients.length && (!subRecipeCosts || !subRecipeCosts.length)) return null;

  let totalGrams = 0;
  let totalMl = 0;
  let totalPcs = 0;

  for (const line of recipeCost.ingredients) {
    const qty = line.quantity * scaleFactor;
    if (WEIGHT_UNITS.has(line.unit)) {
      totalGrams += qty * (TO_GRAMS[line.unit] || 0);
    } else if (VOLUME_UNITS.has(line.unit)) {
      totalMl += qty * (TO_ML[line.unit] || 0);
    } else if (line.unit === 'pcs') {
      totalPcs += qty;
    }
  }

  const ingredientsCost = recipeCost.ingredientsCost * scaleFactor;
  const scaledSubRecipeCost = subRecipeCosts
    ? subRecipeCosts.reduce((sum, sr) => sum + sr.lineCost * scaleFactor, 0)
    : 0;
  const totalCost = grandTotal != null ? grandTotal * scaleFactor : ingredientsCost;
  const hasSubRecipes = subRecipeCosts && subRecipeCosts.length > 0;

  const weightParts: string[] = [];
  if (totalGrams > 0) weightParts.push(formatWeight(totalGrams));
  if (totalMl > 0) weightParts.push(formatVolume(totalMl));
  if (totalPcs > 0) weightParts.push(`${Math.round(totalPcs)} pcs`);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4" data-print-section="ingredients">
      <h4 className="mb-2 text-sm font-medium text-[#5d4037]">
        {title}
        <span className="ml-2 text-xs font-normal text-gray-400">
          based on current inventory (FIFO)
        </span>
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400">
            <th className="pb-1 text-left font-medium">Ingredient</th>
            <th className="pb-1 text-right font-medium">Quantity</th>
            <th className="pb-1 text-right font-medium">Unit Cost</th>
            <th className="pb-1 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {recipeCost.ingredients.map((line, i) => (
            <tr key={i} className="text-gray-600">
              <td className="py-0.5">
                {line.ingredientName}
                {line.note && <span className="ml-1 text-xs text-gray-400">({line.note})</span>}
              </td>
              <td className="py-0.5 text-right font-mono text-xs">
                {Math.round(line.quantity * scaleFactor * 100) / 100} {line.unit}
              </td>
              <td className="py-0.5 text-right font-mono text-xs">
                ${line.costPerUnit.toFixed(2)}/{line.unit}
              </td>
              <td className="py-0.5 text-right font-mono">
                ${(line.lineCost * scaleFactor).toFixed(2)}
              </td>
            </tr>
          ))}
          {hasSubRecipes && (
            <>
              <tr>
                <td colSpan={4} className="pb-0.5 pt-3">
                  <span className="text-xs font-medium text-purple-700">Sub-recipes</span>
                </td>
              </tr>
              {subRecipeCosts.map((sr, i) => (
                <tr key={`sr-${i}`} className="text-gray-600">
                  <td className="py-0.5">
                    <span className="text-purple-700">{sr.subRecipeName}</span>
                  </td>
                  <td className="py-0.5 text-right font-mono text-xs">
                    {Math.round(sr.quantity * scaleFactor * 100) / 100} {sr.unit}
                  </td>
                  <td className="py-0.5 text-right font-mono text-xs">
                    {sr.costPerYield != null ? `$${sr.costPerYield.toFixed(2)}/${sr.unit}` : '—'}
                  </td>
                  <td className="py-0.5 text-right font-mono">
                    ${(sr.lineCost * scaleFactor).toFixed(2)}
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
        <tfoot>
          {weightParts.length > 0 && (
            <tr className="border-t border-amber-200 text-xs text-gray-500">
              <td className="pt-1">Total weight</td>
              <td className="pt-1 text-right font-mono" colSpan={3}>
                {weightParts.join(' + ')}
              </td>
            </tr>
          )}
          {hasSubRecipes && (
            <>
              <tr className="border-t border-amber-200 text-xs text-gray-500">
                <td className="pt-1" colSpan={3}>Ingredients cost</td>
                <td className="pt-1 text-right font-mono">${ingredientsCost.toFixed(2)}</td>
              </tr>
              <tr className="text-xs text-gray-500">
                <td colSpan={3}>Sub-recipes cost</td>
                <td className="text-right font-mono">${scaledSubRecipeCost.toFixed(2)}</td>
              </tr>
            </>
          )}
          <tr className="border-t border-amber-300 font-medium text-[#3e2723]">
            <td className="pt-1" colSpan={3}>
              {hasSubRecipes ? 'Total cost' : 'Total ingredients cost'}
            </td>
            <td className="pt-1 text-right font-mono">${totalCost.toFixed(2)}</td>
          </tr>
          {recipeCost.yieldQuantity > 0 && (
            <tr className="text-xs text-gray-500">
              <td colSpan={3}>
                Per unit ({Math.round(recipeCost.yieldQuantity * scaleFactor * 100) / 100} {recipeCost.yieldUnit})
              </td>
              <td className="text-right font-mono">
                ${(totalCost / (recipeCost.yieldQuantity * scaleFactor)).toFixed(2)}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}
