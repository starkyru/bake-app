import { useParams, useNavigate } from 'react-router';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useOnlineOrder } from '@bake-app/react/api-client';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data } = useOnlineOrder(orderId ?? '');

  const order = data as {
    id?: string;
    orderNumber?: string;
    status?: string;
    createdAt?: string;
  } | undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {/* Success animation */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Order Placed!
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Thank you for your order. We&apos;re preparing it now.
      </p>

      {order?.orderNumber && (
        <div
          className="mx-auto mt-6 inline-block px-6 py-3"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Order Number
          </p>
          <p
            className="font-mono text-xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            #{order.orderNumber}
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Clock className="h-4 w-4" />
        <span>Estimated ready in 30-45 minutes</span>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {orderId && (
          <button
            type="button"
            onClick={() => navigate(`/orders/${orderId}/track`)}
            className="flex h-12 items-center justify-center gap-2 font-semibold text-white"
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius)',
            }}
          >
            Track Order <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="flex h-12 items-center justify-center font-medium"
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(0,0,0,0.1)',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-text)',
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
