import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const adminOnlineOrderKeys = {
  all: ['admin-online-orders'] as const,
  lists: () => [...adminOnlineOrderKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...adminOnlineOrderKeys.lists(), params] as const,
  pendingApproval: () => [...adminOnlineOrderKeys.all, 'pending-approval'] as const,
};

export function useAdminOnlineOrders(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminOnlineOrderKeys.list(query),
    queryFn: () => apiClient.get('/v1/admin/online-orders', query),
  });
}

export function useAdminOnlineOrder(id: string) {
  return useQuery({
    queryKey: [...adminOnlineOrderKeys.all, 'detail', id] as const,
    queryFn: () => apiClient.get(`/v1/admin/online-orders/${id}`),
    enabled: !!id,
  });
}

export function usePendingApprovalOrders() {
  return useQuery({
    queryKey: adminOnlineOrderKeys.pendingApproval(),
    queryFn: () => apiClient.get('/v1/admin/online-orders/pending-approval'),
  });
}

export function useApproveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/v1/admin/online-orders/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminOnlineOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: adminOnlineOrderKeys.pendingApproval() });
    },
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post(`/v1/admin/online-orders/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminOnlineOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: adminOnlineOrderKeys.pendingApproval() });
    },
  });
}
