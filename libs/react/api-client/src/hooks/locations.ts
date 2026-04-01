import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Location } from '@bake-app/shared-types';

export const locationKeys = {
  all: ['locations'] as const,
  list: () => [...locationKeys.all, 'list'] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: locationKeys.list(),
    queryFn: () => apiClient.get<Location[]>('/v1/locations'),
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Location>) =>
      apiClient.post<Location>('/v1/locations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Location> & { id: string }) =>
      apiClient.put<Location>(`/v1/locations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/v1/locations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}
