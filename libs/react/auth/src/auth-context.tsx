import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setSharedCookie, getSharedCookie, deleteSharedCookie } from './cookie-utils';
import {
  getPermissions,
  getUserName,
  getUserRole,
  getUserId,
  getUserEmail,
  hasPermission as checkPermission,
  hasAllPermissions as checkAllPermissions,
  isTokenExpired,
} from './token-utils';

interface AuthUser {
  name: string;
  role: string;
  id: string;
  email: string;
}

interface LoginResponse {
  access_token?: string;
  accessToken?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  user: AuthUser | null;
  permissions: string[];
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Syncs token between localStorage and the shared cookie on mount.
 * Enables cross-subdomain SSO: log in once at the hub, access all sub-apps.
 */
function runTokenPassthrough(): string | null {
  const localToken = localStorage.getItem('token');
  const cookieToken = getSharedCookie();

  const token = localToken || cookieToken;

  // Clear expired tokens
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token');
    deleteSharedCookie();
    return null;
  }

  if (!localToken && cookieToken) {
    localStorage.setItem('token', cookieToken);
    return cookieToken;
  } else if (localToken && !cookieToken) {
    setSharedCookie(localToken);
  }

  return localToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => runTokenPassthrough());

  // Re-run passthrough on mount in case the cookie changed after SSR hydration
  useEffect(() => {
    const synced = runTokenPassthrough();
    if (synced !== token) {
      setToken(synced);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.message || `Login failed (${response.status})`;
      throw new Error(message);
    }

    const data: LoginResponse = await response.json();
    const jwt = data.accessToken || data.access_token;

    if (!jwt) {
      throw new Error('No access token in response');
    }

    localStorage.setItem('token', jwt);
    setSharedCookie(jwt);
    setToken(jwt);

    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    deleteSharedCookie();
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = !!token;
    const user: AuthUser | null = token
      ? {
          name: getUserName(token),
          role: getUserRole(token),
          id: getUserId(token),
          email: getUserEmail(token),
        }
      : null;
    const permissions = token ? getPermissions(token) : [];

    return {
      token,
      isAuthenticated,
      user,
      permissions,
      login,
      logout,
      hasPermission: (permission: string) =>
        token ? checkPermission(token, permission) : false,
      hasAllPermissions: (...perms: string[]) =>
        token ? checkAllPermissions(token, ...perms) : false,
    };
  }, [token, login, logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
