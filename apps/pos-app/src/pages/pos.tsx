import { useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Coffee,
  Croissant,
  Wheat,
  Cake,
  IceCreamCone,
  Cookie,
  Sandwich,
  UtensilsCrossed,
  RefreshCw,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useCategories, useProducts, useCreateOrder, useCreatePayment, useUpdateOrderStatus } from '@bake-app/react/api-client';
import { ProductCard, CurrencyDisplay, LoadingSpinner } from '@bake-app/react/ui';
import { useCartStore, selectSubtotal, selectTax, selectTotal, selectTotalItems } from '@bake-app/react/store';
import { useAuth } from '@bake-app/react/auth';
import { PaymentDialog, type PaymentResult } from '../components/payment-dialog';

const categoryIconMap: Record<string, React.ReactNode> = {
  coffee: <Coffee size={16} />,
  pastries: <Croissant size={16} />,
  bread: <Wheat size={16} />,
  cakes: <Cake size={16} />,
  desserts: <IceCreamCone size={16} />,
  cookies: <Cookie size={16} />,
  sandwiches: <Sandwich size={16} />,
};

function getCategoryIcon(name: string): React.ReactNode {
  const key = name.toLowerCase();
  return categoryIconMap[key] ?? <UtensilsCrossed size={16} />;
}

export function PosPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Data
  const { data: categories, isLoading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useCategories();
  const { data: productsResponse, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({ limit: 100 });

  // Mutations
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();
  const updateStatus = useUpdateOrderStatus();

  // Cart
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore(selectSubtotal);
  const tax = useCartStore(selectTax);
  const total = useCartStore(selectTotal);
  const totalItems = useCartStore(selectTotalItems);

  // Filtered products
  const products = productsResponse?.data ?? [];
  const activeCategories = categories ?? [];

  const filteredProducts = useMemo(() => {
    if (activeCategories.length === 0) return products;
    // Index 0 = "All"
    if (selectedCategoryIndex === 0) return products;
    const cat = activeCategories[selectedCategoryIndex - 1];
    if (!cat) return products;
    return products.filter((p) => p.categoryId === cat.id);
  }, [products, activeCategories, selectedCategoryIndex]);

  const isLoading = categoriesLoading || productsLoading;
  const hasError = categoriesError || productsError;

  // Payment flow
  async function handlePayment(result: PaymentResult) {
    setProcessing(true);
    try {
      // 1. Create order
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: new BigNumber(item.product.price).times(item.quantity).toNumber(),
      }));

      const order = await createOrder.mutateAsync({
        type: 'dine_in',
        status: 'pending',
        items: orderItems,
        subtotal,
        tax,
        total,
        discount: 0,
      } as any);

      // 2. Create payment
      await createPayment.mutateAsync({
        orderId: order.id,
        method: result.method,
        amount: result.amountPaid,
        status: 'completed',
      });

      // 3. Update order status
      await updateStatus.mutateAsync({ id: order.id, status: 'confirmed' });

      // 4. Clear cart
      clearCart();

      // 5. Success toast
      const changeMsg =
        result.method === 'cash' && result.change > 0
          ? ` | Change: $${result.change.toFixed(2)}`
          : '';
      toast.success(`Order #${order.orderNumber} completed!${changeMsg}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Payment failed. Please try again.',
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleRetry() {
    refetchCategories();
    refetchProducts();
  }

  return (
    <div className="flex h-screen bg-[#faf3e8]">
      {/* Left panel — Products */}
      <div className="flex flex-[6] flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#8b4513]/10">
          <div className="flex items-center gap-3">
            <Croissant className="text-[#8b4513]" size={28} strokeWidth={1.5} />
            <h1 className="text-xl font-bold text-[#3e2723]">Bake POS</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#5d4037]
                bg-[#faf3e8] rounded-lg border border-[#8b4513]/10 hover:bg-[#f5e6d0]
                transition-colors cursor-pointer"
            >
              <ClipboardList size={16} />
              Orders
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#5d4037]
                bg-[#faf3e8] rounded-lg border border-[#8b4513]/10 hover:bg-[#f5e6d0]
                transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-6 py-3 overflow-x-auto bg-white border-b border-[#8b4513]/10 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryIndex(0)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full
              border transition-colors cursor-pointer ${
                selectedCategoryIndex === 0
                  ? 'bg-[#8b4513] text-white border-[#8b4513]'
                  : 'bg-white text-[#5d4037] border-[#8b4513]/15 hover:bg-[#faf3e8]'
              }`}
          >
            <UtensilsCrossed size={16} />
            All
          </button>
          {activeCategories.map((cat, idx) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryIndex(idx + 1)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full
                border transition-colors cursor-pointer ${
                  selectedCategoryIndex === idx + 1
                    ? 'bg-[#8b4513] text-white border-[#8b4513]'
                    : 'bg-white text-[#5d4037] border-[#8b4513]/15 hover:bg-[#faf3e8]'
                }`}
            >
              {getCategoryIcon(cat.name)}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSpinner message="Loading products..." />
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-red-600 text-sm font-medium">Failed to load products</p>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                  bg-[#8b4513] rounded-lg border-none hover:bg-[#5d4037] transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  price={product.price}
                  category={product.category?.name}
                  onAddToCart={() =>
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      category: product.category?.name ?? '',
                    })
                  }
                />
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-sm">No products in this category</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — Cart */}
      <div className="flex flex-col flex-[4] min-w-[340px] max-w-[440px] bg-white border-l border-[#8b4513]/10">
        {/* Cart header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#8b4513]/10">
          <ShoppingCart className="text-[#8b4513]" size={22} />
          <h2 className="text-lg font-bold text-[#3e2723]">Current Order</h2>
          {totalItems > 0 && (
            <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-[#8b4513] px-2 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="text-base font-medium text-gray-500">No items yet</p>
              <p className="text-sm text-gray-400">Tap a product to add it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#faf3e8]/60 border border-[#8b4513]/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#3e2723] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm font-mono text-[#5d4037]">
                      ${item.product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => decrementItem(idx)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border-none
                        cursor-pointer transition-colors ${
                          item.quantity <= 1
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-[#8b4513]/10 text-[#5d4037] hover:bg-[#8b4513]/20'
                        }`}
                      aria-label={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                    >
                      {item.quantity <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-[#3e2723]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementItem(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg
                        bg-[#8b4513]/10 text-[#5d4037] hover:bg-[#8b4513]/20
                        border-none cursor-pointer transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals and actions */}
        {items.length > 0 && (
          <div className="border-t border-[#8b4513]/10 px-6 py-4 space-y-3">
            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-[#5d4037]">
                <span>Subtotal</span>
                <CurrencyDisplay amount={subtotal} size="sm" />
              </div>
              <div className="flex items-center justify-between text-sm text-[#5d4037]">
                <span>Tax (12%)</span>
                <CurrencyDisplay amount={tax} size="sm" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#8b4513]/10">
                <span className="text-base font-bold text-[#3e2723]">Grand Total</span>
                <CurrencyDisplay amount={total} size="lg" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="flex-1 py-3 text-sm font-semibold text-[#8b4513] bg-white
                  border-2 border-[#8b4513]/30 rounded-xl hover:bg-[#faf3e8]
                  transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                disabled={processing}
                className="flex-[2] py-3 text-base font-bold text-white bg-green-600
                  rounded-xl border-none hover:bg-green-700 transition-colors cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                PAY ${total.toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        itemCount={totalItems}
        onConfirm={handlePayment}
      />
    </div>
  );
}
