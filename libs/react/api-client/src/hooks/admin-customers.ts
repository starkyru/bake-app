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
    queryFn: () => apiClient.get('/v1/admin/customers', query),
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
    queryFn: () => apiClient.get('/v1/admin/customers/lookup', { query }),
    enabled: !!query && query.length >= 2,
  });
}

// Aliases used by admin pages
export const useOnlineCustomers = useAdminCustomers;
export const useOnlineCustomer = useAdminCustomerDetail;

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: [...adminCustomerKeys.detail(customerId), 'orders'] as const,
    queryFn: () => apiClient.get(`/v1/admin/customers/${customerId}/orders`),
    enabled: !!customerId,
  });
}
