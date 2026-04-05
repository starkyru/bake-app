import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const adminCustomerKeys = {
  all: ['admin-customers'] as const,
  lists: () => [...adminCustomerKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...adminCustomerKeys.lists(), params] as const,
  details: () => [...adminCustomerKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCustomerKeys.details(), id] as const,
  lookup: (query: string) => [...adminCustomerKeys.all, 'lookup', query] as const,
};

export function useAdminCustomers(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminCustomerKeys.list(query),
    queryFn: async () => {
      const res = await apiClient.get<any>('/v1/admin/customers', query);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });
}

export function useAdminCustomerDetail(id: string) {
  return useQuery({
    queryKey: adminCustomerKeys.detail(id),
    queryFn: () => apiClient.get(`/v1/admin/customers/${id}`),
    enabled: !!id,
  });
}

export function useCustomerLookup(query: string) {
  return useQuery({
    queryKey: adminCustomerKeys.lookup(query),
    queryFn: () => {
      // Backend accepts phone or email as separate query params
      const isEmail = query.includes('@');
      const params = isEmail ? { email: query } : { phone: query };
      return apiClient.get('/v1/admin/customers/lookup', params);
    },
    enabled: !!query && query.length >= 2,
  });
}

// Aliases used by admin pages
export const useOnlineCustomers = useAdminCustomers;
export const useOnlineCustomer = useAdminCustomerDetail;

export function useCustomerOrders(customerId: string) {
  // Customer orders are included in the detail response as `recentOrders`
  // There is no separate /orders endpoint — use useAdminCustomerDetail instead
  return useQuery({
    queryKey: [...adminCustomerKeys.detail(customerId), 'orders'] as const,
    queryFn: async () => {
      const detail = await apiClient.get<any>(`/v1/admin/customers/${customerId}`);
      return detail?.recentOrders ?? [];
    },
    enabled: !!customerId,
  });
}
