import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/utils';

export interface DurationInputProps {
  value: number | undefined;
  onChange: (hours: number | undefined) => void;
  label?: string;
  placeholder?: string;
}

type DurationUnit = 'hrs' | 'days';

export function DurationInput({ value, onChange, label, placeholder }: DurationInputProps) {
  const [unit, setUnit] = useState<DurationUnit>('hrs');

  // When external value changes, pick the best default unit
  useEffect(() => {
    if (value !== undefined && value > 0 && value % 24 === 0 && value >= 24) {
      setUnit('days');
    }
  }, []); // only on mount — don't fight the user's toggle

  const displayValue = useMemo(() => {
    if (value === undefined) return '';
    return unit === 'days' ? value / 24 : value;
  }, [value, unit]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        onChange(undefined);
        return;
      }
      const num = parseFloat(raw);
      if (Number.isNaN(num) || num < 0) return;
      onChange(unit === 'days' ? num * 24 : num);
    },
    [onChange, unit],
  );

  const switchUnit = useCallback(
    (newUnit: DurationUnit) => {
      setUnit(newUnit);
    },
    [],
  );

  const inputId = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="number"
          min={0}
          step="any"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono',
            'focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30',
          )}
        />
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => switchUnit('hrs')}
            className={cn(
              'px-2.5 py-2 text-xs font-medium transition-colors',
              unit === 'hrs'
                ? 'bg-[#8b4513] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            hrs
          </button>
          <button
            type="button"
            onClick={() => switchUnit('days')}
            className={cn(
              'px-2.5 py-2 text-xs font-medium transition-colors',
              unit === 'days'
                ? 'bg-[#8b4513] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            days
          </button>
        </div>
      </div>
    </div>
  );
}
