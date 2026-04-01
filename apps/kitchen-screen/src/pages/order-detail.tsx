import { useParams, useNavigate } from 'react-router';
import { useOrder } from '@bake-app/react/api-client';
import { ArrowLeft, Clock, Hash } from 'lucide-react';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D1B2A]">
        <p className="text-gray-400">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0D1B2A]">
        <p className="text-gray-400">Order not found</p>
        <button
          onClick={() => navigate('/queue')}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    pending: 'text-[#4FC3F7] bg-[#4FC3F7]/10',
    confirmed: 'text-[#4FC3F7] bg-[#4FC3F7]/10',
    in_progress: 'text-[#FFB74D] bg-[#FFB74D]/10',
    completed: 'text-[#81C784] bg-[#81C784]/10',
    delivered: 'text-[#81C784] bg-[#81C784]/10',
    cancelled: 'text-red-400 bg-red-400/10',
  };

  const createdAt = new Date(order.createdAt);

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-6">
      <div className="mx-auto max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => navigate('/queue')}
          className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </button>

        {/* Header card */}
        <div className="rounded-xl bg-[#16213E] p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-5 w-5 text-gray-500" />
                <h1 className="font-mono text-3xl font-bold text-white">
                  {order.orderNumber}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                {createdAt.toLocaleString()}
              </div>
              {order.notes && (
                <p className="mt-2 text-gray-300">{order.notes}</p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                statusColor[order.status] || 'text-gray-400 bg-white/5'
              }`}
            >
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-xl bg-[#16213E] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-6 py-4 text-white">
                    {item.product?.name ?? 'Product'}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-semibold text-[#FFB74D]">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-400">
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-white">
                    {item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-white/10 px-6 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono">{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span className="font-mono">-{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax</span>
              <span className="font-mono">{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold text-white">
              <span>Total</span>
              <span className="font-mono">{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
