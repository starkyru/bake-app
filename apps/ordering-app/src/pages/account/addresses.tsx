import { useState } from 'react';
import { MapPin, Plus, Trash2, Edit2, X } from 'lucide-react';
import {
  useCustomerAddresses,
  useCreateAddress,
  useDeleteAddress,
} from '@bake-app/react/api-client';
import { toast } from 'sonner';

interface AddressData {
  id: string;
  label: string;
  street: string;
  city: string;
  state?: string;
  zip: string;
  isDefault: boolean;
}

export function AddressesPage() {
  const { data, isLoading } = useCustomerAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();

  const addresses = (data as AddressData[] | undefined) ?? [];

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const resetForm = () => {
    setLabel('Home');
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setShowForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !zip) return;
    try {
      await createAddress.mutateAsync({
        label,
        street,
        city,
        state: state || undefined,
        zip,
        isDefault: addresses.length === 0,
      });
      toast.success('Address added');
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.success('Address removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove address');
    }
  };

  const inputStyle = {
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    '--tw-ring-color': 'var(--color-primary)',
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Addresses
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-full px-4 py-2 text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Add Address'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 p-4"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-card)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Street Address
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                placeholder="123 Main St"
                className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                  className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={createAddress.isPending}
            className="mt-4 h-10 rounded-full px-6 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {createAddress.isPending ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="py-12 text-center">
          <MapPin className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No saved addresses yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between p-4"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-card)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>
                    {addr.street}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {addr.city}
                    {addr.state ? `, ${addr.state}` : ''} {addr.zip}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  aria-label="Edit address"
                >
                  <Edit2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete address"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
