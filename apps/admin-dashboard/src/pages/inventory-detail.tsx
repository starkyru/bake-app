import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useInventoryItem,
  useAddPackage,
  useDeletePackage,
  useAddShipment,
  useInventoryShipments,
  useLocations,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';
import type { InventoryItemPackage, InventoryShipment } from '@bake-app/shared-types';

export function InventoryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useInventoryItem(id!);
  const { data: shipments, isLoading: shipmentsLoading } =
    useInventoryShipments(id!);
  const { data: locations } = useLocations();
  const addPackage = useAddPackage();
  const deletePackage = useDeletePackage();
  const addShipment = useAddShipment();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [showAddPackage, setShowAddPackage] = useState(false);
  const [packageForm, setPackageForm] = useState({ size: 1, unit: 'kg' });
  const [savingPackage, setSavingPackage] = useState(false);

  const [showShipmentDialog, setShowShipmentDialog] = useState(false);
  const [savingShipment, setSavingShipment] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({
    packageId: '',
    packageCount: 1,
    unitCost: 0,
    batchNumber: '',
    locationId: '',
    notes: '',
  });

  const inventoryItem = item as any;
  const packages: InventoryItemPackage[] = inventoryItem?.packages ?? [];
  const shipmentList: InventoryShipment[] =
    (shipments as InventoryShipment[]) ?? [];
  const locationList = (locations as any[]) ?? [];

  const handleAddPackage = () => {
    if (!packageForm.size || !packageForm.unit) {
      toast.error('Please fill in all fields');
      return;
    }
    setSavingPackage(true);
    addPackage.mutate(
      {
        inventoryItemId: id!,
        size: packageForm.size,
        unit: packageForm.unit,
      },
      {
        onSuccess: () => {
          toast.success('Package added');
          setShowAddPackage(false);
          setPackageForm({ size: 1, unit: 'kg' });
          setSavingPackage(false);
        },
        onError: () => {
          toast.error('Failed to add package');
          setSavingPackage(false);
        },
      },
    );
  };

  const handleDeletePackage = async (pkg: InventoryItemPackage) => {
    const ok = await confirm(
      'Delete Package',
      `Delete package ${pkg.size} ${pkg.unit}?`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!ok) return;
    deletePackage.mutate(
      { inventoryItemId: id!, packageId: pkg.id },
      {
        onSuccess: () => toast.success('Package deleted'),
        onError: () => toast.error('Failed to delete package'),
      },
    );
  };

  const handleAddShipment = () => {
    if (!shipmentForm.packageId || !shipmentForm.locationId) {
      toast.error('Please select a package and location');
      return;
    }
    setSavingShipment(true);
    addShipment.mutate(
      {
        inventoryItemId: id!,
        packageId: shipmentForm.packageId,
        packageCount: shipmentForm.packageCount,
        unitCost: shipmentForm.unitCost || undefined,
        batchNumber: shipmentForm.batchNumber || undefined,
        locationId: shipmentForm.locationId,
        notes: shipmentForm.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Shipment added');
          setShowShipmentDialog(false);
          setShipmentForm({
            packageId: '',
            packageCount: 1,
            unitCost: 0,
            batchNumber: '',
            locationId: '',
            notes: '',
          });
          setSavingShipment(false);
        },
        onError: () => {
          toast.error('Failed to add shipment');
          setSavingShipment(false);
        },
      },
    );
  };

  const shipmentColumns: TableColumn[] = [
    {
      key: 'createdAt',
      label: 'Date',
      type: 'date',
      sortable: true,
    },
    {
      key: 'package',
      label: 'Package',
      render: (_: any, row: InventoryShipment) =>
        row.package ? (
          <span className="text-sm">
            {row.package.size} {row.package.unit}
          </span>
        ) : (
          <span className="text-gray-400">&mdash;</span>
        ),
    },
    {
      key: 'packageCount',
      label: 'Quantity',
      type: 'number',
    },
    {
      key: 'unitCost',
      label: 'Cost',
      type: 'currency',
    },
    {
      key: 'batchNumber',
      label: 'Batch #',
      render: (value: string) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-gray-400">&mdash;</span>
        ),
    },
    {
      key: 'location.name',
      label: 'Location',
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value: string) => (
        <span className="max-w-[200px] truncate text-sm text-gray-500">
          {value || '\u2014'}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading inventory item..." />
      </PageContainer>
    );
  }

  if (!inventoryItem) {
    return (
      <PageContainer>
        <div className="text-center text-gray-500">Item not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={inventoryItem.title}
      subtitle={inventoryItem.ingredient?.name ?? 'Inventory Item'}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (packages.length === 0) {
                toast.error('Add a package first before creating a shipment');
                return;
              }
              setShowShipmentDialog(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95"
          >
            <Truck size={16} />
            Add Shipment
          </button>
        </div>
      }
    >
      {/* Packages Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#3e2723]">Packages</h2>
          <button
            type="button"
            onClick={() => setShowAddPackage(!showAddPackage)}
            className="flex items-center gap-1 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-colors hover:bg-[#faf3e8]"
          >
            <Plus size={14} />
            Add Package
          </button>
        </div>

        {showAddPackage && (
          <div className="mb-4 flex items-end gap-3 rounded-lg border border-[#8b4513]/10 bg-[#faf3e8]/50 p-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Size</label>
              <input
                type="number"
                value={packageForm.size}
                onChange={(e) =>
                  setPackageForm({
                    ...packageForm,
                    size: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Unit</label>
              <select
                value={packageForm.unit}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, unit: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              >
                {['g', 'kg', 'lb', 'oz', 'ml', 'L', 'pcs'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddPackage}
              disabled={savingPackage}
              className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] disabled:opacity-50"
            >
              {savingPackage ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddPackage(false)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-gray-400">
              No packages yet. Add one to start tracking shipments.
            </p>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#faf3e8] p-2 text-[#8b4513]">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-[#3e2723]">
                      {pkg.size} {pkg.unit}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Delete package"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shipment History */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#3e2723]">
          Shipment History
        </h2>
        {shipmentsLoading ? (
          <LoadingSpinner message="Loading shipments..." />
        ) : (
          <DataTable
            columns={shipmentColumns}
            data={shipmentList}
            searchable
            searchPlaceholder="Search shipments..."
            pageSize={10}
          />
        )}
      </div>

      {ConfirmationDialog}

      {/* Add Shipment Dialog */}
      {showShipmentDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowShipmentDialog(false)}
        >
          <div
            className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowShipmentDialog(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-[#3e2723]">
              Add Shipment
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Package *
                </label>
                <select
                  value={shipmentForm.packageId}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      packageId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  <option value="">Select package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.size} {pkg.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Package Count *
                  </label>
                  <input
                    type="number"
                    value={shipmentForm.packageCount}
                    onChange={(e) =>
                      setShipmentForm({
                        ...shipmentForm,
                        packageCount: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    min="1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    value={shipmentForm.unitCost}
                    onChange={(e) =>
                      setShipmentForm({
                        ...shipmentForm,
                        unitCost: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={shipmentForm.batchNumber}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      batchNumber: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="e.g. LOT-2026-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <select
                  value={shipmentForm.locationId}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      locationId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  <option value="">Select location</option>
                  {locationList.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={shipmentForm.notes}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowShipmentDialog(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddShipment}
                disabled={savingShipment}
                className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
              >
                {savingShipment ? 'Adding...' : 'Add Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
