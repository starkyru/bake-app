import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { ProductionPlan } from '@bake-app/shared-types';

export const productionKeys = {
  all: ['production'] as const,
  plans: () => [...productionKeys.all, 'plans'] as const,
  planList: (params?: { date?: string; locationId?: string }) =>
    [...productionKeys.plans(), params] as const,
  planDetails: () => [...productionKeys.all, 'plan-detail'] as const,
  planDetail: (id: string) =>
    [...productionKeys.planDetails(), id] as const,
};

export function useProductionPlans(params?: {
  date?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: productionKeys.planList(params),
    queryFn: () =>
      apiClient.get<ProductionPlan[]>('/v1/production/plans', params),
  });
}

export function useProductionPlan(id: string) {
  return useQuery({
    queryKey: productionKeys.planDetail(id),
    queryFn: () =>
      apiClient.get<ProductionPlan>(`/v1/production/plans/${id}`),
    enabled: !!id,
  });
}

export function useCreateProductionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductionPlan>) =>
      apiClient.post<ProductionPlan>('/v1/production/plans', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productionKeys.plans() });
    },
  });
}

export function useUpdateProductionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<ProductionPlan> & { id: string }) =>
      apiClient.put<ProductionPlan>(`/v1/production/plans/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: productionKeys.plans() });
      qc.invalidateQueries({ queryKey: productionKeys.planDetail(id) });
    },
  });
}

export function useDeleteProductionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.del(`/v1/production/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productionKeys.plans() });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      actualYield,
      wasteQuantity,
      storageCondition,
      locationId,
      batchConsumptions,
    }: {
      id: string;
      status: string;
      actualYield?: number;
      wasteQuantity?: number;
      storageCondition?: string;
      locationId?: string;
      batchConsumptions?: { batchId: string; quantity: number }[];
    }) =>
      apiClient.put(`/v1/production/tasks/${id}/status`, {
        status,
        actualYield,
        wasteQuantity,
        storageCondition,
        locationId,
        batchConsumptions,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productionKeys.all });
    },
  });
}
