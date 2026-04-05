import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const adminCustomOrderKeys = {
  all: ['admin-custom-orders'] as const,
  lists: () => [...adminCustomOrderKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...adminCustomOrderKeys.lists(), params] as const,
  details: () => [...adminCustomOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCustomOrderKeys.details(), id] as const,
};

export function useAdminCustomOrders(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminCustomOrderKeys.list(query),
    queryFn: async () => {
      const res = await apiClient.get<any>('/v1/admin/custom-orders', query);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });
}

export function useAdminCustomOrderDetail(id: string) {
  return useQuery({
    queryKey: adminCustomOrderKeys.detail(id),
    queryFn: () => apiClient.get(`/v1/admin/custom-orders/${id}`),
    enabled: !!id,
  });
}

export function useAdminApproveCustomOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      apiClient.post(`/v1/admin/custom-orders/${id}/approve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.details() });
    },
  });
}

export function useAdminRejectCustomOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post(`/v1/admin/custom-orders/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.details() });
    },
  });
}

// Aliases used by admin pages
export const useCustomOrderRequests = useAdminCustomOrders;
export const useCustomOrderRequest = useAdminCustomOrderDetail;

export function useUpdateCustomOrderRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      apiClient.put(`/v1/admin/custom-orders/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.detail(id) });
    },
  });
}

export function useAdminQuoteCustomOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      apiClient.post(`/v1/admin/custom-orders/${id}/quote`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: adminCustomOrderKeys.detail(id) });
    },
  });
}
