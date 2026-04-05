const CUSTOMER_TOKEN_KEY = 'customer_token';

function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function setCustomerToken(token: string): void {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

function removeCustomerToken(): void {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

async function customerApiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getCustomerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (response.status === 401) {
    removeCustomerToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const customerApiClient = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return customerApiFetch<T>(`${path}${buildQuery(params)}`);
  },

  post<T>(path: string, data?: unknown): Promise<T> {
    return customerApiFetch<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(path: string, data?: unknown): Promise<T> {
    return customerApiFetch<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return customerApiFetch<T>(path, { method: 'DELETE' });
  },
};

export { getCustomerToken, setCustomerToken, removeCustomerToken, CUSTOMER_TOKEN_KEY };
