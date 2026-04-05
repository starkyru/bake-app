import { Navigate, Outlet } from 'react-router';
import { useCustomerAuth } from './customer-auth-context';

interface CustomerProtectedRouteProps {
  /** Path to redirect to when unauthenticated. Defaults to '/login'. */
  redirectTo?: string;
  /** Content to render when authorized. Falls back to <Outlet /> for nested routes. */
  children?: React.ReactNode;
}

/**
 * Route guard that checks customer authentication.
 * Redirects to /login (or custom path) if the customer is not authenticated.
 * Allows both registered customers and guests.
 */
export function CustomerProtectedRoute({
  redirectTo = '/login',
  children,
}: CustomerProtectedRouteProps) {
  const { isAuthenticated } = useCustomerAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
