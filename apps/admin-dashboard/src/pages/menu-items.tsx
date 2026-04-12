import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Pencil, Trash2, X, ListChecks } from 'lucide-react';
import BigNumber from 'bignumber.js';
import { toast } from 'sonner';
import type { Product } from '@bake-app/shared-types';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCategories,
  useRecipes,
  useRecipeCost,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  CurrencyDisplay,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

interface ProductFormData {
  name: string;
  sku: string;
  type: string;
  price: string;
  costPrice: string;
  categoryId: string;
  recipeId: string;
  description: string;
  isActive: boolean;
}

const emptyForm: ProductFormData = {
  name: '',
  sku: '',
  type: 'produced',
  price: '',
  costPrice: '',
  categoryId: '',
  recipeId: '',
  description: '',
  isActive: true,
};

export function MenuItemsPage() {
  const navigate = useNavigate();
  const { data: productsResponse, isLoading } = useProducts({ limit: 500 });
  const { data: categories } = useCategories();
  const { data: recipes } = useRecipes();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const { data: recipeCost } = useRecipeCost(form.recipeId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const products = productsResponse ?? [];

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku ?? '',
      type: product.type,
      price: String(product.price),
      costPrice: String(product.costPrice),
      categoryId: product.categoryId ?? '',
      recipeId: product.recipeId ?? '',
      description: product.description ?? '',
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: Partial<Product> = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      type: form.type,
      price: parseFloat(form.price) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      categoryId: form.categoryId,
      recipeId: form.recipeId,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...payload });
        toast.success('Product updated');
      } else {
        await createProduct.mutateAsync(payload);
        toast.success('Product created');
      }
      closeDialog();
    } catch {
      toast.error(editingProduct ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await confirm(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'sku',
      label: 'SKU',
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-500">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: string) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            value === 'produced'
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-purple-200 bg-purple-50 text-purple-700'
          }`}
        >
          {value === 'produced' ? 'Produced' : 'Bought'}
        </span>
      ),
    },
    { key: 'price', label: 'Sell Price', type: 'currency', sortable: true },
    {
      key: 'category.name',
      label: 'Category',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            value
              ? 'border-green-200 bg-green-100 text-green-800'
              : 'border-gray-200 bg-gray-100 text-gray-600'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
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
          action: 'options',
          icon: <ListChecks size={16} />,
          tooltip: 'Edit Options',
          color: 'text-[#8b4513] hover:text-[#5d4037]',
          onClick: (row: Product) =>
            navigate(`/online-config/product/${row.id}/options`),
        },
        {
          action: 'edit',
          icon: <Pencil size={16} />,
          tooltip: 'Edit',
          onClick: (row: Product) => openEdit(row),
        },
        {
          action: 'delete',
          icon: <Trash2 size={16} />,
          tooltip: 'Delete',
          color: 'text-red-400 hover:text-red-600',
          onClick: (row: Product) => handleDelete(row),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Menu Items"
      subtitle="Manage products and menu items"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Product
        </button>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading products..." />
      ) : (
        <DataTable
          columns={columns}
          data={products}
          searchable
          searchPlaceholder="Search products..."
          pageSize={25}
        />
      )}

      {ConfirmationDialog}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeDialog}
        >
          <div
            className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDialog}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-semibold text-[#3e2723]">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="e.g. BRD-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    <option value={'produced'}>Produced</option>
                    <option value={'bought_for_resale'}>Bought for Resale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Sell Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Produce Price
                  </label>
                  <p className="mb-1 text-xs text-gray-400">Add-on cost (labor, overhead)</p>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, costPrice: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Category *
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    <option value="">Select category</option>
                    {(categories ?? []).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Recipe *
                  </label>
                  <select
                    value={form.recipeId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, recipeId: e.target.value }))
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    <option value="">Select recipe</option>
                    {(recipes ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="Product description..."
                  />
                </div>
              </div>

              {/* Batch Cost Calculation */}
              {form.recipeId && recipeCost && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-sm font-medium text-[#5d4037]">
                    Next Batch Cost Estimate
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Ingredients (from inventory)</span>
                      <span className="font-mono">${recipeCost.ingredientsCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Produce price (add-on)</span>
                      <span className="font-mono">${(parseFloat(form.costPrice) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-300 pt-1 font-medium text-[#3e2723]">
                      <span>
                        Total ({recipeCost.yieldQuantity} {recipeCost.yieldUnit})
                      </span>
                      <span className="font-mono">
                        ${new BigNumber(recipeCost.ingredientsCost).plus(parseFloat(form.costPrice) || 0).toFixed(2)}
                      </span>
                    </div>
                    {recipeCost.yieldQuantity > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Cost per unit</span>
                        <span className="font-mono">
                          ${new BigNumber(recipeCost.ingredientsCost).plus(parseFloat(form.costPrice) || 0).div(recipeCost.yieldQuantity).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm text-[#5d4037]">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Update'
                      : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
