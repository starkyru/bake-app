import { Navigate, Outlet } from 'react-router';
import { useAuth } from './auth-context';

interface ProtectedRouteProps {
  /** Optional permission required to access this route. */
  permission?: string;
  /** Path to redirect to when unauthenticated. Defaults to '/login'. */
  redirectTo?: string;
  /** Content to render when authorized. Falls back to <Outlet /> for nested routes. */
  children?: React.ReactNode;
}

/**
 * Route guard that checks authentication and optional permission.
 * Redirects to /login (or custom path) if the user is not authenticated
 * or lacks the required permission.
 *
 * Usage with React Router:
 * ```tsx
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 *
 * <Route element={<ProtectedRoute permission="manage:inventory" />}>
 *   <Route path="/inventory" element={<Inventory />} />
 * </Route>
 * ```
 */
export function ProtectedRoute({
  permission,
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
