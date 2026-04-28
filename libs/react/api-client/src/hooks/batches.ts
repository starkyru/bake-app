import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...batchKeys.lists(), params] as const,
  details: () => [...batchKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchKeys.details(), id] as const,
  forRecipe: (recipeId: string) =>
    [...batchKeys.all, 'for-recipe', recipeId] as const,
  expiring: (params?: { hours?: number; locationId?: string }) =>
    [...batchKeys.all, 'expiring', params] as const,
  stats: (locationId?: string) =>
    [...batchKeys.all, 'stats', locationId] as const,
};

export function useBatches(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: batchKeys.list(params),
    queryFn: () => apiClient.get<any>('/v1/production/batches', params),
  });
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: batchKeys.detail(id),
    queryFn: () => apiClient.get<any>(`/v1/production/batches/${id}`),
    enabled: !!id,
  });
}

export function useBatchesForRecipe(recipeId: string, locationId?: string) {
  return useQuery({
    queryKey: batchKeys.forRecipe(recipeId),
    queryFn: () =>
      apiClient.get<any>(
        `/v1/production/batches/available/${recipeId}`,
        locationId ? { locationId } : undefined,
      ),
    enabled: !!recipeId,
  });
}

export function useExpiringBatches(
  hours?: number,
  locationId?: string,
  options?: { refetchInterval?: number },
) {
  const params: Record<string, unknown> = {};
  if (hours !== undefined) params.hours = hours;
  if (locationId) params.locationId = locationId;

  return useQuery({
    queryKey: batchKeys.expiring({ hours, locationId }),
    queryFn: () =>
      apiClient.get<any>(
        '/v1/production/batches/expiring-soon',
        Object.keys(params).length > 0 ? params : undefined,
      ),
    ...(options?.refetchInterval
      ? { refetchInterval: options.refetchInterval }
      : {}),
  });
}

export function useBatchStats(locationId?: string) {
  return useQuery({
    queryKey: batchKeys.stats(locationId),
    queryFn: () =>
      apiClient.get<any>(
        '/v1/production/batches/stats',
        locationId ? { locationId } : undefined,
      ),
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<any>('/v1/production/batches', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.lists() });
    },
  });
}

export function useConsumeBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.post<any>(`/v1/production/batches/${id}/consume`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.all });
    },
  });
}

export function useDiscardBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.post<any>(`/v1/production/batches/${id}/discard`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.all });
    },
  });
}

export function useTransferBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.post<any>(`/v1/production/batches/${id}/transfer`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.all });
    },
  });
}
