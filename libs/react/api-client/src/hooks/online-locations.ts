import { useQuery } from '@tanstack/react-query';
import { customerApiClient } from '@bake-app/react/customer-auth';

export const onlineLocationKeys = {
  all: ['online-locations'] as const,
  lists: () => [...onlineLocationKeys.all, 'list'] as const,
  list: () => [...onlineLocationKeys.lists()] as const,
  details: () => [...onlineLocationKeys.all, 'detail'] as const,
  detail: (id: string) => [...onlineLocationKeys.details(), id] as const,
};

export function useOnlineLocations() {
  return useQuery({
    queryKey: onlineLocationKeys.list(),
    queryFn: () => customerApiClient.get('/v1/storefront/locations'),
  });
}

export function useOnlineLocationDetail(id: string) {
  return useQuery({
    queryKey: onlineLocationKeys.detail(id),
    queryFn: () => customerApiClient.get(`/v1/storefront/locations/${id}`),
    enabled: !!id,
  });
}
