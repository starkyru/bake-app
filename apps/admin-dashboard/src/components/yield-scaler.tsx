import { useState } from 'react';

const SCALE_PRESETS = [0.5, 1, 2];
const YIELD_UNIT_OPTIONS = ['pcs', 'kg', 'g', 'L', 'ml', 'loaves', 'cakes', 'servings', 'batches'];

interface YieldScalerProps {
  yieldQuantity: number;
  yieldUnit: string;
  scaleFactor: number;
  onScaleChange: (factor: number) => void;
  onYieldUnitChange?: (unit: string) => void;
}

export function YieldScaler({
  yieldQuantity,
  yieldUnit,
  scaleFactor,
  onScaleChange,
  onYieldUnitChange,
}: YieldScalerProps) {
  const [customScale, setCustomScale] = useState('');

  const scaledQuantity = Math.round(yieldQuantity * scaleFactor * 100) / 100;

  const handlePreset = (factor: number) => {
    onScaleChange(factor);
    setCustomScale('');
  };

  const handleCustom = (value: string) => {
    setCustomScale(value);
    const num = parseFloat(value);
    if (num > 0) onScaleChange(num);
  };

  return (
    <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm" data-no-print>
      <div className="flex flex-wrap items-center gap-4">
        <div className="mr-4">
          <span className="text-sm font-medium text-[#5d4037]">Yield: </span>
          <span className="font-mono text-lg font-semibold text-[#3e2723]">
            {scaledQuantity}
          </span>
          {onYieldUnitChange ? (
            <select
              value={yieldUnit}
              onChange={(e) => onYieldUnitChange(e.target.value)}
              className="ml-1 rounded border border-gray-200 bg-transparent py-0.5 pl-1 pr-5 text-lg font-semibold text-[#3e2723] focus:border-[#8b4513] focus:outline-none"
            >
              {YIELD_UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          ) : (
            <span className="ml-1 text-lg font-semibold text-[#3e2723]">{yieldUnit}</span>
          )}
          {scaleFactor !== 1 && (
            <span className="ml-2 text-sm text-gray-400">({scaleFactor}x)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {SCALE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                scaleFactor === preset && !customScale
                  ? 'bg-[#8b4513] text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {preset}x
            </button>
          ))}
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={customScale}
            onChange={(e) => handleCustom(e.target.value)}
            placeholder="Custom"
            className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          />
        </div>
      </div>
    </div>
  );
}
