import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, Trash2, Pencil, ArrowLeft, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  useProductOptionGroups,
  useCreateProductOptionGroup,
  useDeleteProductOptionGroup,
  useCreateProductOption,
  useUpdateProductOption,
  useDeleteProductOption,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  CurrencyDisplay,
  useConfirmation,
} from '@bake-app/react/ui';

interface GroupForm {
  name: string;
  type: string;
  isRequired: boolean;
}

const emptyGroupForm: GroupForm = {
  name: '',
  type: 'single',
  isRequired: false,
};

interface OptionForm {
  name: string;
  priceModifier: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: string;
}

const emptyOptionForm: OptionForm = {
  name: '',
  priceModifier: '0',
  isDefault: false,
  isActive: true,
  sortOrder: '0',
};

export function ProductOptionsEditorPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useProductOptionGroups(productId!) as { data: any[]; isLoading: boolean };
  const createGroup = useCreateProductOptionGroup();
  const deleteGroup = useDeleteProductOptionGroup();
  const createOption = useCreateProductOption();
  const updateOption = useUpdateProductOption();
  const deleteOption = useDeleteProductOption();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);

  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionForm, setOptionForm] = useState<OptionForm>(emptyOptionForm);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    try {
      await createGroup.mutateAsync({
        productId: productId!,
        name: groupForm.name.trim(),
        type: groupForm.type,
        isRequired: groupForm.isRequired,
      });
      toast.success('Option group created');
      setGroupDialogOpen(false);
      setGroupForm(emptyGroupForm);
    } catch {
      toast.error('Failed to create option group');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const confirmed = await confirm(
      'Delete Option Group',
      `Delete "${groupName}" and all its options? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteGroup.mutateAsync({ productId: productId!, groupId });
      toast.success('Option group deleted');
    } catch {
      toast.error('Failed to delete option group');
    }
  };

  const openAddOption = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingOptionId(null);
    setOptionForm(emptyOptionForm);
    setOptionDialogOpen(true);
  };

  const openEditOption = (groupId: string, option: any) => {
    setActiveGroupId(groupId);
    setEditingOptionId(option.id);
    setOptionForm({
      name: option.name || '',
      priceModifier: option.priceModifier?.toString() || '0',
      isDefault: option.isDefault ?? false,
      isActive: option.isActive ?? true,
      sortOrder: option.sortOrder?.toString() || '0',
    });
    setOptionDialogOpen(true);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionForm.name.trim()) return;
    const payload = {
      productId: productId!,
      groupId: activeGroupId,
      name: optionForm.name.trim(),
      priceModifier: parseFloat(optionForm.priceModifier) || 0,
      isDefault: optionForm.isDefault,
      isActive: optionForm.isActive,
      sortOrder: parseInt(optionForm.sortOrder) || 0,
    };
    try {
      if (editingOptionId) {
        await updateOption.mutateAsync({ ...payload, optionId: editingOptionId });
        toast.success('Option updated');
      } else {
        await createOption.mutateAsync(payload);
        toast.success('Option created');
      }
      setOptionDialogOpen(false);
    } catch {
      toast.error(editingOptionId ? 'Failed to update option' : 'Failed to create option');
    }
  };

  const handleDeleteOption = async (groupId: string, optionId: string, optionName: string) => {
    const confirmed = await confirm(
      'Delete Option',
      `Delete "${optionName}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteOption.mutateAsync({ productId: productId!, groupId, optionId });
      toast.success('Option deleted');
    } catch {
      toast.error('Failed to delete option');
    }
  };

  const handleToggleOptionActive = async (groupId: string, option: any) => {
    try {
      await updateOption.mutateAsync({
        productId: productId!,
        groupId,
        optionId: option.id,
        isActive: !option.isActive,
      });
      toast.success(option.isActive ? 'Option deactivated' : 'Option activated');
    } catch {
      toast.error('Failed to update option');
    }
  };

  return (
    <PageContainer
      title="Product Options"
      subtitle="Configure option groups and choices for this product"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              setGroupForm(emptyGroupForm);
              setGroupDialogOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
          >
            <Plus size={16} />
            Add Group
          </button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading option groups..." />
      ) : (groups ?? []).length === 0 ? (
        <div className="py-12 text-center">
          <GripVertical size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No option groups yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(groups ?? []).map((group: any) => (
            <div
              key={group.id}
              className="rounded-xl border border-[#8b4513]/10 bg-white shadow-sm"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-[#3e2723]">{group.name}</h3>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                    {group.type}
                  </span>
                  {group.isRequired && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openAddOption(group.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8b4513] transition-all hover:bg-[#faf3e8]"
                  >
                    <Plus size={14} />
                    Add Option
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Options Table */}
              {(group.options ?? []).length === 0 ? (
                <p className="px-6 py-4 text-center text-sm text-gray-400">
                  No options in this group
                </p>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#faf3e8]/30">
                        <th className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Name
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Price Modifier
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Default
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Active
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Sort
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(group.options ?? []).map((option: any) => (
                        <tr key={option.id} className="border-b border-gray-50">
                          <td className="px-6 py-2.5 text-sm font-medium text-[#3e2723]">
                            {option.name}
                          </td>
                          <td className="px-4 py-2.5">
                            {option.priceModifier ? (
                              <span className="font-mono text-sm text-[#3e2723]">
                                {option.priceModifier > 0 ? '+' : ''}
                                <CurrencyDisplay amount={option.priceModifier} size="sm" />
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">&mdash;</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {option.isDefault ? (
                              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Yes
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleOptionActive(group.id, option)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                option.isActive ? 'bg-[#8b4513]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  option.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-sm text-gray-500">
                            {option.sortOrder ?? 0}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openEditOption(group.id, option)}
                                className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteOption(group.id, option.id, option.name)
                                }
                                className="rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {ConfirmationDialog}

      {/* Add Group Dialog */}
      {groupDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setGroupDialogOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setGroupDialogOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h2 className="text-lg font-semibold text-[#3e2723]">Add Option Group</h2>
            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Name *</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="e.g. Size, Milk Type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Type</label>
                <select
                  value={groupForm.type}
                  onChange={(e) => setGroupForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  <option value="single">Single Select</option>
                  <option value="multiple">Multiple Select</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupForm.isRequired}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, isRequired: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm text-[#5d4037]">Required</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGroupDialogOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroup.isPending}
                  className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  {createGroup.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Option Dialog */}
      {optionDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOptionDialogOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOptionDialogOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h2 className="text-lg font-semibold text-[#3e2723]">
              {editingOptionId ? 'Edit Option' : 'Add Option'}
            </h2>
            <form onSubmit={handleSaveOption} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Name *</label>
                <input
                  type="text"
                  required
                  value={optionForm.name}
                  onChange={(e) => setOptionForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="e.g. Large, Oat Milk"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">
                    Price Modifier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={optionForm.priceModifier}
                    onChange={(e) =>
                      setOptionForm((f) => ({ ...f, priceModifier: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    value={optionForm.sortOrder}
                    onChange={(e) =>
                      setOptionForm((f) => ({ ...f, sortOrder: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optionForm.isDefault}
                    onChange={(e) =>
                      setOptionForm((f) => ({ ...f, isDefault: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                  />
                  <span className="text-sm text-[#5d4037]">Default</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optionForm.isActive}
                    onChange={(e) =>
                      setOptionForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                  />
                  <span className="text-sm text-[#5d4037]">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOptionDialogOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOption.isPending || updateOption.isPending}
                  className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  {(createOption.isPending || updateOption.isPending)
                    ? 'Saving...'
                    : editingOptionId
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
