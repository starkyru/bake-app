import { useState } from 'react';
import { Plus, Pencil, Trash2, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  usePaymentConfigs,
  useCreatePaymentConfig,
  useUpdatePaymentConfig,
  useDeletePaymentConfig,
} from '@bake-app/react/api-client';
import { useLocations } from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

interface PaymentForm {
  provider: string;
  locationId: string;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  sandbox: boolean;
}

const emptyForm: PaymentForm = {
  provider: 'stripe',
  locationId: '',
  publicKey: '',
  secretKey: '',
  webhookSecret: '',
  sandbox: true,
};

export function PaymentConfigPage() {
  const { data: configs, isLoading } = usePaymentConfigs() as { data: any[]; isLoading: boolean };
  const { data: locations } = useLocations();
  const createConfig = useCreatePaymentConfig();
  const updateConfig = useUpdatePaymentConfig();
  const deleteConfig = useDeletePaymentConfig();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (config: any) => {
    setEditingId(config.id);
    setForm({
      provider: config.provider || 'stripe',
      locationId: config.locationId || '',
      publicKey: config.publicKey || '',
      secretKey: config.secretKey || '',
      webhookSecret: config.webhookSecret || '',
      sandbox: config.sandbox ?? true,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provider || !form.locationId) {
      toast.error('Provider and location are required');
      return;
    }
    try {
      if (editingId) {
        await updateConfig.mutateAsync({ id: editingId, ...form });
        toast.success('Payment config updated');
      } else {
        await createConfig.mutateAsync(form);
        toast.success('Payment config created');
      }
      closeDialog();
    } catch {
      toast.error(editingId ? 'Failed to update config' : 'Failed to create config');
    }
  };

  const handleDelete = async (config: any) => {
    const confirmed = await confirm(
      'Delete Payment Config',
      `Delete the ${config.provider} config for this location? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteConfig.mutateAsync(config.id);
      toast.success('Payment config deleted');
    } catch {
      toast.error('Failed to delete config');
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium capitalize text-[#3e2723]">
          <CreditCard size={14} className="text-[#8b4513]" />
          {value}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (_: unknown, row: any) => (
        <span className="text-sm text-gray-600">
          {row.location?.name || locations?.find((l: any) => l.id === row.locationId)?.name || '\u2014'}
        </span>
      ),
    },
    {
      key: 'publicKey',
      label: 'Public Key',
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-500">
          {value ? `${value.substring(0, 12)}...` : '\u2014'}
        </span>
      ),
    },
    {
      key: 'sandbox',
      label: 'Mode',
      render: (value: boolean) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            value
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-green-200 bg-green-100 text-green-800'
          }`}
        >
          {value ? 'Sandbox' : 'Live'}
        </span>
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
          onClick: (row: any) => openEdit(row),
        },
        {
          action: 'delete',
          icon: <Trash2 size={16} />,
          tooltip: 'Delete',
          color: 'text-red-400 hover:text-red-600',
          onClick: (row: any) => handleDelete(row),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Payment Configuration"
      subtitle="Manage payment provider settings for online ordering"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Provider
        </button>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading payment configs..." />
      ) : (
        <DataTable
          columns={columns}
          data={configs ?? []}
          searchable
          searchPlaceholder="Search payment configs..."
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
            className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
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
              {editingId ? 'Edit Payment Config' : 'Add Payment Provider'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Provider *</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Location *</label>
                  <select
                    value={form.locationId}
                    onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  >
                    <option value="">Select location...</option>
                    {(locations ?? []).map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Public Key</label>
                <input
                  type="text"
                  value={form.publicKey}
                  onChange={(e) => setForm((f) => ({ ...f, publicKey: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="pk_test_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Secret Key</label>
                <input
                  type="password"
                  value={form.secretKey}
                  onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="sk_test_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Webhook Secret</label>
                <input
                  type="password"
                  value={form.webhookSecret}
                  onChange={(e) => setForm((f) => ({ ...f, webhookSecret: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="whsec_..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sandbox}
                  onChange={(e) => setForm((f) => ({ ...f, sandbox: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm text-[#5d4037]">Sandbox / Test Mode</span>
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
                  disabled={createConfig.isPending || updateConfig.isPending}
                  className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  {(createConfig.isPending || updateConfig.isPending)
                    ? 'Saving...'
                    : editingId
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
