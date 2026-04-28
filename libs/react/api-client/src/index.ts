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
  useGenerateRecipeFromText,
  useUploadRecipeImage,
  useDeleteRecipeImage,
  useRecipeDependencyTree,
  useRecipeCompositeCost,
  useRecipeUsedIn,
  useSubRecipeSuggestions,
} from './hooks/recipes';
export type { RecipeCostResult } from './hooks/recipes';

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

// Hooks - Batches
export * from './hooks/batches';

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

// Hooks - Customer Auth
export {
  customerAuthKeys,
  useCustomerRegister,
  useCustomerLogin,
  useCustomerProfile,
  useUpdateCustomerProfile,
} from './hooks/customer-auth';

// Hooks - Online Locations
export {
  onlineLocationKeys,
  useOnlineLocations,
  useOnlineLocationDetail,
} from './hooks/online-locations';

// Hooks - Online Menus
export {
  onlineMenuKeys,
  useOnlineMenus,
  useAvailableDates,
} from './hooks/online-menus';

// Hooks - Online Orders
export {
  onlineOrderKeys,
  useCreateOnlineOrder,
  useOnlineOrder,
  useOnlineOrderHistory,
  useCancelOnlineOrder,
} from './hooks/online-orders';

// Hooks - Customer Addresses
export {
  customerAddressKeys,
  useCustomerAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from './hooks/customer-addresses';

// Hooks - Custom Order Requests
export {
  customOrderKeys,
  useCreateCustomOrderRequest,
  useCustomerCustomOrders,
  useApproveCustomOrder,
  useRejectCustomOrder,
} from './hooks/custom-order-requests';

// Hooks - Admin Online Orders
export {
  adminOnlineOrderKeys,
  useAdminOnlineOrders,
  useAdminOnlineOrder,
  usePendingApprovalOrders,
  useApproveOrder,
  useRejectOrder,
} from './hooks/admin-online-orders';

// Hooks - Admin Online Config
export {
  adminOnlineConfigKeys,
  useLocationConfig,
  useUpdateLocationConfig,
  useLocationMenus,
  useAssignMenuToLocation,
  useUnassignMenuFromLocation,
  useUnassignMenuFromLocation as useRemoveMenuFromLocation,
  useMenuConfig,
  useUpdateMenuConfig,
  useMenuSchedules,
  useCreateMenuSchedule,
  useDeleteMenuSchedule,
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
  useProductOptionGroups,
  useCreateProductOptionGroup,
  useCreateProductOption,
  useUpdateProductOption,
  useDeleteProductOption,
  useDeleteProductOptionGroup,
} from './hooks/admin-online-config';

// Hooks - Admin Storefront
export {
  adminStorefrontKeys,
  useStorefrontConfig,
  useUpdateStorefrontConfig,
  usePaymentConfigs,
  useCreatePaymentConfig,
  useUpdatePaymentConfig,
  useDeletePaymentConfig,
} from './hooks/admin-storefront';

// Hooks - Admin Custom Orders
export {
  adminCustomOrderKeys,
  useAdminCustomOrders,
  useAdminCustomOrderDetail,
  useCustomOrderRequests,
  useCustomOrderRequest,
  useUpdateCustomOrderRequest,
  useAdminApproveCustomOrder,
  useAdminRejectCustomOrder,
  useAdminQuoteCustomOrder,
} from './hooks/admin-custom-orders';

// Hooks - Admin Customers
export {
  adminCustomerKeys,
  useAdminCustomers,
  useAdminCustomerDetail,
  useOnlineCustomers,
  useOnlineCustomer,
  useCustomerOrders,
  useCustomerLookup,
} from './hooks/admin-customers';
