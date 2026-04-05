import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  MapPin,
  CreditCard,
  User,
  Package,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminOnlineOrder,
  useApproveOrder,
  useRejectOrder,
  useUpdateOrderStatus,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  CurrencyDisplay,
  useConfirmation,
} from '@bake-app/react/ui';

const ORDER_STATUSES = [
  'pending_approval',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
];

const TIMELINE_LABELS: Record<string, string> = {
  pending_approval: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function OnlineOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useAdminOnlineOrder(id!) as { data: any; isLoading: boolean };
  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();
  const updateStatus = useUpdateOrderStatus();
  const { confirm, ConfirmationDialog } = useConfirmation();
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const handleApprove = async () => {
    try {
      await approveOrder.mutateAsync(id!);
      toast.success('Order approved');
    } catch {
      toast.error('Failed to approve order');
    }
  };

  const handleReject = async () => {
    const confirmed = await confirm(
      'Reject Order',
      'Are you sure you want to reject this order? The customer will be notified.',
      { variant: 'danger', confirmText: 'Reject' },
    );
    if (!confirmed) return;
    try {
      await rejectOrder.mutateAsync({ id: id! });
      toast.success('Order rejected');
    } catch {
      toast.error('Failed to reject order');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusDropdownOpen(false);
    try {
      await updateStatus.mutateAsync({ id: id!, status: newStatus });
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading order..." />
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer>
        <EmptyState title="Order not found" message="The requested order does not exist." />
      </PageContainer>
    );
  }

  const currentStatusIdx = ORDER_STATUSES.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <PageContainer
      title={`Order ${order.orderNumber || `#${id?.slice(0, 8)}`}`}
      subtitle="Online order details"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/online-orders')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {order.status === 'pending_approval' && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={approveOrder.isPending}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
              >
                <Check size={16} />
                {approveOrder.isPending ? 'Approving...' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejectOrder.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
              >
                <X size={16} />
                {rejectOrder.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
          {order.status !== 'pending_approval' &&
            order.status !== 'completed' &&
            order.status !== 'cancelled' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
                >
                  Update Status
                  <ChevronDown size={14} />
                </button>
                {statusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setStatusDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {ORDER_STATUSES.filter((s) => s !== 'pending_approval').map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleUpdateStatus(s)}
                          disabled={s === order.status}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#faf3e8] disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          {TIMELINE_LABELS[s] || s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status + Date Header */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
          <StatusBadge status={order.status} />
          <span className="text-sm text-gray-500">
            <Clock size={14} className="mr-1 inline" />
            {new Date(order.createdAt).toLocaleString()}
          </span>
          {order.fulfillmentType && (
            <span className="rounded-full bg-[#faf3e8] px-3 py-1 text-xs font-medium text-[#8b4513] capitalize">
              {order.fulfillmentType.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Status Timeline */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">Order Progress</h3>
          <div className="flex items-center justify-between">
            {ORDER_STATUSES.filter((s) => s !== 'cancelled').map((step, idx) => {
              const isCompleted = !isCancelled && currentStatusIdx >= idx;
              const isCurrent = !isCancelled && currentStatusIdx === idx;
              return (
                <div key={step} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {idx > 0 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? 'bg-[#8b4513] text-white ring-2 ring-[#8b4513]/30'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted && !isCurrent ? (
                        <Check size={12} />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < ORDER_STATUSES.filter((s) => s !== 'cancelled').length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          !isCancelled && currentStatusIdx > idx
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <span className="mt-1 text-[10px] text-gray-500 text-center leading-tight">
                    {TIMELINE_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
          {isCancelled && (
            <div className="mt-3 rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">
              This order has been cancelled
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer Info */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <User size={16} />
              Customer
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-[#3e2723] font-medium">
                {order.customer?.name || order.customerName || 'Guest'}
              </p>
              {(order.customer?.email || order.customerEmail) && (
                <p className="text-gray-500">{order.customer?.email || order.customerEmail}</p>
              )}
              {(order.customer?.phone || order.customerPhone) && (
                <p className="text-gray-500">{order.customer?.phone || order.customerPhone}</p>
              )}
            </div>
          </div>

          {/* Fulfillment Info */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <MapPin size={16} />
              Fulfillment
            </h3>
            <div className="space-y-2 text-sm">
              <p className="capitalize text-[#3e2723] font-medium">
                {order.fulfillmentType?.replace(/_/g, ' ') || 'Not specified'}
              </p>
              {order.scheduledDate && (
                <p className="text-gray-500">
                  Scheduled: {new Date(order.scheduledDate).toLocaleString()}
                </p>
              )}
              {order.deliveryAddress && (
                <p className="text-gray-500">{order.deliveryAddress}</p>
              )}
              {order.location?.name && (
                <p className="text-gray-500">Location: {order.location.name}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <CreditCard size={16} />
              Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <CurrencyDisplay amount={order.subtotal ?? order.totalAmount} size="sm" />
              </div>
              {order.taxAmount != null && order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <CurrencyDisplay amount={order.taxAmount} size="sm" />
                </div>
              )}
              {order.deliveryFee != null && order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <CurrencyDisplay amount={order.deliveryFee} size="sm" />
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 font-medium">
                <span className="text-[#3e2723]">Total</span>
                <CurrencyDisplay amount={order.totalAmount} size="sm" />
              </div>
              {order.paymentMethod && (
                <p className="text-gray-500 capitalize">
                  Method: {order.paymentMethod.replace(/_/g, ' ')}
                </p>
              )}
              {order.paymentStatus && <StatusBadge status={order.paymentStatus} size="sm" />}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <Package size={16} />
              Items ({order.items?.length ?? 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={item.id || idx} className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#3e2723]">
                    {item.product?.name || item.productName || 'Item'}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.selectedOptions.map((opt: any, optIdx: number) => (
                        <p key={optIdx} className="text-xs text-gray-500">
                          + {opt.optionName || opt.name}
                          {opt.priceModifier > 0 && (
                            <span className="ml-1 font-mono text-[#8b4513]">
                              (+${Number(opt.priceModifier).toFixed(2)})
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <p className="mt-1 text-xs italic text-gray-400">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>
                <CurrencyDisplay
                  amount={item.subtotal ?? item.price * item.quantity}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-[#3e2723]">Order Notes</h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>

      {ConfirmationDialog}
    </PageContainer>
  );
}
