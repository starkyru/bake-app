import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const adminStorefrontKeys = {
  all: ['admin-storefront'] as const,
  config: (locationId?: string) =>
    [...adminStorefrontKeys.all, 'config', locationId] as const,
  paymentConfigs: () => [...adminStorefrontKeys.all, 'payment-configs'] as const,
};

export function useStorefrontConfig(locationId?: string) {
  return useQuery({
    queryKey: adminStorefrontKeys.config(locationId),
    queryFn: () =>
      apiClient.get('/v1/admin/storefront/config', locationId ? { locationId } : undefined),
  });
}

export function useUpdateStorefrontConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { locationId?: string; [key: string]: unknown }) =>
      apiClient.put('/v1/admin/storefront/config', data),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminStorefrontKeys.config(locationId),
      });
    },
  });
}

export function usePaymentConfigs() {
  return useQuery({
    queryKey: adminStorefrontKeys.paymentConfigs(),
    queryFn: () => apiClient.get('/v1/admin/payment-providers'),
  });
}

export function useCreatePaymentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      apiClient.post('/v1/admin/payment-providers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminStorefrontKeys.paymentConfigs() });
    },
  });
}

export function useUpdatePaymentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      apiClient.put(`/v1/admin/payment-providers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminStorefrontKeys.paymentConfigs() });
    },
  });
}

export function useDeletePaymentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.del(`/v1/admin/payment-providers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminStorefrontKeys.paymentConfigs() });
    },
  });
}
