import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Order, Payment } from '@bake-app/shared-types';
import type { PaginatedResponse } from '../types';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: { limit?: number; page?: number }) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function useOrders(params?: { limit?: number; page?: number }) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Order>>('/v1/orders', params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiClient.get<Order>(`/v1/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Order>) =>
      apiClient.post<Order>('/v1/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put<Order>(`/v1/orders/${id}/status`, { status }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      ...data
    }: Partial<Payment> & { orderId: string }) =>
      apiClient.post<Payment>(`/v1/orders/${orderId}/payments`, data),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
