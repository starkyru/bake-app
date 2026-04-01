import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Menu } from '@bake-app/shared-types';
import {
  useMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

interface MenuFormData {
  name: string;
  description: string;
  isActive: boolean;
}

const emptyForm: MenuFormData = { name: '', description: '', isActive: true };

export function MenusPage() {
  const navigate = useNavigate();
  const { data: menus, isLoading } = useMenus();
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [form, setForm] = useState<MenuFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingMenu(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setForm({
      name: menu.name,
      description: menu.description ?? '',
      isActive: menu.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMenu(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingMenu) {
        await updateMenu.mutateAsync({
          id: editingMenu.id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        });
        toast.success('Menu updated');
      } else {
        await createMenu.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        });
        toast.success('Menu created');
      }
      closeDialog();
    } catch {
      toast.error(editingMenu ? 'Failed to update menu' : 'Failed to create menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menu: Menu) => {
    const confirmed = await confirm(
      'Delete Menu',
      `Are you sure you want to delete "${menu.name}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteMenu.mutateAsync(menu.id);
      toast.success('Menu deleted');
    } catch {
      toast.error('Failed to delete menu');
    }
  };

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-500">{value || '\u2014'}</span>
      ),
    },
    {
      key: 'productCount',
      label: 'Products',
      type: 'number',
      sortable: true,
      render: (value: number, row: Menu) => (
        <span className="font-mono text-sm text-[#3e2723]">
          {value ?? row.menuProducts?.length ?? 0}
        </span>
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
      width: '120px',
      actions: [
        {
          action: 'view',
          icon: <Eye size={16} />,
          tooltip: 'View details',
          onClick: (row: Menu) => navigate(`/menu/${row.id}`),
        },
        {
          action: 'edit',
          icon: <Pencil size={16} />,
          tooltip: 'Edit',
          onClick: (row: Menu) => openEdit(row),
        },
        {
          action: 'delete',
          icon: <Trash2 size={16} />,
          tooltip: 'Delete',
          color: 'text-red-400 hover:text-red-600',
          onClick: (row: Menu) => handleDelete(row),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Menus"
      subtitle="Manage your menu configurations"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Menu
        </button>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading menus..." />
      ) : (
        <DataTable
          columns={columns}
          data={menus ?? []}
          searchable
          searchPlaceholder="Search menus..."
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
              {editingMenu ? 'Edit Menu' : 'Add Menu'}
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
                  placeholder="e.g. Main Menu"
                />
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
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="Menu description..."
                />
              </div>

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
                    : editingMenu
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
