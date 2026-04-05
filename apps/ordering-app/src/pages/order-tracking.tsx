import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle, Circle, Clock } from 'lucide-react';
import { useOnlineOrder } from '@bake-app/react/api-client';
import { OrderStatus } from '@bake-app/shared-types';
import { StatusBadge } from '../components/status-badge';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

const STATUS_FLOW: { status: string; label: string }[] = [
  { status: OrderStatus.PENDING, label: 'Order Placed' },
  { status: OrderStatus.CONFIRMED, label: 'Confirmed' },
  { status: OrderStatus.IN_PROGRESS, label: 'Being Prepared' },
  { status: OrderStatus.READY_FOR_PICKUP, label: 'Ready for Pickup' },
  { status: OrderStatus.COMPLETED, label: 'Completed' },
];

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product?: { name: string };
  }[];
  createdAt: string;
  updatedAt: string;
}

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useOnlineOrder(orderId ?? '');

  const order = data as OrderData | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Order not found.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === OrderStatus.CANCELLED;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Placed {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Estimated time */}
      {!isCancelled && currentIndex < STATUS_FLOW.length - 1 && (
        <div
          className="mb-6 flex items-center gap-3 p-4"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Clock className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Estimated Time
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Your order should be ready in approximately 30-45 minutes
            </p>
          </div>
        </div>
      )}

      {/* Status timeline */}
      <div
        className="mb-6 p-4"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-card)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Order Progress
        </h3>
        <div className="relative ml-3">
          {/* Vertical line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-0.5"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
          />
          <div className="flex flex-col gap-4">
            {isCancelled ? (
              <div className="flex items-start gap-3">
                <Circle className="relative z-10 mt-0.5 h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-600">Cancelled</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              STATUS_FLOW.map((s, i) => {
                const isComplete = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={s.status} className="flex items-start gap-3">
                    {isComplete ? (
                      <CheckCircle
                        className="relative z-10 mt-0.5 h-4 w-4"
                        style={{ color: 'var(--color-primary)' }}
                      />
                    ) : (
                      <Circle
                        className="relative z-10 mt-0.5 h-4 w-4"
                        style={{ color: 'rgba(0,0,0,0.15)' }}
                      />
                    )}
                    <div>
                      <p
                        className="text-sm"
                        style={{
                          color: isComplete ? 'var(--color-text)' : 'var(--color-text-muted)',
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        {s.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(order.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Order items */}
      <div
        className="p-4"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-card)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Order Summary
        </h3>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-1.5 text-sm">
            <span style={{ color: 'var(--color-text)' }}>
              {item.quantity}x {item.product?.name ?? 'Item'}
            </span>
            <span className="font-mono" style={{ color: 'var(--color-text)' }}>
              {formatPrice(item.subtotal)}
            </span>
          </div>
        ))}
        <div className="mt-2 border-t border-black/5 pt-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
            <span className="font-mono">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Tax</span>
            <span className="font-mono">{formatPrice(order.tax)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-black/5 pt-1 font-semibold">
            <span style={{ color: 'var(--color-text)' }}>Total</span>
            <span className="font-mono" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
