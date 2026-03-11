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
  costPerUnit: number;
  minStockLevel: number;
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
  costPerUnit: number;
  currentVersion: number;
  instructions?: string;
  productId?: string;
  isActive: boolean;
  ingredients: RecipeIngredient[];
  links: RecipeLink[];
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
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
