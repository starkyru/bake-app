import { useMemo } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { StatsCard, StatusBadge } from '@bake-app/react/ui';
import { useSalesToday, useInventoryReport, useTopProducts } from '@bake-app/react/api-client';

export function DashboardPage() {
  const { data: salesToday, isLoading: salesLoading } = useSalesToday();
  const { data: inventoryReport, isLoading: inventoryLoading } = useInventoryReport();
  const { data: topProducts, isLoading: topLoading } = useTopProducts({ limit: 5 });

  const isLoading = salesLoading || inventoryLoading || topLoading;

  const salesData = salesToday as any;
  const inventoryData = inventoryReport as any;
  const topData = topProducts as any;

  const revenue = salesData?.totalRevenue ?? 0;
  const orderCount = salesData?.totalOrders ?? 0;
  const averageCheck = orderCount > 0 ? revenue / orderCount : 0;
  const profit = salesData?.profit ?? salesData?.totalRevenue ?? 0;

  // Extract low-stock items from inventory report
  const lowStockItems = useMemo<Array<{ id?: string; name: string; currentStock: number; minStock: number; status: string }>>(
    () =>
      (inventoryData?.lowStockItems ?? inventoryData?.items ?? [])
        .filter((item: any) => item.status === 'low_stock' || item.status === 'out_of_stock')
        .slice(0, 5),
    [inventoryData],
  );

  const topProductsList = useMemo<Array<{ name: string; quantitySold: number; revenue: number }>>(
    () => (Array.isArray(topData) ? topData.slice(0, 5) : []),
    [topData],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b4513]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#3e2723]">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Today's Revenue"
          value={`$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          title="Today's Orders"
          value={orderCount}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="success"
        />
        <StatsCard
          title="Average Check"
          value={`$${averageCheck.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Receipt className="h-5 w-5" />}
          color="warning"
        />
        <StatsCard
          title="Profit"
          value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="primary"
          trend={salesData?.profitTrend ? { value: salesData.profitTrend, label: 'vs yesterday' } : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-[#3e2723]">Low Stock Alerts</h2>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500">No low-stock items. Everything is well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {lowStockItems.map((item) => (
                <li
                  key={item.id ?? item.name}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#3e2723]">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Stock: {item.currentStock} / Min: {item.minStock}
                    </p>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#3e2723]">Top Products</h2>

          {topProductsList.length === 0 ? (
            <p className="text-sm text-gray-500">No sales data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProductsList.map((product, idx) => (
                <li
                  key={product.name}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#faf3e8] text-xs font-bold text-[#8b4513]">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-[#3e2723]">{product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-[#3e2723]">
                      ${product.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">{product.quantitySold} sold</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
