import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { ProtectedRoute } from '@bake-app/react/auth';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
