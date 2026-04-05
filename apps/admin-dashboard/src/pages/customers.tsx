import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Users } from 'lucide-react';
import {
  useOnlineCustomers,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  StatusBadge,
  type TableColumn,
} from '@bake-app/react/ui';

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: customers, isLoading } = useOnlineCustomers({ search }) as { data: any[]; isLoading: boolean };

  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf3e8] text-xs font-bold text-[#8b4513]">
            {(value || 'G')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-[#3e2723]">{value || 'Guest'}</p>
            {row.isGuest && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Guest
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: string) => (
        <span className="text-sm text-gray-500">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'authProvider',
      label: 'Auth',
      render: (value: string) => (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
          {value || 'email'}
        </span>
      ),
    },
    {
      key: 'ordersCount',
      label: 'Orders',
      type: 'number',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-sm text-[#3e2723]">{value ?? 0}</span>
      ),
    },
    {
      key: 'lastOrderDate',
      label: 'Last Order',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <StatusBadge status={value || 'active'} size="sm" />
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
          onClick: (row: any) => navigate(`/customers/${row.id}`),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Customers"
      subtitle="Manage online ordering customers"
      actions={
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[#8b4513]" />
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading customers..." />
      ) : (
        <DataTable
          columns={columns}
          data={customers ?? []}
          searchable
          searchPlaceholder="Search by name, email, or phone..."
          onRowClick={(row: any) => navigate(`/customers/${row.id}`)}
        />
      )}
    </PageContainer>
  );
}
