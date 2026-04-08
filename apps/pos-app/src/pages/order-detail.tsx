import { useParams, useNavigate } from 'react-router';
import BigNumber from 'bignumber.js';
import { ArrowLeft, Receipt, CreditCard, Banknote } from 'lucide-react';
import { useOrder } from '@bake-app/react/api-client';
import { CurrencyDisplay, StatusBadge, LoadingSpinner } from '@bake-app/react/ui';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf3e8] flex items-center justify-center">
        <LoadingSpinner message="Loading order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf3e8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Failed to load order</p>
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8b4513] rounded-lg
              border-none hover:bg-[#5d4037] transition-colors cursor-pointer"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const payment = order.payments?.[0];

  return (
    <div className="min-h-screen bg-[#faf3e8]">
      {/* Header */}
      <div className="bg-white border-b border-[#8b4513]/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center h-9 w-9 rounded-lg
              bg-[#faf3e8] text-[#5d4037] border border-[#8b4513]/10
              hover:bg-[#f5e6d0] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <Receipt className="text-[#8b4513]" size={24} />
            <h1 className="text-xl font-bold text-[#3e2723]">
              Order <span className="font-mono">#{order.orderNumber}</span>
            </h1>
          </div>
          <div className="ml-auto">
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Order info */}
        <div className="bg-white rounded-xl border border-[#8b4513]/10 shadow-sm p-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Order Number</p>
              <p className="font-mono font-bold text-[#3e2723]">#{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Date</p>
              <p className="font-medium text-[#3e2723]">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Type</p>
              <p className="font-medium text-[#3e2723] capitalize">
                {order.type?.replace('_', ' ') ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Status</p>
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl border border-[#8b4513]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#3e2723]">Items</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                  Product
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037] text-center">
                  Qty
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037] text-right">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#5d4037] text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                >
                  <td className="px-6 py-3 text-sm font-medium text-[#3e2723]">
                    {item.product?.name ?? `Product ${item.productId}`}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 text-center font-mono">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <CurrencyDisplay amount={item.unitPrice} size="sm" />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <CurrencyDisplay amount={item.subtotal} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-gray-200 px-6 py-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-[#5d4037]">
              <span>Subtotal</span>
              <CurrencyDisplay amount={order.subtotal} size="sm" />
            </div>
            <div className="flex items-center justify-between text-sm text-[#5d4037]">
              <span>Tax</span>
              <CurrencyDisplay amount={order.tax} size="sm" />
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-mono font-semibold">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-base font-bold text-[#3e2723]">Total</span>
              <CurrencyDisplay amount={order.total} size="lg" />
            </div>
          </div>
        </div>

        {/* Payment info */}
        {payment && (
          <div className="bg-white rounded-xl border border-[#8b4513]/10 shadow-sm p-6">
            <h2 className="text-base font-bold text-[#3e2723] mb-4">Payment</h2>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                {payment.method === 'cash' ? (
                  <Banknote size={20} className="text-green-600" />
                ) : (
                  <CreditCard size={20} className="text-blue-600" />
                )}
                <div>
                  <p className="text-gray-500 mb-0.5">Method</p>
                  <p className="font-medium text-[#3e2723] capitalize">{payment.method}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Amount Paid</p>
                <CurrencyDisplay amount={payment.amount} size="md" />
              </div>
              {payment.method === 'cash' && payment.amount > order.total && (
                <div>
                  <p className="text-gray-500 mb-0.5">Change</p>
                  <span className="font-mono font-semibold text-green-700">
                    ${new BigNumber(payment.amount).minus(order.total).toFixed(2)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-gray-500 mb-0.5">Status</p>
                <StatusBadge status={payment.status} size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
