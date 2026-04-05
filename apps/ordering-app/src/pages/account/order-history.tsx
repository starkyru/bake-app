import { useNavigate } from 'react-router';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useOnlineOrderHistory } from '@bake-app/react/api-client';
import { useCustomerCartStore, type CustomerCartProduct } from '@bake-app/react/store';
import { StatusBadge } from '../../components/status-badge';
import { toast } from 'sonner';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product?: {
      id: string;
      name: string;
      price: number;
      category?: { name: string };
    };
  }[];
}

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useOnlineOrderHistory();
  const addItem = useCustomerCartStore((s) => s.addItem);

  const orders = (data as OrderHistoryItem[] | undefined) ?? [];

  const handleReorder = (order: OrderHistoryItem) => {
    let added = 0;
    for (const item of order.items) {
      if (item.product) {
        const cartProduct: CustomerCartProduct = {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          category: item.product.category?.name ?? 'Other',
        };
        for (let i = 0; i < item.quantity; i++) {
          addItem(cartProduct);
          added++;
        }
      }
    }
    if (added > 0) {
      toast.success(`Added ${added} items to cart`);
      navigate('/cart');
    }
  };

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
      <h2 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Order History
      </h2>

      {orders.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No orders yet. Start browsing our menu!
          </p>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="mt-4 rounded-full px-6 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-card)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      #{order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {formatPrice(order.total)}
                </span>
              </div>

              <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                {order.items.length > 0 && (
                  <>
                    {' '}
                    &mdash;{' '}
                    {order.items
                      .slice(0, 3)
                      .map((i) => i.product?.name ?? 'Item')
                      .join(', ')}
                    {order.items.length > 3 && `, +${order.items.length - 3} more`}
                  </>
                )}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order.id}/track`)}
                  className="rounded-full px-4 py-1.5 text-xs font-medium"
                  style={{
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(order)}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <RefreshCw className="h-3 w-3" /> Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
