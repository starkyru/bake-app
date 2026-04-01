import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { ProtectedRoute } from '@bake-app/react/auth';
import { LoginPage } from './pages/login';
import { PosPage } from './pages/pos';
import { OrdersPage } from './pages/orders';
import { OrderDetailPage } from './pages/order-detail';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/pos" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/pos', element: <PosPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/orders/:id', element: <OrderDetailPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
