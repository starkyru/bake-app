export interface WsOrderNewPayload {
  orderId: string;
  orderNumber: string;
  type: string;
  total: number;
  items: Array<{ productName: string; quantity: number }>;
}

export interface WsOrderStatusPayload {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
}

export interface WsOrderPaymentPayload {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  amount: number;
  method: string;
}

export interface WsInventoryUpdatePayload {
  movementType: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  locationId?: string;
}

export interface WsStockAlertPayload {
  ingredientId: string;
  ingredientName: string;
  currentQuantity: number;
  minStockLevel: number;
  status: string;
  locationId: string;
}

export interface WsProductionTaskPayload {
  taskId: string;
  planId: string;
  recipeName: string;
  status: string;
  actualYield?: number;
  wasteQuantity?: number;
}

export interface WsNotificationPayload {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  userId: string;
}
