// Core
export { apiClient, ApiError } from './api-client';
export { queryClient } from './query-client';
export type { PaginatedResponse } from './types';

// Query key factories
export { orderKeys } from './hooks/orders';
export { productKeys } from './hooks/products';
export { categoryKeys } from './hooks/categories';
export { ingredientKeys } from './hooks/ingredients';
export { ingredientCategoryKeys } from './hooks/ingredient-categories';
export { recipeKeys } from './hooks/recipes';
export { inventoryKeys } from './hooks/inventory';
export { menuKeys } from './hooks/menus';
export { userKeys } from './hooks/users';
export { roleKeys } from './hooks/roles';
export { locationKeys } from './hooks/locations';
export { productionKeys } from './hooks/production';
export { financeKeys } from './hooks/finance';
export { reportKeys } from './hooks/reports';
export { notificationKeys } from './hooks/notifications';
export { settingsKeys } from './hooks/settings';
export { permissionKeys } from './hooks/permissions';

// Hooks - Orders
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrderStatus,
  useCreatePayment,
} from './hooks/orders';

// Hooks - Products
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from './hooks/products';

// Hooks - Categories
export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './hooks/categories';

// Hooks - Ingredients
export {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from './hooks/ingredients';

// Hooks - Ingredient Categories
export {
  useIngredientCategories,
  useCreateIngredientCategory,
  useUpdateIngredientCategory,
  useDeleteIngredientCategory,
} from './hooks/ingredient-categories';

// Hooks - Recipes
export {
  useRecipes,
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useRecipeCost,
  useScaleRecipe,
  useGenerateRecipeFromUrl,
  useGenerateRecipeFromImage,
} from './hooks/recipes';

// Hooks - Inventory
export {
  useInventoryItems,
  useInventoryItem,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAddPackage,
  useDeletePackage,
  useAddShipment,
  useInventoryShipments,
  useWriteOff,
  useTransferInventory,
} from './hooks/inventory';

// Hooks - Menus
export {
  useMenus,
  useMenu,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useAddMenuProduct,
  useRemoveMenuProduct,
} from './hooks/menus';

// Hooks - Users
export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from './hooks/users';

// Hooks - Roles
export { useRoles } from './hooks/roles';

// Hooks - Locations
export {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from './hooks/locations';

// Hooks - Production
export {
  useProductionPlans,
  useProductionPlan,
  useCreateProductionPlan,
  useUpdateProductionPlan,
  useDeleteProductionPlan,
  useUpdateTaskStatus,
} from './hooks/production';

// Hooks - Finance
export {
  useFinanceTransactions,
  useFinanceSummary,
  useExpenses,
  useCreateExpense,
} from './hooks/finance';

// Hooks - Reports
export {
  useSalesToday,
  useSalesSummary,
  useTopProducts,
  useSalesByCategory,
  usePaymentMethods,
  useFinanceReport,
  useInventoryReport,
  useInventoryMovementsReport,
  useProductionReport,
} from './hooks/reports';

// Hooks - Notifications
export {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from './hooks/notifications';

// Hooks - Settings
export { useSettings, useUpdateSettings } from './hooks/settings';

// Hooks - Permissions
export {
  usePermissions,
  useRolePermissions,
  useUpdateRolePermissions,
  useUserPermissions,
} from './hooks/permissions';
