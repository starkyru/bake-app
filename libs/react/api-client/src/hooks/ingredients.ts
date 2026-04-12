import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Ingredient } from '@bake-app/shared-types';

export const ingredientKeys = {
  all: ['ingredients'] as const,
  lists: () => [...ingredientKeys.all, 'list'] as const,
  list: (params?: { category?: string }) =>
    [...ingredientKeys.lists(), params] as const,
};

export function useIngredients(params?: { category?: string }) {
  return useQuery({
    queryKey: ingredientKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get<any>('/v1/ingredients', { limit: 1000, ...params });
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ingredient>) =>
      apiClient.post<Ingredient>('/v1/ingredients', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ingredientKeys.all });
    },
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Ingredient> & { id: string }) =>
      apiClient.put<Ingredient>(`/v1/ingredients/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ingredientKeys.all });
    },
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/v1/ingredients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ingredientKeys.all });
    },
  });
}
