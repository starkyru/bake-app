import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Search, Trash2, Package, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@bake-app/shared-types';
import {
  useMenu,
  useUpdateMenu,
  useProducts,
  useAddMenuProduct,
  useRemoveMenuProduct,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  EmptyState,
  CurrencyDisplay,
  Modal,
  useConfirmation,
} from '@bake-app/react/ui';

type Tab = 'details' | 'products';

export function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: menu, isLoading: menuLoading } = useMenu(id!);
  const updateMenu = useUpdateMenu();
  const { data: productsResponse } = useProducts({ limit: 500 });
  const addProduct = useAddMenuProduct();
  const removeProduct = useRemoveMenuProduct();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [addingProducts, setAddingProducts] = useState(false);

  // Edit form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (menu) {
      setName(menu.name);
      setDescription(menu.description ?? '');
      setIsActive(menu.isActive);
    }
  }, [menu]);

  const allProducts = productsResponse ?? [];

  const assignedProductIds = useMemo(() => {
    return new Set(menu?.menuProducts?.map((mp) => mp.productId) ?? []);
  }, [menu]);

  const availableProducts = useMemo(() => {
    return allProducts.filter((p) => !assignedProductIds.has(p.id));
  }, [allProducts, assignedProductIds]);

  const filteredAvailable = useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const q = productSearch.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q),
    );
  }, [availableProducts, productSearch]);

  const openProductPicker = () => {
    setProductSearch('');
    setSelectedProductIds(new Set());
    setShowProductPicker(true);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleAddSelectedProducts = async () => {
    if (selectedProductIds.size === 0) return;
    setAddingProducts(true);
    try {
      for (const productId of selectedProductIds) {
        await addProduct.mutateAsync({ menuId: id!, productId });
      }
      toast.success(`${selectedProductIds.size} product${selectedProductIds.size > 1 ? 's' : ''} added`);
      setShowProductPicker(false);
    } catch {
      toast.error('Failed to add products');
    } finally {
      setAddingProducts(false);
    }
  };

  const handleRemoveProduct = async (productId: string, productName: string) => {
    const confirmed = await confirm(
      'Remove Product',
      `Remove "${productName}" from this menu?`,
      { variant: 'danger', confirmText: 'Remove' },
    );
    if (!confirmed) return;
    try {
      await removeProduct.mutateAsync({ menuId: id!, productId });
      toast.success('Product removed from menu');
    } catch {
      toast.error('Failed to remove product');
    }
  };

  const handleSaveDetails = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await updateMenu.mutateAsync({
        id: id!,
        name: name.trim(),
        description: description.trim() || undefined,
        isActive,
      });
      toast.success('Menu updated');
    } catch {
      toast.error('Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  if (menuLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading menu..." />
      </PageContainer>
    );
  }

  if (!menu) {
    return (
      <PageContainer>
        <EmptyState title="Menu not found" message="The requested menu does not exist." />
      </PageContainer>
    );
  }

  const assignedProducts = menu.menuProducts ?? [];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'products', label: 'Products', count: assignedProducts.length },
    { key: 'details', label: 'Settings' },
  ];

  return (
    <PageContainer
      title={menu.name}
      subtitle={menu.description || 'Manage menu products and settings'}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {activeTab === 'products' && (
            <button
              type="button"
              onClick={openProductPicker}
              className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
            >
              <Plus size={16} />
              Add Products
            </button>
          )}
          {activeTab === 'details' && (
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-[#3e2723] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.key === 'details' && <Settings2 size={14} />}
            {tab.key === 'products' && <Package size={14} />}
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-[#faf3e8] px-1.5 py-0.5 text-xs font-medium text-[#8b4513]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {assignedProducts.length === 0 ? (
            <EmptyState
              title="No products assigned"
              message="Add products to this menu to get started."
              action={{ label: 'Add Products', onClick: openProductPicker }}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#8b4513]/10 bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">Product</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-20" />
                  </tr>
                </thead>
                <tbody>
                  {assignedProducts.map((mp, idx) => {
                    const product = mp.product;
                    return (
                      <tr key={mp.id} className={`border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf3e8] text-[#8b4513]">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#3e2723]">{product?.name ?? 'Unknown'}</p>
                              {product?.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {product ? <CurrencyDisplay amount={product.price} size="sm" /> : '\u2014'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product?.category?.name ?? '\u2014'}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(mp.productId, product?.name ?? 'this product')}
                            className="rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                            title="Remove from menu"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="max-w-lg rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[#3e2723]">Menu Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5d4037]">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5d4037]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
              />
              <span className="text-sm text-[#5d4037]">Active</span>
            </label>
          </div>
        </div>
      )}

      {ConfirmationDialog}

      {/* Product Picker Modal */}
      <Modal
        open={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        title="Add Products"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowProductPicker(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSelectedProducts}
              disabled={selectedProductIds.size === 0 || addingProducts}
              className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingProducts
                ? 'Adding...'
                : `Add${selectedProductIds.size > 0 ? ` (${selectedProductIds.size})` : ''}`}
            </button>
          </>
        }
      >
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
            autoFocus
          />
        </div>

        {availableProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">All products are already in this menu</p>
        ) : filteredAvailable.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No products match your search</p>
        ) : (
          <div className="space-y-1">
            {filteredAvailable.map((product) => (
              <label
                key={product.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#faf3e8]/60"
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.has(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#3e2723]">{product.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {product.category?.name ?? 'No category'}
                    {product.sku ? ` \u00b7 ${product.sku}` : ''}
                  </span>
                </div>
                <CurrencyDisplay amount={product.price} size="sm" />
              </label>
            ))}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
