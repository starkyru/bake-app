import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Truck,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useInventoryItems,
  useDeleteInventoryItem,
  useCreateInventoryItem,
  useIngredients,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  StatsCard,
  DataTable,
  LoadingSpinner,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';
import type { InventoryItem } from '@bake-app/shared-types';

const UNIT_GROUPS: Record<string, string[]> = {
  g: ['g', 'kg', 'lb', 'oz'],
  kg: ['g', 'kg', 'lb', 'oz'],
  ml: ['ml', 'L'],
  L: ['ml', 'L'],
  pcs: ['pcs'],
  tbsp: ['tbsp', 'tsp', 'ml'],
  tsp: ['tbsp', 'tsp', 'ml'],
};

function getCompatibleUnits(baseUnit: string): string[] {
  return UNIT_GROUPS[baseUnit] || ['g', 'kg', 'ml', 'L', 'pcs'];
}

export function InventoryPage() {
  const navigate = useNavigate();
  const { data: items, isLoading } = useInventoryItems();
  const { data: ingredients } = useIngredients();
  const deleteItem = useDeleteInventoryItem();
  const createItem = useCreateInventoryItem();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    ingredientId: '',
    minStockLevel: 0,
    minStockUnit: 'g',
    packageSize: 1,
    packageUnit: 'kg',
  });

  const inventoryItems: InventoryItem[] = (items as InventoryItem[]) ?? [];

  const stats = useMemo(() => {
    const total = inventoryItems.length;
    const inStock = inventoryItems.filter(
      (i) => i.status === 'in_stock',
    ).length;
    const lowStock = inventoryItems.filter(
      (i) => i.status === 'low_stock',
    ).length;
    const outOfStock = inventoryItems.filter(
      (i) => i.status === 'out_of_stock',
    ).length;
    return { total, inStock, lowStock, outOfStock };
  }, [inventoryItems]);

  const handleDelete = async (item: InventoryItem) => {
    const ok = await confirm(
      'Delete Inventory Item',
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!ok) return;
    deleteItem.mutate(item.id, {
      onSuccess: () => toast.success('Item deleted'),
      onError: () => toast.error('Failed to delete item'),
    });
  };

  const handleCreate = () => {
    if (!form.title || !form.ingredientId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    createItem.mutate(
      {
        title: form.title,
        ingredientId: form.ingredientId,
        minStockLevel: form.minStockLevel,
        minStockUnit: form.minStockUnit,
        packages: [
          { size: form.packageSize, unit: form.packageUnit } as any,
        ],
      } as any,
      {
        onSuccess: () => {
          toast.success('Inventory item created');
          setShowAddDialog(false);
          setForm({
            title: '',
            ingredientId: '',
            minStockLevel: 0,
            minStockUnit: 'g',
            packageSize: 1,
            packageUnit: 'kg',
          });
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to create item');
          setSaving(false);
        },
      },
    );
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      label: 'Item Title',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-[#3e2723]">{value}</span>
      ),
    },
    {
      key: 'ingredient.name',
      label: 'Ingredient',
      sortable: true,
    },
    {
      key: 'quantity',
      label: 'Current Quantity',
      type: 'number',
      sortable: true,
      render: (value: number, row: InventoryItem) => (
        <span className="font-mono text-sm">
          {value?.toLocaleString() ?? 0} {row.metricUnit ?? ''}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
    },
    {
      key: 'minStockLevel',
      label: 'Min Stock Level',
      type: 'number',
      render: (value: number, row: InventoryItem) => (
        <span className="text-sm text-gray-600">
          {value ?? 0} {row.minStockUnit ?? ''}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actions: [
        {
          action: 'view',
          icon: <Eye size={16} />,
          tooltip: 'View details',
          onClick: (row: InventoryItem) => navigate(`/inventory/${row.id}`),
        },
        {
          action: 'shipment',
          icon: <Truck size={16} />,
          tooltip: 'Add shipment',
          onClick: (row: InventoryItem) => navigate(`/inventory/${row.id}`),
        },
        {
          action: 'delete',
          icon: <Trash2 size={16} />,
          color: 'text-red-500 hover:text-red-700',
          tooltip: 'Delete',
          onClick: (row: InventoryItem) => handleDelete(row),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Inventory"
      subtitle="Manage inventory items, packages, and shipments"
      actions={
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Item
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={stats.total}
          icon={<Package size={20} />}
        />
        <StatsCard
          title="In Stock"
          value={stats.inStock}
          icon={<CheckCircle2 size={20} />}
          color="success"
        />
        <StatsCard
          title="Low Stock"
          value={stats.lowStock}
          icon={<AlertTriangle size={20} />}
          color="warning"
        />
        <StatsCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon={<XCircle size={20} />}
          color="danger"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading inventory..." />
      ) : (
        <DataTable
          columns={columns}
          data={inventoryItems}
          onRowClick={(row) => navigate(`/inventory/${row.id}`)}
          searchable
          searchPlaceholder="Search inventory..."
          pageSize={10}
        />
      )}

      {ConfirmationDialog}

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAddDialog(false)}
        >
          <div
            className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAddDialog(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-[#3e2723]">
              Add Inventory Item
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="e.g. All-Purpose Flour"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ingredient *
                </label>
                <select
                  value={form.ingredientId}
                  onChange={(e) => {
                    const selected = ((ingredients as any[]) ?? []).find((ing: any) => ing.id === e.target.value);
                    const unit = selected?.unit || 'g';
                    const compatible = getCompatibleUnits(unit);
                    setForm({
                      ...form,
                      ingredientId: e.target.value,
                      minStockUnit: compatible.includes(form.minStockUnit) ? form.minStockUnit : unit,
                      packageUnit: compatible.includes(form.packageUnit) ? form.packageUnit : compatible[1] || compatible[0],
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  <option value="">Select ingredient</option>
                  {((ingredients as any[]) ?? []).map((ing: any) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minStockLevel: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Min Stock Unit
                  </label>
                  <select
                    value={form.minStockUnit}
                    onChange={(e) =>
                      setForm({ ...form, minStockUnit: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    {(() => {
                      const selected = ((ingredients as any[]) ?? []).find((ing: any) => ing.id === form.ingredientId);
                      return getCompatibleUnits(selected?.unit || 'g');
                    })().map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  Initial Package
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Package Size
                    </label>
                    <input
                      type="number"
                      value={form.packageSize}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          packageSize: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Package Unit
                    </label>
                    <select
                      value={form.packageUnit}
                      onChange={(e) =>
                        setForm({ ...form, packageUnit: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    >
                      {(() => {
                        const selected = ((ingredients as any[]) ?? []).find((ing: any) => ing.id === form.ingredientId);
                        return getCompatibleUnits(selected?.unit || 'g');
                      })().map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
