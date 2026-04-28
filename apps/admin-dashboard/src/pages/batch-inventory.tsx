import { useState } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useBatches,
  useBatch,
  useBatchStats,
  useDiscardBatch,
  useLocations,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  StatsCard,
  DataTable,
  LoadingSpinner,
  StatusBadge,
  ExpiryWarningBadge,
  Modal,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';
import type { ProductionBatch, Location } from '@bake-app/shared-types';

function formatDate(date: Date | string | undefined): string {
  if (!date) return '\u2014';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '\u2014';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BatchInventoryPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);

  const queryParams: Record<string, unknown> = {};
  if (statusFilter) queryParams.status = statusFilter;
  if (locationFilter) queryParams.locationId = locationFilter;

  const { data: batches, isLoading } = useBatches(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  );
  const { data: statsData } = useBatchStats(locationFilter || undefined);
  const { data: locations } = useLocations();
  const { data: detailBatch, isLoading: detailLoading } = useBatch(
    detailBatchId ?? '',
  );
  const discardBatch = useDiscardBatch();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const batchList: ProductionBatch[] = (batches as ProductionBatch[]) ?? [];
  const locationList: Location[] = (locations as Location[]) ?? [];
  const stats = (statsData as any) ?? {
    active: 0,
    fresh: 0,
    expiringSoon: 0,
    expired: 0,
  };

  const handleDiscard = async (batch: ProductionBatch) => {
    const ok = await confirm(
      'Discard Batch',
      `Are you sure you want to discard batch "${batch.batchNumber}" (${batch.recipeName})? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Discard' },
    );
    if (!ok) return;
    discardBatch.mutate(
      { id: batch.id, reason: 'Manual discard from admin' },
      {
        onSuccess: () => toast.success('Batch discarded'),
        onError: () => toast.error('Failed to discard batch'),
      },
    );
  };

  const columns: TableColumn[] = [
    {
      key: 'recipeName',
      label: 'Recipe Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-[#3e2723]">{value ?? 'Unknown'}</span>
      ),
    },
    {
      key: 'remainingQuantity',
      label: 'Qty Remaining',
      type: 'number',
      sortable: true,
      render: (value: number, row: ProductionBatch) => (
        <span className="font-mono text-sm">
          {value?.toLocaleString() ?? 0} {row.unit ?? ''}
        </span>
      ),
    },
    {
      key: 'productionDate',
      label: 'Production Date',
      sortable: true,
      render: (value: Date | string) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      ),
    },
    {
      key: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      render: (value: Date | string | undefined, row: ProductionBatch) => {
        const expiry = row.compositeExpiryDate ?? value;
        if (!expiry) return <span className="text-sm text-gray-400">{'\u2014'}</span>;
        return <ExpiryWarningBadge expiryDate={expiry} size="sm" />;
      },
    },
    {
      key: 'storageCondition',
      label: 'Storage',
      render: (value: string) =>
        value ? (
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {value}
          </span>
        ) : (
          <span className="text-sm text-gray-400">{'\u2014'}</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actions: [
        {
          action: 'view',
          icon: <Eye size={16} />,
          tooltip: 'View batch detail',
          onClick: (row: ProductionBatch) => setDetailBatchId(row.id),
        },
        {
          action: 'discard',
          icon: <Trash2 size={16} />,
          color: 'text-red-500 hover:text-red-700',
          tooltip: 'Discard batch',
          onClick: (row: ProductionBatch) => handleDiscard(row),
        },
      ],
    },
  ];

  const detail = (detailBatch as ProductionBatch) ?? null;

  return (
    <PageContainer
      title="Batch Inventory"
      subtitle="Track semi-finished goods and production batches"
      backPath="/production"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Batches"
          value={stats.active}
          icon={<Package size={20} />}
        />
        <StatsCard
          title="Fresh"
          value={stats.fresh}
          icon={<CheckCircle2 size={20} />}
          color="success"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          icon={<AlertTriangle size={20} />}
          color="warning"
        />
        <StatsCard
          title="Expired"
          value={stats.expired}
          icon={<XCircle size={20} />}
          color="danger"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading batches..." />
      ) : (
        <DataTable
          columns={columns}
          data={batchList}
          searchable
          searchPlaceholder="Search batches..."
          pageSize={10}
          toolbarExtra={
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="discarded">Discarded</option>
              </select>

              {/* Location Filter */}
              {locationList.length > 0 && (
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  <option value="">All Locations</option>
                  {locationList.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          }
        />
      )}

      {ConfirmationDialog}

      {/* Batch Detail Modal */}
      <Modal
        open={!!detailBatchId}
        onClose={() => setDetailBatchId(null)}
        title="Batch Detail"
        size="lg"
      >
        {detailLoading ? (
          <LoadingSpinner message="Loading batch..." />
        ) : detail ? (
          <div className="space-y-5">
            {/* Batch Info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <DetailField label="Batch Number" value={detail.batchNumber} mono />
              <DetailField label="Recipe" value={detail.recipeName} />
              <DetailField
                label="Produced Quantity"
                value={`${detail.producedQuantity} ${detail.unit}`}
                mono
              />
              <DetailField
                label="Remaining Quantity"
                value={`${detail.remainingQuantity} ${detail.unit}`}
                mono
              />
              <DetailField
                label="Production Date"
                value={formatDate(detail.productionDate)}
              />
              <DetailField
                label="Expiry Date"
                value={
                  detail.compositeExpiryDate ?? detail.expiryDate
                    ? formatDateTime(detail.compositeExpiryDate ?? detail.expiryDate)
                    : '\u2014'
                }
              />
              <DetailField
                label="Storage Condition"
                value={detail.storageCondition ?? '\u2014'}
              />
              <div>
                <span className="text-xs font-medium uppercase text-gray-500">
                  Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={detail.status} size="sm" />
                </div>
              </div>
              {detail.costPerUnit != null && (
                <DetailField
                  label="Cost per Unit"
                  value={`$${Number(detail.costPerUnit).toFixed(2)}`}
                  mono
                />
              )}
              {detail.notes && (
                <div className="col-span-2">
                  <span className="text-xs font-medium uppercase text-gray-500">
                    Notes
                  </span>
                  <p className="mt-1 text-sm text-gray-700">{detail.notes}</p>
                </div>
              )}
            </div>

            {/* Consumption History */}
            {detail.consumptions && detail.consumptions.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-[#3e2723]">
                  Consumption History
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Date
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Manual Override
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.consumptions.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {formatDateTime(c.createdAt)}
                          </td>
                          <td className="px-3 py-2 font-mono text-sm">
                            {c.quantityConsumed} {c.unit}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {c.isManualOverride ? (
                              <span className="text-amber-600">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detail.consumptions?.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">
                No consumption records yet
              </p>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            Batch not found
          </p>
        )}
      </Modal>
    </PageContainer>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-xs font-medium uppercase text-gray-500">{label}</span>
      <p className={`mt-1 text-sm text-gray-700 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
