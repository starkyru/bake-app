import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOrders, useUpdateOrderStatus } from '@bake-app/react/api-client';
import { useWebSocketStore } from '@bake-app/react/store';
import { useAuth } from '@bake-app/react/auth';
import type { Order, OrderItem } from '@bake-app/shared-types';
import {
  ChefHat,
  Clock,
  Play,
  CheckCircle2,
  HandMetal,
  LogOut,
  Factory,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KitchenOrderItem extends OrderItem {
  done: boolean;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: 'new' | 'in_progress' | 'ready';
  customer: string;
  items: KitchenOrderItem[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

type Column = 'new' | 'in_progress' | 'ready';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapStatus(apiStatus: string): Column | null {
  switch (apiStatus) {
    case 'pending':
    case 'confirmed':
      return 'new';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'ready';
    default:
      return null; // delivered, cancelled
  }
}

function elapsed(from: Date | string): string {
  const diff = Math.max(
    0,
    Math.floor((Date.now() - new Date(from).getTime()) / 1000),
  );
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function toKitchenOrder(order: Order): KitchenOrder | null {
  const col = mapStatus(order.status);
  if (!col) return null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: col,
    customer: order.notes || '',
    items: (order.items || []).map((item) => ({ ...item, done: false })),
    createdAt: new Date(order.createdAt),
    startedAt: order.status === 'in_progress' ? new Date(order.updatedAt) : undefined,
    completedAt: order.status === 'completed' ? new Date(order.updatedAt) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Column config                                                      */
/* ------------------------------------------------------------------ */

const COLUMNS: {
  key: Column;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}[] = [
  {
    key: 'new',
    label: 'NEW',
    color: '#4FC3F7',
    bgClass: 'bg-[#4FC3F7]/10',
    borderClass: 'border-l-[#4FC3F7]',
    textClass: 'text-[#4FC3F7]',
  },
  {
    key: 'in_progress',
    label: 'IN PROGRESS',
    color: '#FFB74D',
    bgClass: 'bg-[#FFB74D]/10',
    borderClass: 'border-l-[#FFB74D]',
    textClass: 'text-[#FFB74D]',
  },
  {
    key: 'ready',
    label: 'READY',
    color: '#81C784',
    bgClass: 'bg-[#81C784]/10',
    borderClass: 'border-l-[#81C784]',
    textClass: 'text-[#81C784]',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function QueuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, logout } = useAuth();
  const { connect, disconnect } = useWebSocketStore();
  const { data, isLoading } = useOrders({ limit: 50 });
  const updateStatus = useUpdateOrderStatus();

  // Force re-render every second for elapsed timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (token) {
      connect(token, queryClient);
    }
    return () => disconnect();
  }, [token, connect, disconnect, queryClient]);

  // Track checked items locally per order
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>(
    {},
  );

  const toggleItem = useCallback((orderId: string, itemId: string) => {
    setCheckedItems((prev) => {
      const set = new Set(prev[orderId] || []);
      if (set.has(itemId)) {
        set.delete(itemId);
      } else {
        set.add(itemId);
      }
      return { ...prev, [orderId]: set };
    });
  }, []);

  // Map API orders to kitchen orders
  const orders = useMemo(() => {
    const items = data?.data ?? (Array.isArray(data) ? data : []);
    return (items as Order[])
      .map(toKitchenOrder)
      .filter((o): o is KitchenOrder => o !== null);
  }, [data]);

  const columns = useMemo(() => {
    const grouped: Record<Column, KitchenOrder[]> = {
      new: [],
      in_progress: [],
      ready: [],
    };
    for (const order of orders) {
      grouped[order.status].push(order);
    }
    return grouped;
  }, [orders]);

  // Actions
  function handleStart(orderId: string) {
    updateStatus.mutate(
      { id: orderId, status: 'in_progress' },
      {
        onSuccess: () => toast.success('Order started'),
        onError: () => toast.error('Failed to start order'),
      },
    );
  }

  function handleDone(orderId: string) {
    updateStatus.mutate(
      { id: orderId, status: 'completed' },
      {
        onSuccess: () => {
          toast.success('Order completed');
          setCheckedItems((prev) => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        },
        onError: () => toast.error('Failed to complete order'),
      },
    );
  }

  function handlePickedUp(orderId: string) {
    updateStatus.mutate(
      { id: orderId, status: 'delivered' },
      {
        onSuccess: () => toast.success('Order picked up'),
        onError: () => toast.error('Failed to mark as picked up'),
      },
    );
  }

  function handleLogout() {
    disconnect();
    logout();
    navigate('/login');
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D1B2A]">
        <div className="flex flex-col items-center gap-3">
          <ChefHat className="h-12 w-12 animate-pulse text-orange-400" />
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0D1B2A]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-orange-400" />
          <h1 className="text-xl font-bold text-white">Kitchen Display</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/production')}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5"
          >
            <Factory className="h-4 w-4" />
            Production
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Kanban columns */}
      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden p-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col overflow-hidden rounded-xl border border-white/5">
            {/* Column header */}
            <div
              className={`flex items-center justify-between px-4 py-3 ${col.bgClass}`}
            >
              <span className={`text-sm font-bold tracking-wider ${col.textClass}`}>
                {col.label}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${col.textClass}`}
                style={{ backgroundColor: col.color + '30' }}
              >
                {columns[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columns[col.key].map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  column={col}
                  checkedItems={checkedItems[order.id] || new Set()}
                  onToggleItem={toggleItem}
                  onStart={handleStart}
                  onDone={handleDone}
                  onPickedUp={handlePickedUp}
                  onCardClick={() => navigate(`/orders/${order.id}`)}
                />
              ))}
              {columns[col.key].length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-gray-600">
                  No orders
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Order Card                                                         */
/* ------------------------------------------------------------------ */

interface OrderCardProps {
  order: KitchenOrder;
  column: (typeof COLUMNS)[number];
  checkedItems: Set<string>;
  onToggleItem: (orderId: string, itemId: string) => void;
  onStart: (id: string) => void;
  onDone: (id: string) => void;
  onPickedUp: (id: string) => void;
  onCardClick: () => void;
}

function OrderCard({
  order,
  column,
  checkedItems,
  onToggleItem,
  onStart,
  onDone,
  onPickedUp,
  onCardClick,
}: OrderCardProps) {
  const doneCount = checkedItems.size;
  const totalItems = order.items.length;
  const progress = totalItems > 0 ? (doneCount / totalItems) * 100 : 0;

  const timerRef =
    order.status === 'in_progress'
      ? order.startedAt
      : order.status === 'ready'
        ? order.completedAt
        : order.createdAt;

  return (
    <div
      className={`rounded-xl bg-[#16213E] border-l-4 ${column.borderClass} transition-all duration-200 hover:shadow-lg hover:shadow-black/30`}
      style={{ transform: 'translateY(0)' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-2 cursor-pointer"
        onClick={onCardClick}
      >
        <span className="font-mono text-xl font-bold text-white">
          #{order.orderNumber}
        </span>
        <div className={`flex items-center gap-1 text-sm ${column.textClass}`}>
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{elapsed(timerRef!)}</span>
        </div>
      </div>

      {/* Customer */}
      {order.customer && (
        <div className="px-4 pb-2">
          <span
            className={`text-sm font-medium ${
              order.status === 'ready'
                ? 'text-lg font-bold text-[#81C784]'
                : 'text-gray-400'
            }`}
          >
            {order.customer}
          </span>
        </div>
      )}

      {/* Items */}
      <div className="px-4 pb-3">
        <ul className="space-y-1.5">
          {order.items.map((item) => {
            const isChecked = checkedItems.has(item.id);
            const productName = item.product?.name ?? `Product`;
            return (
              <li
                key={item.id}
                className="flex items-center gap-2 text-sm"
              >
                {order.status === 'in_progress' && (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleItem(order.id, item.id)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-transparent accent-[#FFB74D]"
                  />
                )}
                <span
                  className={`${
                    isChecked ? 'text-gray-500 line-through' : 'text-gray-300'
                  }`}
                >
                  <span className="font-mono font-semibold text-[#FFB74D]">
                    {item.quantity}x
                  </span>{' '}
                  {productName}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Progress bar (in_progress only) */}
      {order.status === 'in_progress' && totalItems > 0 && (
        <div className="px-4 pb-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FFB74D, #FF9800)',
              }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-gray-500">
            {doneCount}/{totalItems} items
          </p>
        </div>
      )}

      {/* Action button */}
      <div className="px-4 pb-4">
        {order.status === 'new' && (
          <button
            onClick={() => onStart(order.id)}
            className="flex min-h-[80px] w-full items-center justify-center gap-2 rounded-xl bg-[#4FC3F7]/20 text-lg font-bold text-[#4FC3F7] transition-colors hover:bg-[#4FC3F7]/30 active:bg-[#4FC3F7]/40"
          >
            <Play className="h-6 w-6" />
            START
          </button>
        )}
        {order.status === 'in_progress' && (
          <button
            onClick={() => onDone(order.id)}
            className="flex min-h-[80px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFB74D]/20 text-lg font-bold text-[#FFB74D] transition-colors hover:bg-[#FFB74D]/30 active:bg-[#FFB74D]/40"
          >
            <CheckCircle2 className="h-6 w-6" />
            DONE
          </button>
        )}
        {order.status === 'ready' && (
          <button
            onClick={() => onPickedUp(order.id)}
            className="flex min-h-[80px] w-full items-center justify-center gap-2 rounded-xl bg-[#81C784]/20 text-lg font-bold text-[#81C784] transition-colors hover:bg-[#81C784]/30 active:bg-[#81C784]/40"
          >
            <HandMetal className="h-6 w-6" />
            PICKED UP
          </button>
        )}
      </div>
    </div>
  );
}
