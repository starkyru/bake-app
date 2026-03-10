export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  CHEF = 'chef',
  BAKER = 'baker',
  BARISTA = 'barista',
  CASHIER = 'cashier',
  WAREHOUSE = 'warehouse',
  MARKETING = 'marketing',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  SPLIT = 'split',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum MovementType {
  DELIVERY = 'delivery',
  WRITE_OFF = 'write_off',
  TRANSFER = 'transfer',
  PRODUCTION = 'production',
  ADJUSTMENT = 'adjustment',
}

export enum ProductionPlanStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProductionTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  REFUND = 'refund',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RecipeCategory {
  BREAD = 'bread',
  PASTRY = 'pastry',
  CAKE = 'cake',
  BEVERAGE = 'beverage',
  SANDWICH = 'sandwich',
  OTHER = 'other',
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum LocationType {
  PRODUCTION = 'production',
  RETAIL = 'retail',
  WAREHOUSE = 'warehouse',
}

export enum MenuItemType {
  PRODUCED = 'produced',
  BOUGHT_FOR_RESALE = 'bought_for_resale',
}
