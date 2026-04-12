import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { Ingredient } from '@bake-app/shared-types';
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useIngredientCategories,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

const UNIT_OPTIONS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'L', label: 'Litres (L)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'tbsp', label: 'Tablespoon (tbsp)' },
  { value: 'tsp', label: 'Teaspoon (tsp)' },
];

interface IngredientFormData {
  name: string;
  unit: string;
  categoryId: string;
  description: string;
}

const emptyForm: IngredientFormData = {
  name: '',
  unit: 'g',
  categoryId: '',
  description: '',
};

export function IngredientsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { data: ingredients, isLoading } = useIngredients(
    categoryFilter ? { category: categoryFilter } : undefined,
  );
  const { data: ingredientCategories } = useIngredientCategories();
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<IngredientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setForm({
      name: ingredient.name,
      unit: ingredient.unit,
      categoryId: ingredient.categoryId ?? '',
      description: ingredient.description ?? '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: Partial<Ingredient> = {
      name: form.name.trim(),
      unit: form.unit,
      categoryId: form.categoryId || undefined,
      description: form.description.trim() || undefined,
    };
    try {
      if (editing) {
        await updateIngredient.mutateAsync({ id: editing.id, ...payload });
        toast.success('Ingredient updated');
      } else {
        await createIngredient.mutateAsync(payload);
        toast.success('Ingredient created');
      }
      closeDialog();
    } catch {
      toast.error(
        editing ? 'Failed to update ingredient' : 'Failed to create ingredient',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    const confirmed = await confirm(
      'Delete Ingredient',
      `Are you sure you want to delete "${ingredient.name}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteIngredient.mutateAsync(ingredient.id);
      toast.success('Ingredient deleted');
    } catch {
      toast.error('Failed to delete ingredient');
    }
  };

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'unit',
      label: 'Unit',
      render: (value: string) => (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
          {value}
        </span>
      ),
    },
    {
      key: 'ingredientCategory.name',
      label: 'Category',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sortable: false,
      width: '100px',
      actions: [
        {
          action: 'edit',
          icon: <Pencil size={16} />,
          tooltip: 'Edit',
          onClick: (row: Ingredient) => openEdit(row),
        },
        {
          action: 'delete',
          icon: <Trash2 size={16} />,
          tooltip: 'Delete',
          color: 'text-red-400 hover:text-red-600',
          onClick: (row: Ingredient) => handleDelete(row),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Ingredients"
      subtitle="Manage ingredients for recipes"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Ingredient
        </button>
      }
    >
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        >
          <option value="">All Categories</option>
          {(ingredientCategories ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading ingredients..." />
      ) : (
        <DataTable
          columns={columns}
          data={ingredients ?? []}
          searchable
          searchPlaceholder="Search ingredients..."
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
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
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
              {editing ? 'Edit Ingredient' : 'Add Ingredient'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="e.g. All-purpose Flour"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Unit *
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    <option value="">No category</option>
                    {(ingredientCategories ?? []).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
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
                  placeholder="Optional description..."
                />
              </div>

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
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
