import { useState, useCallback, type FormEvent } from 'react';
import { Pencil, Trash2, UserPlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useRoles,
} from '@bake-app/react/api-client';
import { DataTable, useConfirmation } from '@bake-app/react/ui';
import type { TableColumn } from '@bake-app/react/ui';
import type { User } from '@bake-app/shared-types';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  isActive: boolean;
}

const emptyForm: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: '',
  isActive: true,
};

export function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirm, ConfirmationDialog: confirmDialog } = useConfirmation();

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((user: User) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      roleId: (user.role as any)?.id ?? '',
      isActive: user.isActive,
    });
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (user: User) => {
      const confirmed = await confirm(
        'Delete User',
        `Are you sure you want to delete "${user.firstName} ${user.lastName}"? This action cannot be undone.`,
        { variant: 'danger', confirmText: 'Delete' },
      );
      if (!confirmed) return;

      deleteUser.mutate(user.id, {
        onSuccess: () => toast.success('User deleted successfully'),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Failed to delete user'),
      });
    },
    [confirm, deleteUser],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);

    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      roleId: form.roleId || undefined,
      isActive: form.isActive,
    };

    if (editingUser) {
      updateUser.mutate(
        { id: editingUser.id, ...payload },
        {
          onSuccess: () => {
            toast.success('User updated successfully');
            setDialogOpen(false);
            setSaving(false);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Failed to update user');
            setSaving(false);
          },
        },
      );
    } else {
      if (form.password) {
        payload.password = form.password;
      }
      createUser.mutate(payload, {
        onSuccess: () => {
          toast.success('User created successfully');
          setDialogOpen(false);
          setSaving(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to create user');
          setSaving(false);
        },
      });
    }
  };

  const updateField = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_val: any, row: User) => (
        <span className="font-medium text-[#3e2723]">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role.name',
      label: 'Role',
      render: (val: any) => (
        <span className="inline-flex items-center rounded-full bg-[#faf3e8] px-2.5 py-0.5 text-xs font-medium text-[#8b4513] capitalize">
          {val ? String(val).toLowerCase().replace(/_/g, ' ') : 'N/A'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val: boolean) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            val
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {val ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      type: 'actions',
      width: '100px',
      sortable: false,
      actions: [
        {
          action: 'edit',
          icon: <Pencil className="h-4 w-4" />,
          tooltip: 'Edit user',
          onClick: (row: User) => openEditDialog(row),
        },
        {
          action: 'delete',
          icon: <Trash2 className="h-4 w-4" />,
          color: 'text-red-400 hover:text-red-600',
          tooltip: 'Delete user',
          onClick: (row: User) => handleDelete(row),
        },
      ],
    },
  ];

  const isFormValid =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.email.trim() !== '' &&
    (editingUser || form.password.trim() !== '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3e2723]">Users</h1>
        <button
          type="button"
          onClick={openCreateDialog}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2.5 text-sm font-medium text-white
            transition-colors hover:bg-[#7a3b10]"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users as User[]}
        loading={isLoading}
        searchable
        searchPlaceholder="Search users..."
      />

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDialogOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3e2723]">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#5d4037]">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d7ccc8] px-3 py-2.5 text-sm text-[#3e2723]
                      focus:border-[#8b4513] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#5d4037]">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d7ccc8] px-3 py-2.5 text-sm text-[#3e2723]
                      focus:border-[#8b4513] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#5d4037]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#d7ccc8] px-3 py-2.5 text-sm text-[#3e2723]
                    focus:border-[#8b4513] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#5d4037]">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d7ccc8] px-3 py-2.5 text-sm text-[#3e2723]
                      focus:border-[#8b4513] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-[#5d4037]">Role</label>
                <select
                  value={form.roleId}
                  onChange={(e) => updateField('roleId', e.target.value)}
                  className="w-full rounded-lg border border-[#d7ccc8] px-3 py-2.5 text-sm text-[#3e2723]
                    focus:border-[#8b4513] focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20"
                >
                  <option value="">Select role...</option>
                  {(roles as any[]).map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] focus:ring-[#8b4513]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[#5d4037]">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600
                    transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || saving}
                  className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white
                    transition-colors hover:bg-[#7a3b10] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
