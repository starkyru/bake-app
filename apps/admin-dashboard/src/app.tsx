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
          { path: '/menu/items', element: <MenuItemsPage /> },
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
        ],
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
