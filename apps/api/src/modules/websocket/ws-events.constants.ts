export const DOMAIN_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.statusChanged',
  ORDER_PAYMENT_RECEIVED: 'order.paymentReceived',
  INVENTORY_DELIVERY: 'inventory.delivery',
  INVENTORY_WRITE_OFF: 'inventory.writeOff',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_LOW_STOCK: 'inventory.lowStock',
  PRODUCTION_TASK_UPDATED: 'production.taskUpdated',
  NOTIFICATION_CREATED: 'notification.created',
} as const;

export const WS_EVENTS = {
  ORDER_NEW: 'order:new',
  ORDER_STATUS_CHANGED: 'order:statusChanged',
  ORDER_PAYMENT_RECEIVED: 'order:paymentReceived',
  ORDER_READY: 'order:ready',
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_STOCK_ALERT: 'inventory:stockAlert',
  PRODUCTION_TASK_UPDATED: 'production:taskUpdated',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const WS_ROOMS = {
  KITCHEN: 'kitchen',
  POS: 'pos',
  MANAGER: 'manager',
  user: (userId: string) => `user:${userId}`,
} as const;

export const ROLE_ROOM_MAP: Record<string, string[]> = {
  owner: ['manager'],
  manager: ['manager'],
  chef: ['kitchen'],
  baker: ['kitchen'],
  barista: ['kitchen', 'pos'],
  cashier: ['pos'],
  warehouse: [],
  accountant: [],
  marketing: [],
};
