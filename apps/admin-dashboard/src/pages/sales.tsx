import { useMemo, useState } from 'react';
import {
  ShoppingCart,
  ClipboardList,
  Receipt,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowDownUp,
} from 'lucide-react';
import {
  useSalesSummary,
  useTopProducts,
  useSalesByCategory,
  usePaymentMethods,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  StatsCard,
  DataTable,
  LoadingSpinner,
  CurrencyDisplay,
  type TableColumn,
} from '@bake-app/react/ui';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function SalesPage() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const { data: summary, isLoading: summaryLoading } =
    useSalesSummary(dateRange);
  const { data: topProducts, isLoading: productsLoading } =
    useTopProducts({ ...dateRange, limit: 20 });
  const { data: byCategory, isLoading: categoryLoading } =
    useSalesByCategory(dateRange);
  const { data: paymentMethods, isLoading: paymentsLoading } =
    usePaymentMethods(dateRange);

  const summaryData = (summary as any) ?? {};
  const topProductList = ((topProducts as any[]) ?? []).map(
    (p: any, idx: number) => ({ ...p, rank: idx + 1 }),
  );
  const categoryList = (byCategory as any[]) ?? [];
  const paymentList = (paymentMethods as any[]) ?? [];

  const totalSales = summaryData.totalSales ?? summaryData.totalRevenue ?? 0;
  const ordersCount = summaryData.ordersCount ?? summaryData.orderCount ?? 0;
  const avgCheck =
    ordersCount > 0 ? totalSales / ordersCount : 0;

  const topCategory = useMemo(() => {
    if (categoryList.length === 0) return 'N/A';
    const sorted = [...categoryList].sort(
      (a, b) => (b.revenue ?? b.total ?? 0) - (a.revenue ?? a.total ?? 0),
    );
    return sorted[0]?.category ?? sorted[0]?.name ?? 'N/A';
  }, [categoryList]);

  // Underperforming products (bottom of the list)
  const underperforming = useMemo(() => {
    if (topProductList.length <= 5) return [];
    return [...topProductList]
      .sort(
        (a, b) =>
          (a.revenue ?? a.total ?? 0) - (b.revenue ?? b.total ?? 0),
      )
      .slice(0, 5);
  }, [topProductList]);

  const topProductColumns: TableColumn[] = [
    {
      key: 'rank',
      label: '#',
      render: (value: any, row: any) => (
        <span className="font-mono text-sm font-bold text-[#8b4513]">
          {row.rank ?? '\u2014'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (value: string, row: any) => (
        <span className="font-medium text-[#3e2723]">
          {value ?? row.productName ?? 'Unknown'}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Qty Sold',
      type: 'number',
      sortable: true,
      render: (value: number, row: any) => (
        <span className="font-mono text-sm">
          {(value ?? row.quantitySold ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      type: 'currency',
      sortable: true,
      render: (value: number, row: any) => (
        <CurrencyDisplay amount={value ?? row.total ?? 0} size="sm" />
      ),
    },
  ];

  const isLoading =
    summaryLoading || productsLoading || categoryLoading || paymentsLoading;

  return (
    <PageContainer
      title="Sales Analytics"
      subtitle="Sales performance and product analytics"
    >
      {/* Date Range */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-gray-600">Period:</span>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: e.target.value })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: e.target.value })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
      </div>

      {isLoading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#8b4513]/10">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-[#8b4513]" />
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sales"
          value={`$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<ShoppingCart size={20} />}
          color="success"
        />
        <StatsCard
          title="Orders Count"
          value={ordersCount.toLocaleString()}
          icon={<ClipboardList size={20} />}
        />
        <StatsCard
          title="Average Check"
          value={`$${avgCheck.toFixed(2)}`}
          icon={<Receipt size={20} />}
          color="primary"
        />
        <StatsCard
          title="Top Category"
          value={topCategory}
          icon={<TrendingUp size={20} />}
          color="warning"
        />
      </div>

      {/* Top Products */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#3e2723]">
          Top Products
        </h3>
        {productsLoading ? (
          <LoadingSpinner message="Loading products..." />
        ) : (
          <DataTable
            columns={topProductColumns}
            data={topProductList}
            searchable
            searchPlaceholder="Search products..."
            pageSize={10}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Underperforming Products */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[#3e2723]">
            Underperforming Products
          </h3>
          {underperforming.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Not enough data to determine underperformers
            </p>
          ) : (
            <div className="space-y-3">
              {underperforming.map((product: any, idx: number) => (
                <div
                  key={product.id ?? idx}
                  className="flex items-center justify-between rounded-lg border border-red-50 bg-red-50/50 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {product.name ?? product.productName ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(product.quantity ?? product.quantitySold ?? 0).toLocaleString()}{' '}
                      sold
                    </p>
                  </div>
                  <CurrencyDisplay
                    amount={product.revenue ?? product.total ?? 0}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Category */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[#3e2723]">
            Sales by Category
          </h3>
          {categoryList.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No category data available
            </p>
          ) : (
            <div className="space-y-3">
              {categoryList.map((cat: any, idx: number) => {
                const catRevenue = cat.revenue ?? cat.total ?? 0;
                const pct =
                  totalSales > 0
                    ? ((catRevenue / totalSales) * 100).toFixed(1)
                    : '0';
                return (
                  <div key={cat.category ?? cat.name ?? idx}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-700">
                        {cat.category ?? cat.name ?? 'Other'}
                      </span>
                      <div className="flex items-center gap-2">
                        <CurrencyDisplay amount={catRevenue} size="sm" />
                        <span className="text-xs text-gray-400">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#8b4513] transition-all"
                        style={{
                          width: `${totalSales > 0 ? (catRevenue / totalSales) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[#3e2723]">
          Payment Methods
        </h3>
        {paymentList.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No payment data available
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paymentList.map((pm: any, idx: number) => {
              const method = pm.method ?? pm.paymentMethod ?? 'unknown';
              const amount = pm.total ?? pm.amount ?? 0;
              const count = pm.count ?? pm.orderCount ?? 0;
              const icon =
                method === 'cash' ? (
                  <Banknote size={20} />
                ) : method === 'card' ? (
                  <CreditCard size={20} />
                ) : (
                  <ArrowDownUp size={20} />
                );
              return (
                <div
                  key={method ?? idx}
                  className="flex items-center gap-4 rounded-xl border border-[#8b4513]/10 bg-[#faf3e8]/50 p-4"
                >
                  <div className="rounded-lg bg-[#8b4513]/10 p-2.5 text-[#8b4513]">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize text-gray-700">
                      {method}
                    </p>
                    <p className="font-mono text-lg font-bold text-[#3e2723]">
                      ${amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {count} transactions
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
