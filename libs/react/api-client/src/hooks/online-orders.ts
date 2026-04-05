import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApiClient } from '@bake-app/react/customer-auth';

export const onlineOrderKeys = {
  all: ['online-orders'] as const,
  lists: () => [...onlineOrderKeys.all, 'list'] as const,
  list: () => [...onlineOrderKeys.lists()] as const,
  details: () => [...onlineOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...onlineOrderKeys.details(), id] as const,
  history: () => [...onlineOrderKeys.all, 'history'] as const,
};

export function useCreateOnlineOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      customerApiClient.post('/v1/storefront/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onlineOrderKeys.lists() });
      qc.invalidateQueries({ queryKey: onlineOrderKeys.history() });
    },
  });
}

export function useOnlineOrder(id: string) {
  return useQuery({
    queryKey: onlineOrderKeys.detail(id),
    queryFn: () => customerApiClient.get(`/v1/storefront/orders/${id}`),
    enabled: !!id,
  });
}

export function useOnlineOrderHistory() {
  return useQuery({
    queryKey: onlineOrderKeys.history(),
    queryFn: () => customerApiClient.get('/v1/storefront/me/orders'),
  });
}

export function useCancelOnlineOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customerApiClient.post(`/v1/storefront/orders/${id}/cancel`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: onlineOrderKeys.detail(id) });
      qc.invalidateQueries({ queryKey: onlineOrderKeys.history() });
    },
  });
}
