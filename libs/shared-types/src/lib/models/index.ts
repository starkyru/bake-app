export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  role: Role;
  locationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isAdmin: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  grantType: 'grant' | 'deny';
  permission?: Permission;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  notes?: string;
  userId?: string;
  locationId?: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  type: string;
  price: number;
  costPrice: number;
  description?: string;
  isActive: boolean;
  categoryId?: string;
  category?: Category;
  recipeId?: string;
  recipe?: Recipe;
  ingredientId?: string;
  ingredient?: Ingredient;
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  menuProducts?: MenuProduct[];
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuProduct {
  id: string;
  menuId: string;
  productId: string;
  product?: Product;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  type?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface IngredientCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  description?: string;
  calories?: number;
  category?: string;
  categoryId?: string;
  ingredientCategory?: IngredientCategory;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  title: string;
  ingredient: Ingredient;
  ingredientId: string;
  minStockLevel?: number;
  minStockUnit?: string;
  packages?: InventoryItemPackage[];
  shipments?: InventoryShipment[];
  // Computed fields (from API)
  quantity?: number;
  status?: string;
  metricQuantity?: number;
  metricUnit?: string;
}

export interface InventoryItemPackage {
  id: string;
  size: number;
  unit: string;
  sortOrder: number;
  inventoryItemId: string;
}

export interface InventoryShipment {
  id: string;
  packageCount: number;
  unitCost?: number;
  notes?: string;
  batchNumber?: string;
  userId?: string;
  inventoryItemId: string;
  packageId: string;
  locationId: string;
  package?: InventoryItemPackage;
  location?: Location;
  metricQuantity?: number;
  metricUnit?: string;
  createdAt: Date;
}

export const UNIT_GROUPS: Record<string, string[]> = {
  g: ['g', 'kg', 'lb', 'oz'],
  ml: ['ml', 'L', 'fl oz'],
  pcs: ['pcs'],
  tbsp: ['tbsp', 'ml'],
  tsp: ['tsp', 'ml'],
};

export const CONVERSION_FACTORS: Record<string, number> = {
  g: 1, kg: 1000, lb: 453.592, oz: 28.3495,
  ml: 1, L: 1000, 'fl oz': 29.5735,
  pcs: 1,
  tbsp: 15, tsp: 5,
};

export interface InventoryMovement {
  id: string;
  type: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
  ingredientId: string;
  fromLocationId?: string;
  toLocationId?: string;
  userId?: string;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  name: string;
  category?: string;
  yieldQuantity: number;
  yieldUnit: string;
  currentVersion: number;
  instructions?: string;
  productId?: string;
  isActive: boolean;
  roomTempHours?: number;
  refrigeratedHours?: number;
  frozenHours?: number;
  thawedHours?: number;
  ingredients: RecipeIngredient[];
  images: RecipeImage[];
  links: RecipeLink[];
  subRecipes?: RecipeSubRecipe[];
  storageLives?: RecipeStorageLife[];
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: string;
  note?: string;
}

export interface RecipeImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface RecipeLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  isYoutube: boolean;
  youtubeVideoId?: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  type: string;
  phone?: string;
  isActive: boolean;
}

export interface ProductionPlan {
  id: string;
  date: Date;
  status: string;
  notes?: string;
  locationId?: string;
  tasks: ProductionTask[];
}

export interface ProductionTask {
  id: string;
  plannedQuantity: number;
  actualYield?: number;
  wasteQuantity: number;
  status: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  recipeId: string;
  recipeName?: string;
  assigneeId?: string;
  assigneeName?: string;
  producedBatch?: ProductionBatch;
}

export interface RecipeSubRecipe {
  id: string;
  parentRecipeId: string;
  subRecipeId: string;
  subRecipe?: Recipe;
  quantity: number;
  unit: string;
  note?: string;
  sortOrder: number;
}

