import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useOrders } from '@bake-app/react/api-client';
import { DataTable, LoadingSpinner, type TableColumn } from '@bake-app/react/ui';

export function OrdersPage() {
  const navigate = useNavigate();
  const { data: ordersResponse, isLoading } = useOrders({ limit: 50 });

  const orders = ordersResponse ?? [];

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'completed' || o.status === 'confirmed').length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    return { total, completed, pending, cancelled };
  }, [orders]);

  const columns: TableColumn[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (value: string) => (
        <span className="font-mono font-semibold text-[#8b4513]">#{value}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      type: 'date',
      sortable: true,
    },
    {
      key: 'items',
      label: 'Items',
      render: (value: any[]) => (
        <span className="text-sm text-gray-700">{value?.length ?? 0} items</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf3e8]">
      {/* Header */}
      <div className="bg-white border-b border-[#8b4513]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="flex items-center justify-center h-9 w-9 rounded-lg
              bg-[#faf3e8] text-[#5d4037] border border-[#8b4513]/10
              hover:bg-[#f5e6d0] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[#8b4513]" size={24} />
            <h1 className="text-xl font-bold text-[#3e2723]">Order History</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats bar */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#8b4513]/10 shadow-sm">
            <ClipboardList size={16} className="text-[#8b4513]" />
            <span className="text-sm font-medium text-[#5d4037]">Total</span>
            <span className="font-bold text-[#3e2723] font-mono">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Completed</span>
            <span className="font-bold text-green-800 font-mono">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
            <Clock size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Pending</span>
            <span className="font-bold text-amber-800 font-mono">{stats.pending}</span>
          </div>
          {stats.cancelled > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-200 shadow-sm">
              <XCircle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Cancelled</span>
              <span className="font-bold text-red-800 font-mono">{stats.cancelled}</span>
            </div>
          )}
        </div>

        {/* Orders table */}
        {isLoading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
            searchable
            searchPlaceholder="Search orders..."
            pageSize={10}
          />
        )}
      </div>
    </div>
  );
}
