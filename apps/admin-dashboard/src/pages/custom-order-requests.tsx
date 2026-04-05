import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Cake } from 'lucide-react';
import {
  useCustomOrderRequests,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  StatusBadge,
  CurrencyDisplay,
  type TableColumn,
} from '@bake-app/react/ui';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'approved', label: 'Approved' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]['id'];

export function CustomOrderRequestsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const { data: requests, isLoading } = useCustomOrderRequests({
    status: activeTab === 'all' ? undefined : activeTab,
  });

  const columns: TableColumn[] = [
    {
      key: 'customer',
      label: 'Customer',
      render: (_: unknown, row: any) => (
        <span className="text-sm font-medium text-[#3e2723]">
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
      key: 'occasion',
      label: 'Occasion',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm capitalize text-[#3e2723]">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} size="sm" />,
    },
    {
      key: 'requestedDate',
      label: 'Requested Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
    {
      key: 'quotedPrice',
      label: 'Quoted Price',
      sortable: true,
      render: (value: number) =>
        value != null ? (
          <CurrencyDisplay amount={value} size="sm" />
        ) : (
          <span className="text-sm text-gray-400">\u2014</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sortable: false,
      width: '80px',
      actions: [
        {
          action: 'view',
          icon: <Eye size={16} />,
          tooltip: 'View details',
          onClick: (row: any) => navigate(`/custom-requests/${row.id}`),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Custom Order Requests"
      subtitle="Manage special and custom order requests"
      actions={
        <div className="flex items-center gap-2">
          <Cake size={20} className="text-[#8b4513]" />
        </div>
      }
    >
      {/* Status Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-white p-1 shadow-sm border border-[#8b4513]/10">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
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
        <LoadingSpinner message="Loading custom order requests..." />
      ) : (
        <DataTable
          columns={columns}
          data={requests ?? []}
          searchable
          searchPlaceholder="Search requests..."
          onRowClick={(row: any) => navigate(`/custom-requests/${row.id}`)}
        />
      )}
    </PageContainer>
  );
}
