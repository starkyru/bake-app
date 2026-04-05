import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApiClient } from '@bake-app/react/customer-auth';

export const customerAddressKeys = {
  all: ['customer-addresses'] as const,
  lists: () => [...customerAddressKeys.all, 'list'] as const,
  list: () => [...customerAddressKeys.lists()] as const,
};

export function useCustomerAddresses() {
  return useQuery({
    queryKey: customerAddressKeys.list(),
    queryFn: () => customerApiClient.get('/v1/storefront/me/addresses'),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      customerApiClient.post('/v1/storefront/me/addresses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerAddressKeys.lists() });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      customerApiClient.put(`/v1/storefront/me/addresses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerAddressKeys.lists() });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customerApiClient.delete(`/v1/storefront/me/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerAddressKeys.lists() });
    },
  });
}
