export interface CategoryFilterOption {
  value: string;
  label: string;
}

export interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: CategoryFilterOption[];
  placeholder?: string;
}

export function CategoryFilter({
  value,
  onChange,
  options,
  placeholder = 'All Categories',
}: CategoryFilterProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Clear
        </button>
      )}
    </div>
  );
}
