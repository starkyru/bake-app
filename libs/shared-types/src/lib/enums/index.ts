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
  PENDING_APPROVAL = 'pending_approval',
  CONFIRMED = 'confirmed',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
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
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
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

export enum FulfillmentType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  SHIPPING = 'shipping',
  DINE_IN_QR = 'dine_in_qr',
}

export enum OrderSource {
  POS = 'pos',
  ONLINE = 'online',
  CUSTOM = 'custom',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  APPLE = 'apple',
  PHONE = 'phone',
}

export enum CustomOrderStatus {
  SUBMITTED = 'submitted',
  QUOTED = 'quoted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum OptionGroupType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum PaymentProviderType {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export enum ThemePreset {
  WARM = 'warm',
  MODERN = 'modern',
  MINIMAL = 'minimal',
}

export enum NotificationSubscriptionType {
  MENU_AVAILABLE = 'menu_available',
  NEW_MENU = 'new_menu',
  PROMOTION = 'promotion',
}

export enum ProductionBatchStatus {
  AVAILABLE = 'available',
  PARTIALLY_CONSUMED = 'partially_consumed',
  FULLY_CONSUMED = 'fully_consumed',
  EXPIRED = 'expired',
  DISCARDED = 'discarded',
}

export enum StorageConditionType {
  ROOM_TEMP = 'room_temp',
  REFRIGERATED = 'refrigerated',
  FROZEN = 'frozen',
}

export enum DietaryTag {
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
  GLUTEN_FREE = 'gluten_free',
  NUT_FREE = 'nut_free',
  DAIRY_FREE = 'dairy_free',
  SUGAR_FREE = 'sugar_free',
  HALAL = 'halal',
  KOSHER = 'kosher',
  ORGANIC = 'organic',
  KETO = 'keto',
}
