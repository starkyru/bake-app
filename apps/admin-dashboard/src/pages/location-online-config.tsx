import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Save, X, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  useLocations,
  useLocationConfig,
  useUpdateLocationConfig,
  useLocationMenus,
  useAssignMenuToLocation,
  useRemoveMenuFromLocation,
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
  useMenus,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  EmptyState,
  CurrencyDisplay,
  useConfirmation,
} from '@bake-app/react/ui';

const FULFILLMENT_METHODS = [
  { key: 'pickup', label: 'Pickup' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'dineInQr', label: 'Dine-in QR' },
];

interface DeliveryZoneForm {
  name: string;
  fee: string;
  minimumOrder: string;
  estimatedMinutes: string;
}

const emptyZoneForm: DeliveryZoneForm = {
  name: '',
  fee: '0',
  minimumOrder: '0',
  estimatedMinutes: '30',
};

export function LocationOnlineConfigPage() {
  const { data: locations, isLoading: locationsLoading } = useLocations() as { data: any[]; isLoading: boolean };
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const { data: config, isLoading: configLoading } = useLocationConfig(selectedLocationId) as { data: any; isLoading: boolean };
  const updateConfig = useUpdateLocationConfig();
  const { data: locationMenus } = useLocationMenus(selectedLocationId) as { data: any[] };
  const assignMenu = useAssignMenuToLocation();
  const removeMenu = useRemoveMenuFromLocation();
  const { data: deliveryZones } = useDeliveryZones(selectedLocationId) as { data: any[] };
  const createZone = useCreateDeliveryZone();
  const updateZone = useUpdateDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();
  const { data: allMenus } = useMenus();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [configForm, setConfigForm] = useState({
    onlineOrderingEnabled: false,
    fulfillmentMethods: [] as string[],
    preorderEnabled: false,
    preorderDaysAhead: 7,
    taxRate: '',
  });
  const [saving, setSaving] = useState(false);
  const [showMenuPicker, setShowMenuPicker] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [zoneForm, setZoneForm] = useState<DeliveryZoneForm>(emptyZoneForm);

  // Set first location as default
  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Sync config form with fetched data
  useEffect(() => {
    if (config) {
      setConfigForm({
        onlineOrderingEnabled: config.onlineOrderingEnabled ?? false,
        fulfillmentMethods: config.fulfillmentMethods ?? [],
        preorderEnabled: config.preorderEnabled ?? false,
        preorderDaysAhead: config.preorderDaysAhead ?? 7,
        taxRate: config.taxRate?.toString() ?? '',
      });
    }
  }, [config]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await updateConfig.mutateAsync({
        locationId: selectedLocationId,
        onlineOrderingEnabled: configForm.onlineOrderingEnabled,
        fulfillmentMethods: configForm.fulfillmentMethods,
        preorderEnabled: configForm.preorderEnabled,
        preorderDaysAhead: configForm.preorderDaysAhead,
        taxRate: configForm.taxRate ? parseFloat(configForm.taxRate) : undefined,
      });
      toast.success('Location config saved');
    } catch {
      toast.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const toggleFulfillment = (method: string) => {
    setConfigForm((f) => ({
      ...f,
      fulfillmentMethods: f.fulfillmentMethods.includes(method)
        ? f.fulfillmentMethods.filter((m) => m !== method)
        : [...f.fulfillmentMethods, method],
    }));
  };

  const handleAssignMenu = async (menuId: string) => {
    try {
      await assignMenu.mutateAsync({ locationId: selectedLocationId, menuId });
      toast.success('Menu assigned');
      setShowMenuPicker(false);
    } catch {
      toast.error('Failed to assign menu');
    }
  };

  const handleRemoveMenu = async (menuId: string, menuName: string) => {
    const confirmed = await confirm(
      'Remove Menu',
      `Remove "${menuName}" from this location?`,
      { variant: 'danger', confirmText: 'Remove' },
    );
    if (!confirmed) return;
    try {
      await removeMenu.mutateAsync({ locationId: selectedLocationId, menuId });
      toast.success('Menu removed');
    } catch {
      toast.error('Failed to remove menu');
    }
  };

  const openCreateZone = () => {
    setEditingZone(null);
    setZoneForm(emptyZoneForm);
    setZoneDialogOpen(true);
  };

  const openEditZone = (zone: any) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name || '',
      fee: zone.fee?.toString() || '0',
      minimumOrder: zone.minimumOrder?.toString() || '0',
      estimatedMinutes: zone.estimatedMinutes?.toString() || '30',
    });
    setZoneDialogOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.name.trim()) return;
    try {
      const payload = {
        locationId: selectedLocationId,
        name: zoneForm.name.trim(),
        fee: parseFloat(zoneForm.fee) || 0,
        minimumOrder: parseFloat(zoneForm.minimumOrder) || 0,
        estimatedMinutes: parseInt(zoneForm.estimatedMinutes) || 30,
      };
      if (editingZone) {
        await updateZone.mutateAsync({ zoneId: editingZone.id, ...payload });
        toast.success('Delivery zone updated');
      } else {
        await createZone.mutateAsync(payload);
        toast.success('Delivery zone created');
      }
      setZoneDialogOpen(false);
    } catch {
      toast.error(editingZone ? 'Failed to update zone' : 'Failed to create zone');
    }
  };

  const handleDeleteZone = async (zone: any) => {
    const confirmed = await confirm(
      'Delete Delivery Zone',
      `Delete "${zone.name}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteZone.mutateAsync({ locationId: selectedLocationId, zoneId: zone.id });
      toast.success('Delivery zone deleted');
    } catch {
      toast.error('Failed to delete zone');
    }
  };

  if (locationsLoading) {
    return (
      <PageContainer title="Online Config" subtitle="Configure online ordering by location">
        <LoadingSpinner message="Loading locations..." />
      </PageContainer>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <PageContainer title="Online Config" subtitle="Configure online ordering by location">
        <EmptyState
          title="No locations"
          message="Create a location in Settings first to configure online ordering."
        />
      </PageContainer>
    );
  }

  const assignedMenuIds = new Set(
    (locationMenus ?? []).map((lm: any) => lm.menuId || lm.menu?.id),
  );
  const availableMenus = (allMenus ?? []).filter(
    (m: any) => !assignedMenuIds.has(m.id),
  );

  return (
    <PageContainer title="Online Config" subtitle="Configure online ordering by location">
      {/* Location Selector */}
      <div className="mb-6">
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#3e2723] shadow-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        >
          {locations.map((loc: any) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {configLoading ? (
        <LoadingSpinner message="Loading config..." />
      ) : (
        <div className="space-y-6">
          {/* General Config */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">General Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.onlineOrderingEnabled}
                  onChange={(e) =>
                    setConfigForm((f) => ({
                      ...f,
                      onlineOrderingEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm font-medium text-[#3e2723]">
                  Enable Online Ordering
                </span>
              </label>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fulfillment Methods
                </label>
                <div className="flex flex-wrap gap-3">
                  {FULFILLMENT_METHODS.map((fm) => (
                    <label key={fm.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.fulfillmentMethods.includes(fm.key)}
                        onChange={() => toggleFulfillment(fm.key)}
                        className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                      />
                      <span className="text-sm text-[#5d4037]">{fm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.preorderEnabled}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        preorderEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                  />
                  <span className="text-sm text-[#5d4037]">Enable Preorders</span>
                </label>
                {configForm.preorderEnabled && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Days Ahead
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={configForm.preorderDaysAhead}
                      onChange={(e) =>
                        setConfigForm((f) => ({
                          ...f,
                          preorderDaysAhead: parseInt(e.target.value) || 7,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={configForm.taxRate}
                    onChange={(e) =>
                      setConfigForm((f) => ({ ...f, taxRate: e.target.value }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Menus */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#3e2723]">Assigned Menus</h3>
              <button
                type="button"
                onClick={() => setShowMenuPicker(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#8b4513] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
              >
                <Plus size={14} />
                Add Menu
              </button>
            </div>
            {(locationMenus ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No menus assigned to this location
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                        Menu
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(locationMenus ?? []).map((lm: any) => (
                      <tr key={lm.id || lm.menuId} className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-sm text-[#3e2723]">
                          {lm.menu?.name || lm.menuName || 'Menu'}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveMenu(
                                lm.menuId || lm.menu?.id,
                                lm.menu?.name || 'this menu',
                              )
                            }
                            className="rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delivery Zones */}
          {configForm.fulfillmentMethods.includes('delivery') && (
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
                  <Truck size={16} />
                  Delivery Zones
                </h3>
                <button
                  type="button"
                  onClick={openCreateZone}
                  className="flex items-center gap-1.5 rounded-lg bg-[#8b4513] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
                >
                  <Plus size={14} />
                  Add Zone
                </button>
              </div>
              {(deliveryZones ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  No delivery zones configured
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Zone
                        </th>
                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Fee
                        </th>
                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Min. Order
                        </th>
                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                          Est. Time
                        </th>
                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deliveryZones ?? []).map((zone: any) => (
                        <tr key={zone.id} className="border-b border-gray-50">
                          <td className="px-4 py-2.5 text-sm font-medium text-[#3e2723]">
                            {zone.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <CurrencyDisplay amount={zone.fee} size="sm" />
                          </td>
                          <td className="px-4 py-2.5">
                            <CurrencyDisplay amount={zone.minimumOrder} size="sm" />
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500">
                            {zone.estimatedMinutes ?? '\u2014'} min
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openEditZone(zone)}
                                className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteZone(zone)}
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
          )}
        </div>
      )}

      {ConfirmationDialog}

      {/* Menu Picker Dialog */}
      {showMenuPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowMenuPicker(false)}
        >
          <div
            className="relative mx-4 flex max-h-[60vh] w-full max-w-md flex-col rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h2 className="text-lg font-semibold text-[#3e2723]">Add Menu</h2>
              <button
                type="button"
                onClick={() => setShowMenuPicker(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {availableMenus.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  All menus are already assigned
                </p>
              ) : (
                availableMenus.map((menu: any) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleAssignMenu(menu.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#faf3e8]/60"
                  >
                    <span className="text-sm font-medium text-[#3e2723]">{menu.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zone Dialog */}
      {zoneDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setZoneDialogOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoneDialogOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h2 className="text-lg font-semibold text-[#3e2723]">
              {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </h2>
            <form onSubmit={handleSaveZone} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="e.g. Downtown"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={zoneForm.fee}
                    onChange={(e) => setZoneForm((f) => ({ ...f, fee: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Min. Order</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={zoneForm.minimumOrder}
                    onChange={(e) =>
                      setZoneForm((f) => ({ ...f, minimumOrder: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Est. Min</label>
                  <input
                    type="number"
                    min="1"
                    value={zoneForm.estimatedMinutes}
                    onChange={(e) =>
                      setZoneForm((f) => ({ ...f, estimatedMinutes: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setZoneDialogOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createZone.isPending || updateZone.isPending}
                  className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  {(createZone.isPending || updateZone.isPending)
                    ? 'Saving...'
                    : editingZone
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
