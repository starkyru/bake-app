import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Receipt,
  Percent,
  Monitor,
  FolderTree,
  Wheat,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useSettings,
  useUpdateSettings,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useIngredientCategories,
  useCreateIngredientCategory,
  useUpdateIngredientCategory,
  useDeleteIngredientCategory,
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  useConfirmation,
} from '@bake-app/react/ui';
import type {
  Category,
  IngredientCategory,
  Location,
} from '@bake-app/shared-types';
import { LocationType } from '@bake-app/shared-types';

const TABS = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
  { id: 'tax', label: 'Tax', icon: <Percent size={16} /> },
  { id: 'pos', label: 'POS', icon: <Monitor size={16} /> },
  { id: 'categories', label: 'Menu Categories', icon: <FolderTree size={16} /> },
  { id: 'ingredient-categories', label: 'Ingredient Categories', icon: <Wheat size={16} /> },
  { id: 'locations', label: 'Locations', icon: <MapPin size={16} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ---------- Settings Form Components ----------

function GeneralSettingsTab() {
  const { data: settings, isLoading } = useSettings('general');
  const updateSettings = useUpdateSettings();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bakeryName: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({
        bakeryName: s.bakeryName ?? '',
        address: s.address ?? '',
        phone: s.phone ?? '',
        email: s.email ?? '',
      });
    }
  }, [settings]);

  const handleSave = () => {
    setSaving(true);
    updateSettings.mutate(
      { group: 'general', ...form },
      {
        onSuccess: () => {
          toast.success('General settings saved');
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to save settings');
          setSaving(false);
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Bakery Name
        </label>
        <input
          type="text"
          value={form.bakeryName}
          onChange={(e) => setForm({ ...form, bakeryName: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function TaxSettingsTab() {
  const { data: settings, isLoading } = useSettings('tax');
  const updateSettings = useUpdateSettings();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    taxRate: 0,
    taxInclusive: false,
  });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({
        taxRate: s.taxRate ?? 0,
        taxInclusive: s.taxInclusive ?? false,
      });
    }
  }, [settings]);

  const handleSave = () => {
    setSaving(true);
    updateSettings.mutate(
      { group: 'tax', ...form },
      {
        onSuccess: () => {
          toast.success('Tax settings saved');
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to save settings');
          setSaving(false);
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tax Rate (%)
        </label>
        <input
          type="number"
          value={form.taxRate}
          onChange={(e) =>
            setForm({ ...form, taxRate: Number(e.target.value) })
          }
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          min="0"
          max="100"
          step="0.01"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={form.taxInclusive}
            onChange={(e) =>
              setForm({ ...form, taxInclusive: e.target.checked })
            }
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#8b4513] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-[#8b4513]/30" />
        </label>
        <span className="text-sm text-gray-700">Tax Inclusive</span>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function PosSettingsTab() {
  const { data: settings, isLoading } = useSettings('pos');
  const updateSettings = useUpdateSettings();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    receiptHeader: '',
    autoPrint: false,
  });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({
        receiptHeader: s.receiptHeader ?? '',
        autoPrint: s.autoPrint ?? false,
      });
    }
  }, [settings]);

  const handleSave = () => {
    setSaving(true);
    updateSettings.mutate(
      { group: 'pos', ...form },
      {
        onSuccess: () => {
          toast.success('POS settings saved');
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to save settings');
          setSaving(false);
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Receipt Header Text
        </label>
        <textarea
          value={form.receiptHeader}
          onChange={(e) =>
            setForm({ ...form, receiptHeader: e.target.value })
          }
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          placeholder="Text to display at the top of receipts..."
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={form.autoPrint}
            onChange={(e) =>
              setForm({ ...form, autoPrint: e.target.checked })
            }
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#8b4513] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-[#8b4513]/30" />
        </label>
        <span className="text-sm text-gray-700">Auto-print receipts</span>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ---------- Menu Categories Tab ----------

function CategoriesTab() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    sortOrder: 0,
    isActive: true,
    parentId: '',
  });

  const categoryList: Category[] = (categories as Category[]) ?? [];

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      type: cat.type ?? '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      parentId: cat.parentId ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm({ name: '', type: '', sortOrder: 0, isActive: true, parentId: '' });
  };

  const handleSave = (id?: string) => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name,
      type: form.type || undefined,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      parentId: form.parentId || undefined,
    };

    if (id) {
      updateCategory.mutate(
        { id, ...payload },
        {
          onSuccess: () => {
            toast.success('Category updated');
            cancelEdit();
            setSaving(false);
          },
          onError: () => {
            toast.error('Failed to update');
            setSaving(false);
          },
        },
      );
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          toast.success('Category created');
          cancelEdit();
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to create');
          setSaving(false);
        },
      });
    }
  };

  const handleDelete = async (cat: Category) => {
    const ok = await confirm(
      'Delete Category',
      `Delete "${cat.name}"? This cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!ok) return;
    deleteCategory.mutate(cat.id, {
      onSuccess: () => toast.success('Category deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  if (isLoading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {categoryList.length} categories
        </p>
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm({ name: '', type: '', sortOrder: 0, isActive: true, parentId: '' });
          }}
          className="flex items-center gap-1 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-colors hover:bg-[#faf3e8]"
        >
          <Plus size={14} />
          Add Category
        </button>
      </div>

      {showAdd && (
        <CategoryFormRow
          form={form}
          setForm={setForm}
          onSave={() => handleSave()}
          onCancel={cancelEdit}
          saving={saving}
          categories={categoryList}
        />
      )}

      <div className="space-y-2">
        {categoryList.map((cat) =>
          editingId === cat.id ? (
            <CategoryFormRow
              key={cat.id}
              form={form}
              setForm={setForm}
              onSave={() => handleSave(cat.id)}
              onCancel={cancelEdit}
              saving={saving}
              categories={categoryList.filter((c) => c.id !== cat.id)}
            />
          ) : (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-gray-400">
                  #{cat.sortOrder}
                </span>
                <span className="font-medium text-[#3e2723]">{cat.name}</span>
                {cat.type && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {cat.type}
                  </span>
                )}
                {cat.parentId && (
                  <span className="text-xs text-gray-400">
                    (child of{' '}
                    {categoryList.find((c) => c.id === cat.parentId)?.name ??
                      'unknown'}
                    )
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={cat.isActive}
                    onChange={(e) => {
                      updateCategory.mutate(
                        { id: cat.id, isActive: e.target.checked },
                        {
                          onSuccess: () => toast.success('Updated'),
                          onError: () => toast.error('Failed to update'),
                        },
                      );
                    }}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#3e2723]"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
      {ConfirmationDialog}
    </div>
  );
}

function CategoryFormRow({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  categories,
}: {
  form: { name: string; type: string; sortOrder: number; isActive: boolean; parentId: string };
  setForm: (f: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  categories: Category[];
}) {
  return (
    <div className="mb-2 flex flex-wrap items-end gap-2 rounded-lg border border-[#8b4513]/10 bg-[#faf3e8]/50 p-3">
      <div className="flex-1 min-w-[120px]">
        <label className="mb-1 block text-xs text-gray-500">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        />
      </div>
      <div className="w-24">
        <label className="mb-1 block text-xs text-gray-500">Type</label>
        <input
          type="text"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        />
      </div>
      <div className="w-20">
        <label className="mb-1 block text-xs text-gray-500">Order</label>
        <input
          type="number"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        />
      </div>
      <div className="w-32">
        <label className="mb-1 block text-xs text-gray-500">Parent</label>
        <select
          value={form.parentId}
          onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[#8b4513] p-1.5 text-white hover:bg-[#5d4037] disabled:opacity-50"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ---------- Ingredient Categories Tab ----------

function IngredientCategoriesTab() {
  const { data: categories, isLoading } = useIngredientCategories();
  const createCategory = useCreateIngredientCategory();
  const updateCategory = useUpdateIngredientCategory();
  const deleteCategory = useDeleteIngredientCategory();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', sortOrder: 0 });

  const categoryList: IngredientCategory[] =
    (categories as IngredientCategory[]) ?? [];

  const startEdit = (cat: IngredientCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, sortOrder: cat.sortOrder });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm({ name: '', sortOrder: 0 });
  };

  const handleSave = (id?: string) => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    if (id) {
      updateCategory.mutate(
        { id, name: form.name, sortOrder: form.sortOrder },
        {
          onSuccess: () => {
            toast.success('Category updated');
            cancelEdit();
            setSaving(false);
          },
          onError: () => {
            toast.error('Failed to update');
            setSaving(false);
          },
        },
      );
    } else {
      createCategory.mutate(
        { name: form.name, sortOrder: form.sortOrder },
        {
          onSuccess: () => {
            toast.success('Category created');
            cancelEdit();
            setSaving(false);
          },
          onError: () => {
            toast.error('Failed to create');
            setSaving(false);
          },
        },
      );
    }
  };

  const handleDelete = async (cat: IngredientCategory) => {
    const ok = await confirm(
      'Delete Category',
      `Delete "${cat.name}"?`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!ok) return;
    deleteCategory.mutate(cat.id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  if (isLoading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {categoryList.length} ingredient categories
        </p>
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm({ name: '', sortOrder: 0 });
          }}
          className="flex items-center gap-1 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-colors hover:bg-[#faf3e8]"
        >
          <Plus size={14} />
          Add Category
        </button>
      </div>

      {showAdd && (
        <div className="mb-2 flex items-end gap-2 rounded-lg border border-[#8b4513]/10 bg-[#faf3e8]/50 p-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs text-gray-500">Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-lg bg-[#8b4513] p-1.5 text-white hover:bg-[#5d4037] disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {categoryList.map((cat) =>
          editingId === cat.id ? (
            <div
              key={cat.id}
              className="flex items-end gap-2 rounded-lg border border-[#8b4513]/10 bg-[#faf3e8]/50 p-3"
            >
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
                />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs text-gray-500">
                  Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSave(cat.id)}
                disabled={saving}
                className="rounded-lg bg-[#8b4513] p-1.5 text-white hover:bg-[#5d4037] disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-gray-400">
                  #{cat.sortOrder}
                </span>
                <span className="font-medium text-[#3e2723]">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#3e2723]"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
      {ConfirmationDialog}
    </div>
  );
}

// ---------- Locations Tab ----------

function LocationsTab() {
  const { data: locations, isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    type: LocationType.RETAIL as string,
    phone: '',
    isActive: true,
  });

  const locationList: Location[] = (locations as Location[]) ?? [];

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address ?? '',
      type: loc.type,
      phone: loc.phone ?? '',
      isActive: loc.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm({
      name: '',
      address: '',
      type: LocationType.RETAIL,
      phone: '',
      isActive: true,
    });
  };

  const handleSave = (id?: string) => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name,
      address: form.address || undefined,
      type: form.type,
      phone: form.phone || undefined,
      isActive: form.isActive,
    };

    if (id) {
      updateLocation.mutate(
        { id, ...payload },
        {
          onSuccess: () => {
            toast.success('Location updated');
            cancelEdit();
            setSaving(false);
          },
          onError: () => {
            toast.error('Failed to update');
            setSaving(false);
          },
        },
      );
    } else {
      createLocation.mutate(payload, {
        onSuccess: () => {
          toast.success('Location created');
          cancelEdit();
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to create');
          setSaving(false);
        },
      });
    }
  };

  const handleDelete = async (loc: Location) => {
    const ok = await confirm(
      'Delete Location',
      `Delete "${loc.name}"?`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!ok) return;
    deleteLocation.mutate(loc.id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  if (isLoading) return <LoadingSpinner message="Loading locations..." />;

  const LocationFormRow = ({ id }: { id?: string }) => (
    <div className="mb-2 flex flex-wrap items-end gap-2 rounded-lg border border-[#8b4513]/10 bg-[#faf3e8]/50 p-3">
      <div className="flex-1 min-w-[120px]">
        <label className="mb-1 block text-xs text-gray-500">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="mb-1 block text-xs text-gray-500">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        />
      </div>
      <div className="w-32">
        <label className="mb-1 block text-xs text-gray-500">Type</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        >
          {Object.values(LocationType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="w-28">
        <label className="mb-1 block text-xs text-gray-500">Phone</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => handleSave(id)}
        disabled={saving}
        className="rounded-lg bg-[#8b4513] p-1.5 text-white hover:bg-[#5d4037] disabled:opacity-50"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        onClick={cancelEdit}
        className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50"
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {locationList.length} locations
        </p>
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm({
              name: '',
              address: '',
              type: LocationType.RETAIL,
              phone: '',
              isActive: true,
            });
          }}
          className="flex items-center gap-1 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-colors hover:bg-[#faf3e8]"
        >
          <Plus size={14} />
          Add Location
        </button>
      </div>

      {showAdd && <LocationFormRow />}

      <div className="space-y-2">
        {locationList.map((loc) =>
          editingId === loc.id ? (
            <LocationFormRow key={loc.id} id={loc.id} />
          ) : (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-[#3e2723]">{loc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="capitalize">{loc.type}</span>
                    {loc.address && (
                      <>
                        <span>&middot;</span>
                        <span>{loc.address}</span>
                      </>
                    )}
                    {loc.phone && (
                      <>
                        <span>&middot;</span>
                        <span>{loc.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={loc.isActive}
                    onChange={(e) => {
                      updateLocation.mutate(
                        { id: loc.id, isActive: e.target.checked },
                        {
                          onSuccess: () => toast.success('Updated'),
                          onError: () => toast.error('Failed to update'),
                        },
                      );
                    }}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
                <button
                  type="button"
                  onClick={() => startEdit(loc)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#3e2723]"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(loc)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
      {ConfirmationDialog}
    </div>
  );
}

// ---------- Main Settings Page ----------

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsTab />;
      case 'tax':
        return <TaxSettingsTab />;
      case 'pos':
        return <PosSettingsTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'ingredient-categories':
        return <IngredientCategoriesTab />;
      case 'locations':
        return <LocationsTab />;
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Settings"
      subtitle="Configure your bakery settings"
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="space-y-1 rounded-xl border border-[#8b4513]/10 bg-white p-2 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-[#8b4513] text-white'
                    : 'text-gray-600 hover:bg-[#faf3e8] hover:text-[#3e2723]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#3e2723]">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          {renderTab()}
        </div>
      </div>
    </PageContainer>
  );
}
