import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Role } from '@bake-app/shared-types';

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => apiClient.get<Role[]>('/v1/roles'),
  });
}
