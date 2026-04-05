import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { ProtectedRoute } from '@bake-app/react/auth';
import { LoginPage } from './pages/login';
import { AdminShell } from './components/admin-shell';
import { DashboardPage } from './pages/dashboard';
import { UsersPage } from './pages/users';
import { MenusPage } from './pages/menus';
import { MenuItemsPage } from './pages/menu-items';
import { MenuDetailPage } from './pages/menu-detail';
import { IngredientsPage } from './pages/ingredients';
import { RecipesPage } from './pages/recipes';
import { RecipeEditorPage } from './pages/recipe-editor';
import { InventoryPage } from './pages/inventory';
import { InventoryDetailPage } from './pages/inventory-detail';
import { FinancePage } from './pages/finance';
import { SalesPage } from './pages/sales';
import { ProductionPage } from './pages/production';
import { SettingsPage } from './pages/settings';
import { OnlineOrdersPage } from './pages/online-orders';
import { OnlineOrderDetailPage } from './pages/online-order-detail';
import { CustomOrderRequestsPage } from './pages/custom-order-requests';
import { CustomOrderDetailPage } from './pages/custom-order-detail';
import { CustomersPage } from './pages/customers';
import { CustomerDetailPage } from './pages/customer-detail';
import { StorefrontSettingsPage } from './pages/storefront-settings';
import { PaymentConfigPage } from './pages/payment-config';
import { LocationOnlineConfigPage } from './pages/location-online-config';
import { MenuOnlineConfigPage } from './pages/menu-online-config';
import { ProductOptionsEditorPage } from './pages/product-options-editor';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/menu', element: <MenusPage /> },
          { path: '/products', element: <MenuItemsPage /> },
          { path: '/menu/:id', element: <MenuDetailPage /> },
          { path: '/ingredients', element: <IngredientsPage /> },
          { path: '/recipes', element: <RecipesPage /> },
          { path: '/recipes/:id', element: <RecipeEditorPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/inventory/:id', element: <InventoryDetailPage /> },
          { path: '/finance', element: <FinancePage /> },
          { path: '/sales', element: <SalesPage /> },
          { path: '/production', element: <ProductionPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/online-orders', element: <OnlineOrdersPage /> },
          { path: '/online-orders/:id', element: <OnlineOrderDetailPage /> },
          { path: '/custom-requests', element: <CustomOrderRequestsPage /> },
          { path: '/custom-requests/:id', element: <CustomOrderDetailPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/storefront', element: <StorefrontSettingsPage /> },
          { path: '/storefront/payments', element: <PaymentConfigPage /> },
          { path: '/online-config', element: <LocationOnlineConfigPage /> },
          { path: '/online-config/menu/:menuId', element: <MenuOnlineConfigPage /> },
          { path: '/online-config/product/:productId/options', element: <ProductOptionsEditorPage /> },
        ],
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
