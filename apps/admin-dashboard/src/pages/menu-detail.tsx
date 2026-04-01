import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Search, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@bake-app/shared-types';
import {
  useMenu,
  useProducts,
  useAddMenuProduct,
  useRemoveMenuProduct,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  EmptyState,
  CurrencyDisplay,
  useConfirmation,
} from '@bake-app/react/ui';

export function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: menu, isLoading: menuLoading } = useMenu(id!);
  const { data: productsResponse } = useProducts({ limit: 500 });
  const addProduct = useAddMenuProduct();
  const removeProduct = useRemoveMenuProduct();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  const allProducts = productsResponse?.data ?? [];

  const assignedProductIds = useMemo(() => {
    return new Set(menu?.menuProducts?.map((mp) => mp.productId) ?? []);
  }, [menu]);

  const filteredAvailable = useMemo(() => {
    return allProducts
      .filter((p) => !assignedProductIds.has(p.id))
      .filter(
        (p) =>
          !productSearch.trim() ||
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearch.toLowerCase()),
      );
  }, [allProducts, assignedProductIds, productSearch]);

  const handleAddProduct = async (product: Product) => {
    try {
      await addProduct.mutateAsync({
        menuId: id!,
        productId: product.id,
      });
      toast.success(`Added "${product.name}" to menu`);
    } catch {
      toast.error('Failed to add product');
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

  return (
    <PageContainer
      title={menu.name}
      subtitle={menu.description || 'Menu details and products'}
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
          <button
            type="button"
            onClick={() => setShowProductPicker(true)}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      }
    >
      {/* Assigned Products List */}
      {assignedProducts.length === 0 ? (
        <EmptyState
          title="No products assigned"
          message="Add products to this menu to get started."
          action={{ label: 'Add Product', onClick: () => setShowProductPicker(true) }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#8b4513]/10 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                  Price
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {assignedProducts.map((mp, idx) => {
                const product = mp.product;
                return (
                  <tr
                    key={mp.id}
                    className={`border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf3e8] text-[#8b4513]">
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#3e2723]">
                            {product?.name ?? 'Unknown Product'}
                          </p>
                          {product?.sku && (
                            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product ? <CurrencyDisplay amount={product.price} size="sm" /> : '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {product?.category?.name ?? '\u2014'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveProduct(
                            mp.productId,
                            product?.name ?? 'this product',
                          )
                        }
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

      {ConfirmationDialog}

      {/* Product Picker Dialog */}
      {showProductPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setShowProductPicker(false);
            setProductSearch('');
          }}
        >
          <div
            className="relative mx-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h2 className="text-lg font-semibold text-[#3e2723]">
                Add Product to Menu
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowProductPicker(false);
                  setProductSearch('');
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                &times;
              </button>
            </div>

            <div className="border-b border-gray-100 px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredAvailable.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  {productSearch
                    ? 'No matching products found'
                    : 'All products are already in this menu'}
                </div>
              ) : (
                filteredAvailable.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#faf3e8]/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#3e2723]">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {product.category?.name ?? 'No category'}
                        {product.sku ? ` \u00b7 ${product.sku}` : ''}
                      </p>
                    </div>
                    <CurrencyDisplay amount={product.price} size="sm" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
