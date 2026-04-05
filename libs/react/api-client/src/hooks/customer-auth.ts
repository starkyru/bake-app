import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApiClient } from '@bake-app/react/customer-auth';

export const customerAuthKeys = {
  all: ['customer-auth'] as const,
  profile: () => [...customerAuthKeys.all, 'profile'] as const,
};

export function useCustomerRegister() {
  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => customerApiClient.post('/v1/storefront/auth/register', data),
  });
}

export function useCustomerLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      customerApiClient.post('/v1/storefront/auth/login', data),
  });
}

export function useCustomerProfile() {
  return useQuery({
    queryKey: customerAuthKeys.profile(),
    queryFn: () => customerApiClient.get('/v1/storefront/me'),
  });
}

export function useUpdateCustomerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) => customerApiClient.put('/v1/storefront/me', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerAuthKeys.profile() });
    },
  });
}
