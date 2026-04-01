import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { StatusBadge } from './status-badge';
import { CurrencyDisplay } from './currency-display';
import { EmptyState } from './empty-state';

export interface TableAction {
  action: string;
  icon: React.ReactNode;
  color?: string;
  tooltip?: string;
  onClick: (row: any) => void;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'actions';
  width?: string;
  format?: string;
  actions?: TableAction[];
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: TableColumn[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
}

type SortDirection = 'asc' | 'desc';

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function renderCellValue(
  column: TableColumn,
  value: any,
  row: any,
): React.ReactNode {
  if (column.render) {
    return column.render(value, row);
  }

  if (value === null || value === undefined) {
    return <span className="text-gray-300">&mdash;</span>;
  }

  switch (column.type) {
    case 'currency':
      return <CurrencyDisplay amount={Number(value)} size="sm" />;

    case 'badge':
      return <StatusBadge status={String(value)} size="sm" />;

    case 'date': {
      const date = new Date(value);
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString()}
        </span>
      );
    }

    case 'number':
      return (
        <span className="font-mono text-sm text-[#3e2723]">
          {Number(value).toLocaleString()}
        </span>
      );

    case 'actions':
      return (
        <div className="flex items-center gap-1">
          {column.actions?.map((action) => (
            <button
              key={action.action}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(row);
              }}
              title={action.tooltip}
              className={cn(
                'rounded-lg p-1.5 transition-all duration-150 hover:bg-gray-100',
                action.color ?? 'text-gray-500 hover:text-[#3e2723]',
              )}
            >
              {action.icon}
            </button>
          ))}
        </div>
      );

    default:
      return <span className="text-sm text-gray-700">{String(value)}</span>;
  }
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize: initialPageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (col.type === 'actions') return false;
        const val = getNestedValue(row, col.key);
        return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
      }),
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let result = 0;
      if (col.type === 'number' || col.type === 'currency') {
        result = Number(aVal) - Number(bVal);
      } else if (col.type === 'date') {
        result = new Date(aVal).getTime() - new Date(bVal).getTime();
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === 'desc' ? -result : result;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Reset page on search / data change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-[#8b4513]" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-[#8b4513]" />
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#8b4513]/10 bg-white shadow-sm">
      {/* Search bar */}
      {searchable && (
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                'w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm',
                'placeholder:text-gray-400 focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30',
                'transition-all duration-150',
              )}
            />
          </div>
        </div>
      )}

      {/* Loading bar */}
      {loading && (
        <div className="h-1 w-full overflow-hidden bg-[#8b4513]/10">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-[#8b4513]" />
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]',
                    col.sortable !== false &&
                      col.type !== 'actions' &&
                      'cursor-pointer select-none hover:text-[#3e2723]',
                  )}
                  onClick={() => {
                    if (col.sortable !== false && col.type !== 'actions') {
                      handleSort(col.key);
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable !== false && col.type !== 'actions' && (
                      <SortIcon columnKey={col.key} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && !loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title="No results found"
                    message={
                      search
                        ? 'Try adjusting your search terms'
                        : 'No data available'
                    }
                  />
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr
                  key={(row as any).id ?? rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-gray-50 transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-[#faf3e8]/40',
                    rowIdx % 2 === 1 && 'bg-gray-50/30',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {renderCellValue(col, getNestedValue(row, col.key), row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-[#8b4513] focus:outline-none"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              {safePage * pageSize + 1}&ndash;
              {Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
              {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className={cn(
                  'rounded-lg p-1 transition-colors',
                  safePage === 0
                    ? 'text-gray-300'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-[#3e2723]',
                )}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className={cn(
                  'rounded-lg p-1 transition-colors',
                  safePage >= totalPages - 1
                    ? 'text-gray-300'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-[#3e2723]',
                )}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
