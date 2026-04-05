import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, User, Mail, Phone, MapPin, ShieldCheck, ShoppingBag } from 'lucide-react';
import {
  useOnlineCustomer,
  useCustomerOrders,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  CurrencyDisplay,
  type TableColumn,
} from '@bake-app/react/ui';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useOnlineCustomer(id!) as { data: any; isLoading: boolean };
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(id!);

  const orderColumns: TableColumn[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm font-medium text-[#3e2723]">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} size="sm" />,
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
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading customer..." />
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer>
        <EmptyState title="Customer not found" message="The requested customer does not exist." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={customer.name || 'Customer'}
      subtitle={customer.email || 'Customer details'}
      actions={
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      }
    >
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#faf3e8] text-xl font-bold text-[#8b4513]">
              {(customer.name || 'G')[0].toUpperCase()}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-[#3e2723]">
                  {customer.name || 'Guest'}
                </h2>
                {customer.isGuest && (
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Guest
                  </span>
                )}
                <StatusBadge status={customer.status || 'active'} size="sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    {customer.phone}
                  </div>
                )}
                {customer.authProvider && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShieldCheck size={14} className="text-gray-400" />
                    <span className="capitalize">{customer.authProvider}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Preferences */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <User size={16} />
              Preferences
            </h3>
            <div className="space-y-3 text-sm">
              {customer.dietaryPreferences && customer.dietaryPreferences.length > 0 ? (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Dietary Preferences
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {customer.dietaryPreferences.map((pref: string) => (
                      <span
                        key={pref}
                        className="rounded-full bg-[#faf3e8] px-2 py-0.5 text-xs font-medium text-[#8b4513]"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No dietary preferences set</p>
              )}
              {customer.allergies && customer.allergies.length > 0 && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Allergies
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {customer.allergies.map((allergy: string) => (
                      <span
                        key={allergy}
                        className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <MapPin size={16} />
              Addresses
            </h3>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-2">
                {customer.addresses.map((addr: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"
                  >
                    {addr.label && (
                      <p className="text-xs font-medium uppercase text-gray-400">{addr.label}</p>
                    )}
                    <p className="text-[#3e2723]">
                      {[addr.street, addr.city, addr.state, addr.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {addr.isDefault && (
                      <span className="mt-1 inline-block rounded-full bg-[#faf3e8] px-2 py-0.5 text-[10px] font-medium text-[#8b4513]">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No addresses on file</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <ShoppingBag size={16} />
              Recent Orders
            </h3>
          </div>
          <div className="p-4">
            {ordersLoading ? (
              <LoadingSpinner message="Loading orders..." />
            ) : (orders ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No orders yet</p>
            ) : (
              <DataTable
                columns={orderColumns}
                data={orders ?? []}
                searchable={false}
                onRowClick={(row: any) => navigate(`/online-orders/${row.id}`)}
              />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