export interface StorageCondition {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface RecipeStorageLife {
  id: string;
  recipeId: string;
  storageConditionId: string;
  storageCondition?: StorageCondition;
  shelfLifeHours: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  recipeId: string;
  recipeName: string;
  productionTaskId?: string;
  locationId: string;
  storageCondition?: string;
  producedQuantity: number;
  remainingQuantity: number;
  unit: string;
  productionDate: Date;
  expiryDate?: Date;
  compositeExpiryDate?: Date;
  status: string;
  costPerUnit?: number;
  notes?: string;
  producedById?: string;
  consumptions?: BatchConsumption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchConsumption {
  id: string;
  productionBatchId: string;
  consumingTaskId: string;
  quantityConsumed: number;
  unit: string;
  isManualOverride: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  orderId: string;
}

export interface FinanceTransaction {
  id: string;
  type: string;
  amount: number;
  category?: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  locationId?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  referenceType?: string;
  referenceId?: string;
  userId: string;
  createdAt: Date;
}

// Online Ordering Types

export interface Customer {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  authProvider: string;
  socialId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  notificationPrefs: { email: boolean; sms: boolean; push: boolean };
  dietaryPreferences?: string[];
  allergies?: string[];
  isGuest: boolean;
  isActive: boolean;
  addresses?: CustomerAddress[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  street: string;
  city: string;
  state?: string;
  zip: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface LocationMenu {
  id: string;
  locationId: string;
  menuId: string;
  menu?: Menu;
  location?: Location;
}

export interface MenuSchedule {
  id: string;
  menuId: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  specificDate?: string;
  isActive: boolean;
}

export interface MenuConfig {
  id: string;
  menuId: string;
  mergeWithOthers: boolean;
  standalone: boolean;
  preorderEnabled: boolean;
  preorderDaysAhead: number;
  requiresApproval: boolean;
  prepTimeMinutes: number;
  leadTimeHours: number;
}

export interface MenuTag {
  id: string;
  name: string;
}

export interface LocationConfig {
  id: string;
  locationId: string;
  enabledForOnlineOrdering: boolean;
  preorderEnabled: boolean;
  preorderDaysAhead: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  shippingEnabled: boolean;
  dineInQrEnabled: boolean;
  fulfillmentSlots: FulfillmentSlot[];
  taxRate: number;
}

export interface FulfillmentSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxOrders: number;
}

export interface ProductOptionGroup {
  id: string;
  productId: string;
  name: string;
  type: string;
  isRequired: boolean;
  sortOrder: number;
  maxSelections?: number;
  options: ProductOption[];
}

export interface ProductOption {
  id: string;
  groupId: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface OrderItemOption {
  id: string;
  orderItemId: string;
  optionGroupName: string;
  optionName: string;
  priceModifier: number;
}

export interface CustomOrderRequest {
  id: string;
  customerId: string;
  locationId: string;
  occasion?: string;
  servingSize?: string;
  inscriptionText?: string;
  decorationNotes?: string;
  themeColors?: string;
  referenceImageUrls: string[];
  status: string;
  quotedPrice?: number;
  deposit?: number;
  staffNotes?: string;
  requestedDate?: string;
  assignedUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeliveryZone {
  id: string;
  locationId: string;
  name: string;
  polygon?: { lat: number; lng: number }[];
  radiusKm?: number;
  deliveryFee: number;
  minimumOrder: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface StorefrontConfig {
  id: string;
  locationId?: string;
  themePreset: string;
  logoUrl?: string;
  heroImageUrl?: string;
  businessName?: string;
  tagline?: string;
  primaryColor?: string;
  accentColor?: string;
  customDomain?: string;
}

export interface StorefrontPaymentConfig {
  id: string;
  locationId?: string;
  provider: string;
  publicKey: string;
  isActive: boolean;
  isSandbox: boolean;
}

export interface CustomerNotificationSubscription {
  id: string;
  customerId: string;
  menuId?: string;
  locationId?: string;
  type: string;
  channels: { email: boolean; sms: boolean; push: boolean };
}

export interface PushSubscription {
  id: string;
  customerId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface OnlineOrderExtensions {
  customerId?: string;
  fulfillmentType?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  deliveryAddressId?: string;
  deliveryAddress?: Record<string, unknown>;
  requiresApproval?: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  source?: string;
}
