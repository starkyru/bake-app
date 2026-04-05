import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  customerApiClient,
  getCustomerToken,
  setCustomerToken,
  removeCustomerToken,
} from './customer-api-client';
import { decodeCustomerToken, isCustomerTokenExpired } from './customer-token-utils';

export interface CustomerUser {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  isGuest: boolean;
}

interface LoginResponse {
  accessToken?: string;
  access_token?: string;
  [key: string]: unknown;
}

interface OtpResponse {
  requiresOtp: true;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<OtpResponse>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'apple', token: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  continueAsGuest: (email?: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

function extractCustomerFromToken(token: string): CustomerUser | null {
  const payload = decodeCustomerToken(token);
  if (!payload?.sub) return null;
  return {
    id: payload.sub,
    email: payload.email,
    phone: payload.phone,
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    isGuest: payload.isGuest ?? false,
  };
}

function initToken(): string | null {
  const token = getCustomerToken();
  if (token && isCustomerTokenExpired(token)) {
    removeCustomerToken();
    return null;
  }
  return token;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => initToken());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const synced = initToken();
    if (synced !== token) {
      setToken(synced);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToken = useCallback((jwt: string) => {
    setCustomerToken(jwt);
    setToken(jwt);
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await customerApiClient.post<LoginResponse>(
          '/v1/storefront/auth/login',
          { email, password },
        );
        const jwt = data.accessToken || data.access_token;
        if (!jwt) {
          throw new Error('No access token in response');
        }
        handleToken(jwt);
      } finally {
        setIsLoading(false);
      }
    },
    [handleToken],
  );

  const loginWithPhone = useCallback(async (phone: string): Promise<OtpResponse> => {
    setIsLoading(true);
    try {
      await customerApiClient.post('/v1/storefront/auth/phone-verify/send', { phone });
      return { requiresOtp: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, code: string): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await customerApiClient.post<LoginResponse>(
          '/v1/storefront/auth/phone-verify/confirm',
          { phone, code },
        );
        const jwt = data.accessToken || data.access_token;
        if (!jwt) {
          throw new Error('No access token in response');
        }
        handleToken(jwt);
      } finally {
        setIsLoading(false);
      }
    },
    [handleToken],
  );

  const loginWithSocial = useCallback(
    async (provider: 'google' | 'apple', socialToken: string): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await customerApiClient.post<LoginResponse>(
          '/v1/storefront/auth/social-login',
          { provider, token: socialToken },
        );
        const jwt = data.accessToken || data.access_token;
        if (!jwt) {
          throw new Error('No access token in response');
        }
        handleToken(jwt);
      } finally {
        setIsLoading(false);
      }
    },
    [handleToken],
  );

  const register = useCallback(
    async (registerData: RegisterData): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await customerApiClient.post<LoginResponse>(
          '/v1/storefront/auth/register',
          registerData,
        );
        const jwt = data.accessToken || data.access_token;
        if (!jwt) {
          throw new Error('No access token in response');
        }
        handleToken(jwt);
      } finally {
        setIsLoading(false);
      }
    },
    [handleToken],
  );

  const continueAsGuest = useCallback(
    async (email?: string, phone?: string): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await customerApiClient.post<LoginResponse>(
          '/v1/storefront/auth/guest',
          { email, phone },
        );
        const jwt = data.accessToken || data.access_token;
        if (!jwt) {
          throw new Error('No access token in response');
        }
        handleToken(jwt);
      } finally {
        setIsLoading(false);
      }
    },
    [handleToken],
  );

  const logout = useCallback(() => {
    removeCustomerToken();
    setToken(null);
  }, []);

  const value = useMemo<CustomerAuthContextType>(() => {
    const customer = token ? extractCustomerFromToken(token) : null;
    const isAuthenticated = !!token && !!customer;
    const isGuest = customer?.isGuest ?? false;

    return {
      customer,
      isAuthenticated,
      isGuest,
      isLoading,
      loginWithEmail,
      loginWithPhone,
      verifyOtp,
      loginWithSocial,
      register,
      continueAsGuest,
      logout,
    };
  }, [
    token,
    isLoading,
    loginWithEmail,
    loginWithPhone,
    verifyOtp,
    loginWithSocial,
    register,
    continueAsGuest,
    logout,
  ]);

  return <CustomerAuthContext value={value}>{children}</CustomerAuthContext>;
}

export function useCustomerAuth(): CustomerAuthContextType {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
