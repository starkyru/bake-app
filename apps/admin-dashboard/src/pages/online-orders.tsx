import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Check, X, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminOnlineOrders,
  useApproveOrder,
  useRejectOrder,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  StatusBadge,
  CurrencyDisplay,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]['id'];

export function OnlineOrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const { data: orders, isLoading } = useAdminOnlineOrders({
    status: activeTab === 'all' ? undefined : activeTab,
  }) as { data: any[]; isLoading: boolean };
  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleApprove = async (orderId: string) => {
    try {
      await approveOrder.mutateAsync(orderId);
      toast.success('Order approved');
    } catch {
      toast.error('Failed to approve order');
    }
  };

  const handleReject = async (orderId: string) => {
    const confirmed = await confirm(
      'Reject Order',
      'Are you sure you want to reject this order? The customer will be notified.',
      { variant: 'danger', confirmText: 'Reject' },
    );
    if (!confirmed) return;
    try {
      await rejectOrder.mutateAsync({ id: orderId });
      toast.success('Order rejected');
    } catch {
      toast.error('Failed to reject order');
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm font-medium text-[#3e2723]">{value}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (_: unknown, row: any) => (
        <span className="text-sm text-[#3e2723]">
          {row.customer?.name || row.customerName || 'Guest'}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (_: unknown, row: any) => (
        <span className="text-sm text-gray-500">{row.location?.name || '\u2014'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} size="sm" />,
    },
    {
      key: 'fulfillmentType',
      label: 'Fulfillment',
      render: (value: string) => (
        <span className="text-sm capitalize text-gray-600">
          {value?.replace(/_/g, ' ') || '\u2014'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      sortable: true,
      render: (value: number) => <CurrencyDisplay amount={value} size="sm" />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sortable: false,
      width: '140px',
      actions: [
        {
          action: 'view',
          icon: <Eye size={16} />,
          tooltip: 'View details',
          onClick: (row: any) => navigate(`/online-orders/${row.id}`),
        },
        {
          action: 'approve',
          icon: <Check size={16} />,
          tooltip: 'Approve',
          color: 'text-green-500 hover:text-green-700',
          onClick: (row: any) => {
            if (row.status === 'pending_approval') handleApprove(row.id);
          },
        },
        {
          action: 'reject',
          icon: <X size={16} />,
          tooltip: 'Reject',
          color: 'text-red-400 hover:text-red-600',
          onClick: (row: any) => {
            if (row.status === 'pending_approval') handleReject(row.id);
          },
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Online Orders"
      subtitle="Manage orders placed through online channels"
      actions={
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-[#8b4513]" />
        </div>
      }
    >
      {/* Status Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-white p-1 shadow-sm border border-[#8b4513]/10">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#8b4513] text-white shadow-sm'
                : 'text-[#5d4037] hover:bg-[#faf3e8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading online orders..." />
      ) : (
        <DataTable
          columns={columns}
          data={orders ?? []}
          searchable
          searchPlaceholder="Search orders..."
          onRowClick={(row: any) => navigate(`/online-orders/${row.id}`)}
        />
      )}

      {ConfirmationDialog}
    </PageContainer>
  );
}
