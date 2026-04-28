export const DOMAIN_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.statusChanged',
  ORDER_PAYMENT_RECEIVED: 'order.paymentReceived',
  INVENTORY_DELIVERY: 'inventory.delivery',
  INVENTORY_WRITE_OFF: 'inventory.writeOff',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_LOW_STOCK: 'inventory.lowStock',
  PRODUCTION_TASK_UPDATED: 'production.taskUpdated',
  BATCH_CREATED: 'batch.created',
  BATCH_CONSUMED: 'batch.consumed',
  BATCH_DISCARDED: 'batch.discarded',
  BATCH_EXPIRING_SOON: 'batch.expiringSoon',
  BATCH_EXPIRED: 'batch.expired',
  NOTIFICATION_CREATED: 'notification.created',
  ONLINE_ORDER_CREATED: 'onlineOrder.created',
  ONLINE_ORDER_APPROVAL_NEEDED: 'onlineOrder.approvalNeeded',
  ONLINE_ORDER_APPROVED: 'onlineOrder.approved',
  ONLINE_ORDER_STATUS_CHANGED: 'onlineOrder.statusChanged',
} as const;

export const WS_EVENTS = {
  ORDER_NEW: 'order:new',
  ORDER_STATUS_CHANGED: 'order:statusChanged',
  ORDER_PAYMENT_RECEIVED: 'order:paymentReceived',
  ORDER_READY: 'order:ready',
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_STOCK_ALERT: 'inventory:stockAlert',
  PRODUCTION_TASK_UPDATED: 'production:taskUpdated',
  BATCH_CREATED: 'batch:created',
  BATCH_UPDATED: 'batch:updated',
  BATCH_EXPIRING_SOON: 'batch:expiringSoon',
  BATCH_EXPIRED: 'batch:expired',
  NOTIFICATION_NEW: 'notification:new',
  ONLINE_ORDER_NEW: 'onlineOrder:new',
  ONLINE_ORDER_APPROVAL_NEEDED: 'onlineOrder:approvalNeeded',
  ONLINE_ORDER_APPROVED: 'onlineOrder:approved',
  ONLINE_ORDER_STATUS_CHANGED: 'onlineOrder:statusChanged',
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
