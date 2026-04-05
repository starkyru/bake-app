import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApiClient } from '@bake-app/react/customer-auth';

export const customOrderKeys = {
  all: ['custom-orders'] as const,
  lists: () => [...customOrderKeys.all, 'list'] as const,
  list: () => [...customOrderKeys.lists()] as const,
};

export function useCreateCustomOrderRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      customerApiClient.post('/v1/storefront/custom-orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customOrderKeys.lists() });
    },
  });
}

export function useCustomerCustomOrders() {
  return useQuery({
    queryKey: customOrderKeys.list(),
    queryFn: () => customerApiClient.get('/v1/storefront/custom-orders'),
  });
}

export function useApproveCustomOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customerApiClient.post(`/v1/storefront/custom-orders/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customOrderKeys.lists() });
    },
  });
}

export function useRejectCustomOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customerApiClient.post(`/v1/storefront/custom-orders/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customOrderKeys.lists() });
    },
  });
}
